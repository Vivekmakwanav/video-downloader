import yt_dlp
import os
import uuid
import asyncio
import urllib.parse

def clean_youtube_url(url: str) -> str:
    if "youtube.com/watch" in url or "youtu.be/" in url:
        parsed = urllib.parse.urlparse(url)
        query = urllib.parse.parse_qs(parsed.query)
        if "v" in query:
            return f"https://www.youtube.com/watch?v={query['v'][0]}"
    return url

DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "downloads")
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def analyze_video(url: str):
    url = clean_youtube_url(url)
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'noplaylist': True,
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
            
            # Extract subtitles list
            subtitles_list = []
            raw_subs = info.get('subtitles', {}) or {}
            raw_auto = info.get('automatic_captions', {}) or {}
            
            for lang, val in raw_subs.items():
                if val:
                    subtitles_list.append({
                        'lang': lang,
                        'name': val[0].get('name', lang),
                        'is_auto': False
                    })
            for lang, val in raw_auto.items():
                if val:
                    subtitles_list.append({
                        'lang': lang,
                        'name': val[0].get('name', lang),
                        'is_auto': True
                    })

            return {
                'url': url,
                'title': title,
                'thumbnail': thumbnail,
                'duration': duration,
                'platform': extractor,
                'video_id': video_id,
                'formats': formats,
                'subtitles': subtitles_list
            }
        except yt_dlp.utils.DownloadError as e:
            raise Exception(f"Failed to analyze video: {str(e)}")

def download_video_sync(url: str, format_id: str, download_id: str, progress_hooks=None, start_time: int = None, end_time: int = None):
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
