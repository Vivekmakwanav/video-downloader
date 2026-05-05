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
        'extractor_args': {'youtube': ['player_client=android']}
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            
            # Extract basic info
            title = info.get('title', 'Unknown Title')
            thumbnail = info.get('thumbnail', '')
            duration = info.get('duration', 0)
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
                height = f.get('height')
                if not height or height not in [2160, 1440, 1080, 720, 480, 360]:
                    continue
                
                res_label = f"{height}p"
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
                    'format_note': f.get('format_note', 'HD' if height >= 720 else 'SD')
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
        'extractor_args': {'youtube': ['player_client=android']}, # Bypass bot protection
        'progress_hooks': progress_hooks
    }
    
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
