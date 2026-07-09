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
from typing import Optional

from database import engine, Base, get_db
import models
import schemas
from downloader import analyze_video, download_video_sync, download_subtitles_sync, convert_mp4_to_mp3_sync
from socket_manager import manager
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM
from datetime import timedelta
from jose import JWTError, jwt

# Monkeypatch socket.getaddrinfo to prevent DNS Rebinding / SSRF globally at connection time
_original_getaddrinfo = socket.getaddrinfo

def _safe_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    res = _original_getaddrinfo(host, port, family, type, proto, flags)
    for fam, _, _, _, sockaddr in res:
        ip = sockaddr[0]
        try:
            ip_obj = ipaddress.ip_address(ip)
            if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_link_local:
                raise socket.gaierror(f"SSRF Prevention: Connection to private subnet IP {ip} is blocked.")
        except ValueError:
            pass
    return res

socket.getaddrinfo = _safe_getaddrinfo

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

# Hybrid Stateless/Stateful Rate Limiter Class
import redis

class RateLimiter:
    def __init__(self, limit: int, window: int, key_prefix: str):
        self.limit = limit
        self.window = window
        self.key_prefix = key_prefix
        self.local_requests = defaultdict(list)
        self.redis_client = None
        
        # Try connecting to Redis if REDIS_URL is configured
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            try:
                self.redis_client = redis.Redis.from_url(redis_url, socket_timeout=1, socket_connect_timeout=1)
                self.redis_client.ping()
            except Exception:
                import sys
                print(f"WARNING: Failed to connect to Redis at {redis_url}. Rate limiter falling back to in-memory mode.", file=sys.stderr)
                self.redis_client = None
        
    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        
        # Try Redis Rate Limiting (stateless sliding window)
        if self.redis_client:
            try:
                key = f"rate_limit:{self.key_prefix}:{ip}"
                pipe = self.redis_client.pipeline()
                pipe.zremrangebyscore(key, 0, now - self.window)
                pipe.zcard(key)
                pipe.zadd(key, {str(now): now})
                pipe.expire(key, self.window)
                _, count, _, _ = pipe.execute()
                
                if count >= self.limit:
                    return False
                return True
            except Exception:
                # Fallback to local in-memory on Redis error
                pass
                
        # Local In-Memory Fallback
        self.local_requests[ip] = [t for t in self.local_requests[ip] if now - t < self.window]
        if len(self.local_requests[ip]) >= self.limit:
            return False
        self.local_requests[ip].append(now)
        return True

# Initialize rate limiters (limit, window in seconds, prefix)
analyze_limiter = RateLimiter(limit=15, window=60, key_prefix="analyze")
download_limiter = RateLimiter(limit=5, window=60, key_prefix="download")
auth_limiter = RateLimiter(limit=10, window=60, key_prefix="auth")

# Concurrency Limiter: limit parallel downloads to avoid CPU/network starvation
download_semaphore = asyncio.Semaphore(2)

# Background Daemon Thread to clean up orphaned downloads (> 2 hours old)
import threading
from downloader import DOWNLOAD_DIR

def cleanup_old_files():
    while True:
        try:
            now = time.time()
            if os.path.exists(DOWNLOAD_DIR):
                for filename in os.listdir(DOWNLOAD_DIR):
                    file_path = os.path.join(DOWNLOAD_DIR, filename)
                    if os.path.isfile(file_path) and os.path.getmtime(file_path) < now - 7200:
                        try:
                            os.remove(file_path)
                        except Exception:
                            pass
        except Exception:
            pass
        time.sleep(1800) # Run every 30 minutes
        
cleanup_thread = threading.Thread(target=cleanup_old_files, daemon=True)
cleanup_thread.start()

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

@app.post("/api/analyze/batch", response_model=list[schemas.VideoAnalysisResponse])
async def analyze_batch(request: Request, batch_request: schemas.BatchAnalysisRequest):
    if not analyze_limiter.is_allowed(request.client.host):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Please try again later.")
    
    # Restrict to max 5 URLs
    urls = batch_request.urls[:5]
    safe_urls = [url for url in urls if is_safe_url(url)]
    if not safe_urls:
        raise HTTPException(status_code=400, detail="No valid/safe URLs provided.")
        
    async def safe_analyze(url: str):
        try:
            return await asyncio.to_thread(analyze_video, url)
        except Exception as e:
            return {
                'url': url,
                'title': f"Error: Failed to analyze video ({str(e)})",
                'thumbnail': '',
                'duration': 0,
                'platform': 'Unknown',
                'video_id': '',
                'formats': [],
                'subtitles': []
            }
            
    results = await asyncio.gather(*(safe_analyze(url) for url in safe_urls))
    return results

@app.post("/api/subtitles/download")
async def start_subtitle_download(request: Request, sub_request: schemas.SubtitleDownloadRequest, background_tasks: BackgroundTasks):
    if not download_limiter.is_allowed(request.client.host):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests. Please try again later.")
    if not is_safe_url(sub_request.url):
        raise HTTPException(status_code=400, detail="URL is invalid or references an unsafe destination.")
        
    download_id = str(uuid.uuid4().int)[:10]
    try:
        file_path = await asyncio.to_thread(
            download_subtitles_sync,
            sub_request.url,
            sub_request.lang,
            sub_request.is_auto,
            download_id
        )
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Subtitle file not found.")
            
        def remove_file(path: str):
            try:
                os.remove(path)
            except Exception:
                pass
                
        background_tasks.add_task(remove_file, file_path)
        
        download_name = f"subtitles_{sub_request.lang}.srt"
        return FileResponse(path=file_path, filename=download_name, media_type='text/srt')
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class DownloadRequest(schemas.VideoAnalysisRequest):
    format_id: str
    client_id: str
    start_time: Optional[int] = None
    end_time: Optional[int] = None

async def download_task(url: str, format_id: str, download_id: str, client_id: str, start_time: Optional[int] = None, end_time: Optional[int] = None):
    loop = asyncio.get_running_loop()

    last_update = {'time': 0.0, 'percent': 0.0}

    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                # yt-dlp returns downloaded bytes and total bytes
                downloaded = d.get('downloaded_bytes', 0)
                total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
                if total > 0:
                    percent = (downloaded / total) * 100
                    now = time.time()
                    
                    # Only send progress updates if progress increases by >= 1% OR >= 0.5s elapsed
                    if (percent - last_update['percent'] >= 1.0) or (now - last_update['time'] >= 0.5):
                        last_update['percent'] = percent
                        last_update['time'] = now
                        
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
        async with download_semaphore:
            file_path = await asyncio.to_thread(
                download_video_sync, 
                url, 
                format_id, 
                download_id, 
                progress_hooks=[progress_hook],
                start_time=start_time,
                end_time=end_time
            )
            
            # Update database status to completed and save file_path
            from database import SessionLocal
            db = SessionLocal()
            try:
                db_download = db.query(models.DownloadHistory).filter(models.DownloadHistory.id == download_id).first()
                if db_download:
                    db_download.status = "completed"
                    db_download.file_path = file_path
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
        
    db_download = db.query(models.DownloadHistory).filter(models.DownloadHistory.id == int(download_id)).first()
    if not db_download or not db_download.file_path:
        raise HTTPException(status_code=404, detail="File path not found in history")
        
    file_path = db_download.file_path
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
        
    title = db_download.title or "video"
    # Clean title for filename
    clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
    ext = os.path.splitext(file_path)[1]
    download_name = f"{clean_title}{ext}"
    
    # Delete file after serving it
    def remove_file(path: str):
        try:
            os.remove(path)
        except Exception:
            pass
    
    background_tasks.add_task(remove_file, file_path)
    return FileResponse(path=file_path, filename=download_name, media_type='application/octet-stream')

@app.post("/api/convert-to-mp3")
async def convert_to_mp3(request: Request, convert_req: schemas.ConvertRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_download = db.query(models.DownloadHistory).filter(models.DownloadHistory.id == convert_req.download_id).first()
    if not db_download or not db_download.file_path:
        raise HTTPException(status_code=404, detail="Source download history not found.")
        
    source_path = db_download.file_path
    if not os.path.exists(source_path):
        raise HTTPException(status_code=404, detail="Source video file not found on disk.")
        
    base_path, _ = os.path.splitext(source_path)
    output_path = f"{base_path}.mp3"
    
    try:
        await asyncio.to_thread(convert_mp4_to_mp3_sync, source_path, output_path)
        
        # Clean title: append " (Audio)" to make the filename clear
        clean_title = db_download.title or "video"
        if clean_title.endswith("..."):
            clean_title = "Audio Download"
            
        new_download = models.DownloadHistory(
            url=db_download.url,
            title=f"{clean_title} (Audio)",
            platform=db_download.platform,
            format_id="bestaudio",
            status="completed",
            file_path=output_path,
            owner_id=db_download.owner_id
        )
        db.add(new_download)
        db.commit()
        db.refresh(new_download)
        
        # Delete source video to optimize server disk space
        def remove_file(path: str):
            try:
                os.remove(path)
            except Exception:
                pass
        background_tasks.add_task(remove_file, source_path)
        
        return {"message": "Conversion completed", "download_id": new_download.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/download/zip")
async def download_zip(request: Request, zip_req: schemas.ZipRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_downloads = db.query(models.DownloadHistory).filter(models.DownloadHistory.id.in_(zip_req.download_ids)).all()
    if not db_downloads:
        raise HTTPException(status_code=404, detail="No matching downloads found.")
        
    import zipfile
    
    zip_id = str(uuid.uuid4().int)[:10]
    zip_filename = f"batch_{zip_id}.zip"
    zip_path = os.path.join(DOWNLOAD_DIR, zip_filename)
    
    files_added = 0
    
    try:
        def create_zip_archive():
            nonlocal files_added
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for db_download in db_downloads:
                    if db_download.file_path and os.path.exists(db_download.file_path):
                        title = db_download.title or "video"
                        clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '-', '_')).rstrip()
                        ext = os.path.splitext(db_download.file_path)[1]
                        arcname = f"{clean_title}{ext}"
                        zip_file.write(db_download.file_path, arcname=arcname)
                        files_added += 1
                        
        await asyncio.to_thread(create_zip_archive)
        
        if files_added == 0:
            if os.path.exists(zip_path):
                os.remove(zip_path)
            raise HTTPException(status_code=400, detail="No source files are currently available on server disk to bundle.")
            
        new_download = models.DownloadHistory(
            url="batch://zip",
            title=f"Batch Download ({files_added} files)",
            platform="batch",
            format_id="zip",
            status="completed",
            file_path=zip_path,
            owner_id=None
        )
        db.add(new_download)
        db.commit()
        db.refresh(new_download)
        
        # Cleanup original files from server disk since they are now bundled in the ZIP
        def remove_sources():
            for db_download in db_downloads:
                if db_download.file_path and os.path.exists(db_download.file_path):
                    try:
                        os.remove(db_download.file_path)
                    except Exception:
                        pass
        background_tasks.add_task(remove_sources)
        
        return {"download_id": new_download.id}
    except Exception as e:
        if os.path.exists(zip_path):
            os.remove(zip_path)
        raise HTTPException(status_code=500, detail=str(e))


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
        client_id=download_request.client_id,
        start_time=download_request.start_time,
        end_time=download_request.end_time
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
