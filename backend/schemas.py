from pydantic import BaseModel, EmailStr
from typing import List, Optional
import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_premium: bool

    class Config:
        from_attributes = True

class DownloadHistoryBase(BaseModel):
    url: str
    title: str
    platform: str
    format_id: str
    status: str
    file_path: Optional[str] = None

class DownloadHistoryCreate(DownloadHistoryBase):
    pass

class DownloadHistory(DownloadHistoryBase):
    id: int
    downloaded_at: datetime.datetime
    owner_id: int

    class Config:
        from_attributes = True

class VideoAnalysisRequest(BaseModel):
    url: str

class VideoFormat(BaseModel):
    format_id: str
    ext: str
    resolution: str
    filesize: Optional[int]
    format_note: Optional[str]

class SubtitleLanguage(BaseModel):
    lang: str
    name: str
    is_auto: bool

class VideoAnalysisResponse(BaseModel):
    url: str
    title: str
    thumbnail: str
    duration: int
    platform: str
    video_id: str
    formats: List[VideoFormat]
    subtitles: List[SubtitleLanguage] = []

class SubtitleDownloadRequest(BaseModel):
    url: str
    lang: str
    is_auto: bool

class BatchAnalysisRequest(BaseModel):
    urls: List[str]
