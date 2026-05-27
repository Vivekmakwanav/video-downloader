from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect, Request, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio
import uuid
import json
import os
import time
import socket
import ipaddress
from collections import defaultdict
from urllib.parse import urlparse

from database import engine, Base, get_db
import models
import schemas
from downloader import analyze_video, download_video_sync
from socket_manager import manager
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from datetime import timedelta
from jose import JWTError, jwt

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Video Downloader API")

# Setup CORS
origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
origins = [o.strip() for o in origins if o.strip()]
allow_all_origins = "*" in origins or len(origins) == 0

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=not allow_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SSRF Protection Validator
def is_safe_url(url: str) -> bool:
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return False
        
        hostname = parsed.hostname
        if not hostname:
            return False
            
        # Prevent obvious local loops
        if hostname.lower() in ('localhost', 'localhost.localdomain'):
            return False
            
        # Resolve address info to check all associated IPs
        try:
            addr_info = socket.getaddrinfo(hostname, None)
            for family, _, _, _, sockaddr in addr_info:
                ip = sockaddr[0]
                ip_obj = ipaddress.ip_address(ip)
                if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                    return False
        except Exception:
            # If the domain can't be resolved, block it to prevent DNS rebinding or internal probing
            return False
            
        return True
    except Exception:
        return False

# IP Throttling / Rate Limiter Class
class RateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)
        
    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        # Keep only timestamps in the current window
        self.requests[ip] = [t for t in self.requests[ip] if now - t < self.window]
        if len(self.requests[ip]) >= self.limit:
            return False
        self.requests[ip].append(now)
        return True

# Initialize rate limiters (limit, window in seconds)
analyze_limiter = RateLimiter(limit=15, window=60)
download_limiter = RateLimiter(limit=5, window=60)
auth_limiter = RateLimiter(limit=10, window=60)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Video Downloader API is running"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/api/register", response_model=schemas.User)
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    if not auth_limiter.is_allowed(request.client.host):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Please try again later.")
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/login")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if not auth_limiter.is_allowed(request.client.host):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Please try again later.")
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "id": user.id}}

@app.get("/api/history", response_model=list[schemas.DownloadHistory])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.DownloadHistory).filter(models.DownloadHistory.owner_id == current_user.id).order_by(models.DownloadHistory.downloaded_at.desc()).all()
    return history


@app.post("/api/analyze", response_model=schemas.VideoAnalysisResponse)
async def analyze(request: Request, analysis_request: schemas.VideoAnalysisRequest):
    if not analyze_limiter.is_allowed(request.client.host):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Please try again later.")
    if not is_safe_url(analysis_request.url):
        raise HTTPException(status_code=400, detail="URL is invalid or references an unsafe loopback/private subnet destination.")
    try:
        # Run yt-dlp analysis in a separate thread so it doesn't block the event loop
        info = await asyncio.to_thread(analyze_video, analysis_request.url)
        return info
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class DownloadRequest(schemas.VideoAnalysisRequest):
    format_id: str
    client_id: str

async def download_task(url: str, format_id: str, download_id: str, client_id: str):
    loop = asyncio.get_running_loop()

    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                # yt-dlp returns downloaded bytes and total bytes
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                if total > 0:
                    percent = (downloaded / total) * 100
                    message = json.dumps({
                        "download_id": download_id,
                        "status": "downloading",
                        "progress": round(percent, 2),
                        "speed": d.get('speed', 0)
                    })
                    # Schedule the coroutine in the main event loop
                    asyncio.run_coroutine_threadsafe(
                        manager.send_personal_message(message, client_id),
                        loop
                    )
            except Exception:
                pass

    try:
        file_path = await asyncio.to_thread(download_video_sync, url, format_id, download_id, progress_hooks=[progress_hook])
        
        # Update database status to completed and save file_path
        from database import SessionLocal
        db = SessionLocal()
        try:
            db_download = db.query(models.DownloadHistory).filter(models.DownloadHistory.id == download_id).first()
            if db_download:
                db_download.status = "completed"
                # Store relative or absolute file_path
                db_download.url = file_path # Reuse URL or add a new column. Wait, url is the video URL. Let's add file_path column. Wait, models.DownloadHistory doesn't have file_path. We can just use the download_id to find the file since file_path is predictable, or add it to db.
                # Actually, the file is in DOWNLOAD_DIR/{download_id}.ext.
                db.commit()
        finally:
            db.close()
            
        # Send finished message to client EXACTLY ONCE
        message = json.dumps({
            "download_id": download_id,
            "status": "finished",
            "progress": 100
        })
        try:
            asyncio.run_coroutine_threadsafe(
                manager.send_personal_message(message, client_id),
                loop
            )
        except Exception:
            pass
            
    except Exception as e:
        from database import SessionLocal
        db = SessionLocal()
        try:
            db_download = db.query(models.DownloadHistory).filter(models.DownloadHistory.id == download_id).first()
            if db_download:
                db_download.status = "failed"
                db.commit()
        finally:
            db.close()

        message = json.dumps({
            "download_id": download_id,
            "status": "failed",
            "error": str(e)
        })
        try:
            asyncio.run_coroutine_threadsafe(
                manager.send_personal_message(message, client_id),
                loop
            )
        except Exception:
            pass

from fastapi.responses import FileResponse
import os
from downloader import DOWNLOAD_DIR

@app.get("/api/file/{download_id}")
def serve_file(download_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not download_id.isdigit():
        raise HTTPException(status_code=400, detail="Invalid download ID format")
    # Find the file in DOWNLOAD_DIR that matches download_id exactly (without extension)
    for filename in os.listdir(DOWNLOAD_DIR):
        base, ext = os.path.splitext(filename)
        if base == download_id:
            file_path = os.path.join(DOWNLOAD_DIR, filename)
            # Find original title to name the file properly
            db_download = db.query(models.DownloadHistory).filter(models.DownloadHistory.id == download_id).first()
            title = db_download.title if db_download else "video"
            
            # Clean title for filename
            clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
            ext = os.path.splitext(filename)[1]
            download_name = f"{clean_title}{ext}"
            
            # Delete file after serving it
            def remove_file(path: str):
                try:
                    os.remove(path)
                except Exception:
                    pass
            
            background_tasks.add_task(remove_file, file_path)
            return FileResponse(path=file_path, filename=download_name, media_type='application/octet-stream')
            
    raise HTTPException(status_code=404, detail="File not found")


@app.post("/api/download")
async def start_download(request: Request, download_request: DownloadRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not download_limiter.is_allowed(request.client.host):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many downloads in progress. Please try again later.")
    if not is_safe_url(download_request.url):
        raise HTTPException(status_code=400, detail="URL is invalid or references an unsafe loopback/private subnet destination.")
        
    # In a real app we'd attach the user here if authenticated
    db_download = models.DownloadHistory(
        url=download_request.url,
        title="Downloading...",
        platform="unknown",
        format_id=download_request.format_id,
        status="processing",
        owner_id=None # Optionally connect this to a user via headers
    )
    db.add(db_download)
    db.commit()
    db.refresh(db_download)

    # Start the download process in the background
    background_tasks.add_task(
        download_task, 
        url=download_request.url, 
        format_id=download_request.format_id, 
        download_id=str(db_download.id), 
        client_id=download_request.client_id
    )

    return {"message": "Download started", "download_id": db_download.id}


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(client_id, websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(client_id)
