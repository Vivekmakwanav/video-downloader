import yt_dlp
import os
import uuid
import asyncio
import urllib.parse
import urllib.request

def clean_youtube_url(url: str) -> str:
    if "youtube.com/watch" in url or "youtu.be/" in url:
        parsed = urllib.parse.urlparse(url)
        query = urllib.parse.parse_qs(parsed.query)
        if "v" in query:
            return f"https://www.youtube.com/watch?v={query['v'][0]}"
    return url

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def parse_single_entry(info):
    title = info.get('title', 'Unknown Title')
    thumbnail = info.get('thumbnail', '')
    duration = int(round(info.get('duration') or 0))
    extractor = info.get('extractor_key', 'Unknown')
    video_id = info.get('id', '')
    
    formats = []
    
    # Check if this entry is an image (no formats, but has a direct url)
    if not info.get('formats') and info.get('url'):
        formats.append({
            'format_id': 'direct_image',
            'ext': 'jpg',
            'resolution': 'Image',
            'filesize': 0,
            'format_note': 'High Quality Image',
            'direct_url': info.get('url')
        })
    else:
        # Video formats processing
        audio_formats = [f for f in info.get('formats', []) if f.get('vcodec') == 'none' and f.get('ext') in ['m4a', 'webm']]
        best_audio = audio_formats[-1] if audio_formats else None
        
        seen_resolutions = set()
        video_formats = sorted(
            [f for f in info.get('formats', []) if f.get('vcodec') != 'none'],
            key=lambda x: x.get('height', 0) or 0,
            reverse=True
        )
        
        for f in video_formats:
            w = f.get('width') or 0
            h = f.get('height') or 0
            resolution_val = min(w, h) if w and h else h
            
            res_label = f"{resolution_val}p" if resolution_val else "Video"
            if res_label != "Video" and res_label in seen_resolutions:
                continue
            seen_resolutions.add(res_label)
            
            format_id = f.get('format_id')
            filesize = f.get('filesize') or f.get('filesize_approx') or 0
            
            if f.get('acodec') == 'none' and best_audio:
                format_id = f"{format_id}+{best_audio['format_id']}"
                audio_size = best_audio.get('filesize') or best_audio.get('filesize_approx') or 0
                filesize = filesize + audio_size
            
            formats.append({
                'format_id': format_id,
                'ext': f.get('ext', 'mp4'),
                'resolution': res_label,
                'filesize': filesize,
                'format_note': f.get('format_note', 'HD' if (resolution_val or 0) >= 720 else 'SD')
            })
            
        if best_audio:
            formats.append({
                'format_id': 'bestaudio',
                'ext': 'mp3',
                'resolution': 'Audio Only',
                'filesize': best_audio.get('filesize') or best_audio.get('filesize_approx') or 0,
                'format_note': 'High Quality Audio'
            })

    return {
        'url': info.get('webpage_url') or info.get('url') or '',
        'title': title,
        'thumbnail': thumbnail,
        'duration': duration,
        'platform': extractor,
        'video_id': video_id,
        'formats': formats,
        'subtitles': []
    }

def analyze_video(url: str):
    # Only scrub YouTube URL queries
    if "youtube.com" in url or "youtu.be" in url:
        url = clean_youtube_url(url)
        
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'noplaylist': True if ("youtube.com" in url or "youtu.be" in url) else False,
        'extract_flat': False,
        'remote_components': ['ejs:github'],
        'username': 'oauth2',
        'password': '',
        'extractor_args': {'youtube': {'player_client': ['android', 'ios', 'web', 'mweb', 'tv']}}
    }
    
    cookies_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
        
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            
            # Check if this is an Instagram carousel post / playlist
            if 'entries' in info and not ("youtube.com" in url or "youtu.be" in url):
                entries = list(info['entries'])
                if entries:
                    carousel_entries = []
                    for entry in entries:
                        if not entry:
                            continue
                        try:
                            entry_data = parse_single_entry(entry)
                            carousel_entries.append(entry_data)
                        except Exception:
                            continue
                    
                    return {
                        'is_carousel': True,
                        'title': info.get('title', 'Instagram Post'),
                        'platform': info.get('extractor_key', 'Instagram'),
                        'entries': carousel_entries
                    }
            
            return parse_single_entry(info)
        except yt_dlp.utils.DownloadError as e:
            raise Exception(f"Failed to analyze video: {str(e)}")

def download_video_sync(url: str, format_id: str, download_id: str, progress_hooks=None, start_time: int = None, end_time: int = None):
    # If it is a direct image URL, download using python request immediately
    if format_id == 'direct_image':
        file_path = os.path.join(DOWNLOAD_DIR, f"{download_id}.jpg")
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req) as response, open(file_path, 'wb') as out_file:
            if progress_hooks:
                for hook in progress_hooks:
                    try:
                        hook({'status': 'downloading', 'downloaded_bytes': 100, 'total_bytes': 100})
                    except Exception:
                        pass
            out_file.write(response.read())
            if progress_hooks:
                for hook in progress_hooks:
                    try:
                        hook({'status': 'finished'})
                    except Exception:
                        pass
        return f"{download_id}.jpg"

    # Otherwise, download using yt-dlp
    url = clean_youtube_url(url)
    file_path = os.path.join(DOWNLOAD_DIR, f"{download_id}.%(ext)s")
    
    # Determine the format string correctly depending on if it's audio only
    if format_id == 'bestaudio':
        download_format = 'bestaudio/best'
    elif '+' in format_id:
        download_format = format_id
    else:
        download_format = f'{format_id}+bestaudio/best'
    
    ydl_opts = {
        'format': download_format,
        'outtmpl': file_path,
        'merge_output_format': 'mp4',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'progress_hooks': progress_hooks,
        'remote_components': ['ejs:github'],
        'username': 'oauth2',
        'password': '',
        'extractor_args': {'youtube': {'player_client': ['android', 'ios', 'web', 'mweb', 'tv']}},
        'sleep_interval': 0,
        'max_sleep_interval': 0,
        'external_downloader': 'aria2c',
        'external_downloader_args': {
            'default': ['-x', '4', '-j', '4', '-s', '4', '-k', '1M']
        }
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

    if start_time is not None and end_time is not None:
        ydl_opts['download_ranges'] = lambda info_dict, self: [{
            'start_time': start_time,
            'end_time': end_time,
            'title': 'Trimmed Section'
        }]
        ydl_opts['force_keyframes_at_cuts'] = False

    if progress_hooks:
        ydl_opts['progress_hooks'] = progress_hooks

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info)
        if format_id == 'bestaudio':
            base_path, _ = os.path.splitext(filename)
            filename = f"{base_path}.mp3"
        return filename

def download_subtitles_sync(url: str, lang: str, is_auto: bool, download_id: str):
    url = clean_youtube_url(url)
    file_path = os.path.join(DOWNLOAD_DIR, f"{download_id}")
    
    ydl_opts = {
        'skip_download': True,
        'writesubtitles': not is_auto,
        'writeautomaticsub': is_auto,
        'subtitleslangs': [lang],
        'outtmpl': file_path,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'convertsubtitles': 'srt',
        'remote_components': ['ejs:github'],
        'username': 'oauth2',
        'password': '',
        'extractor_args': {'youtube': {'player_client': ['android', 'ios', 'web', 'mweb', 'tv']}}
    }
    
    cookies_path = os.path.join(os.path.dirname(__file__), "cookies.txt")
    if os.path.exists(cookies_path):
        ydl_opts['cookiefile'] = cookies_path
        
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        expected_path = f"{file_path}.{lang}.srt"
        final_path = f"{file_path}.srt"
        
        if os.path.exists(expected_path):
            os.rename(expected_path, final_path)
            return final_path
            
        for f in os.listdir(DOWNLOAD_DIR):
            if f.startswith(download_id) and f != download_id:
                curr_path = os.path.join(DOWNLOAD_DIR, f)
                os.rename(curr_path, final_path)
                return final_path
                
        raise Exception("Subtitle download failed or files not found.")

def convert_mp4_to_mp3_sync(input_path: str, output_path: str):
    import subprocess
    cmd = ["ffmpeg", "-y", "-i", input_path, "-vn", "-ar", "44100", "-ac", "2", "-b:a", "192k", output_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise Exception(f"FFmpeg audio extraction failed: {res.stderr}")
