import yt_dlp
import os
import uuid
import asyncio

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def analyze_video(url: str):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extract_flat': False,
        'remote_components': ['ejs:github']
    }
    
    cookies_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            
            # Extract basic info
            title = info.get('title', 'Unknown Title')
            thumbnail = info.get('thumbnail', '')
            duration = int(round(info.get('duration') or 0))
            extractor = info.get('extractor_key', 'Unknown')
            video_id = info.get('id', '')
            
            # Extract available formats
            audio_formats = [f for f in info.get('formats', []) if f.get('vcodec') == 'none' and f.get('ext') in ['m4a', 'webm']]
            best_audio = audio_formats[-1] if audio_formats else None
            
            formats = []
            seen_resolutions = set()
            
            # Sort formats by height to get highest quality first
            video_formats = sorted(
                [f for f in info.get('formats', []) if f.get('vcodec') != 'none'],
                key=lambda x: x.get('height', 0) or 0,
                reverse=True
            )
            
            for f in video_formats:
                w = f.get('width') or 0
                h = f.get('height') or 0
                # Use the smaller dimension to determine standard resolution (e.g. 1080p, 720p)
                # This ensures support for both horizontal and vertical/portrait (shorts/reels) video formats.
                resolution_val = min(w, h) if w and h else h
                
                if not resolution_val or resolution_val not in [2160, 1440, 1080, 720, 480, 360]:
                    continue
                
                res_label = f"{resolution_val}p"
                if res_label in seen_resolutions:
                    continue
                seen_resolutions.add(res_label)
                
                format_id = f.get('format_id')
                filesize = f.get('filesize') or f.get('filesize_approx') or 0
                
                # If no audio in this format, combine with best audio
                if f.get('acodec') == 'none' and best_audio:
                    format_id = f"{format_id}+{best_audio['format_id']}"
                    audio_size = best_audio.get('filesize') or best_audio.get('filesize_approx') or 0
                    filesize = filesize + audio_size
                
                formats.append({
                    'format_id': format_id,
                    'ext': 'mp4',
                    'resolution': res_label,
                    'filesize': filesize,
                    'format_note': f.get('format_note', 'HD' if resolution_val >= 720 else 'SD')
                })
                
            # Add audio only option
            if best_audio:
                formats.append({
                    'format_id': 'bestaudio',
                    'ext': 'mp3',
                    'resolution': 'Audio Only',
                    'filesize': best_audio.get('filesize') or best_audio.get('filesize_approx') or 0,
                    'format_note': 'High Quality Audio'
                })
            
            return {
                'url': url,
                'title': title,
                'thumbnail': thumbnail,
                'duration': duration,
                'platform': extractor,
                'video_id': video_id,
                'formats': formats
            }
        except yt_dlp.utils.DownloadError as e:
            raise Exception(f"Failed to analyze video: {str(e)}")

def download_video_sync(url: str, format_id: str, download_id: str, progress_hooks=None):
    file_path = os.path.join(DOWNLOAD_DIR, f"{download_id}.%(ext)s")
    
    # Determine the format string correctly depending on if it's audio only
    download_format = 'bestaudio/best' if format_id == 'bestaudio' else f'{format_id}+bestaudio/best'
    
    ydl_opts = {
        'format': download_format,
        'outtmpl': file_path,
        'merge_output_format': 'mp4',
        'quiet': True,
        'no_warnings': True,
        'progress_hooks': progress_hooks,
        'remote_components': ['ejs:github']
    }
    
    cookies_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
    
    if format_id == 'bestaudio':
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]

    if progress_hooks:
        ydl_opts['progress_hooks'] = progress_hooks

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return ydl.prepare_filename(info)
