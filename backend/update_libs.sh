#!/bin/bash
# Vidnexa Daily Update Automation Script

LOG_FILE="/home/ubuntu/video-downloader/backend/update_libs.log"

echo "[$(date)] Starting daily library update..." >> "$LOG_FILE"

# 1. Upgrade yt-dlp in virtual environment
/home/ubuntu/video-downloader/backend/venv/bin/pip install -U yt-dlp >> "$LOG_FILE" 2>&1

# 2. Restart the Vidnexa service to load the new modules
systemctl restart vidnexa.service >> "$LOG_FILE" 2>&1

echo "[$(date)] Daily library update completed and service restarted successfully." >> "$LOG_FILE"
