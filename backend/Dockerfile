# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Install ffmpeg (Required for yt-dlp to merge audio/video)
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Create a non-root system user and configure permissions
RUN useradd -u 8888 -m appuser && \
    mkdir -p downloads && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Run the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
