// Offscreen Document Script - Manages fetching, decrypting, and stitching HLS streams.

const activeDownloads = {};

// Helper: Format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Simple M3U8 Parser
function parseM3U8(content, playlistUrl) {
  const lines = content.split("\n");
  const segments = [];
  const variants = [];
  let currentKey = null;
  let mediaSequence = 0;
  let isMaster = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith("#EXT-X-MEDIA-SEQUENCE")) {
      const match = line.match(/#EXT-X-MEDIA-SEQUENCE:(\d+)/);
      if (match) mediaSequence = parseInt(match[1], 10);
    }

    if (line.startsWith("#EXT-X-STREAM-INF")) {
      isMaster = true;
      const resolutionMatch = line.match(/RESOLUTION=(\d+x\d+)/i);
      const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/i);
      const resolution = resolutionMatch ? resolutionMatch[1] : "Unknown";
      const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1], 10) : 0;
      
      let nextLine = "";
      let j = i + 1;
      while (j < lines.length && (!nextLine || nextLine.startsWith("#"))) {
        nextLine = lines[j].trim();
        j++;
      }
      i = j - 1;

      if (nextLine) {
        variants.push({
          url: new URL(nextLine, playlistUrl).href,
          resolution: resolution,
          bandwidth: bandwidth
        });
      }
    }

    if (line.startsWith("#EXT-X-KEY")) {
      const methodMatch = line.match(/METHOD=([^,\s]+)/);
      const uriMatch = line.match(/URI="([^"]+)"/);
      const ivMatch = line.match(/IV=0x([a-fA-F0-9]+)/);

      if (methodMatch) {
        const method = methodMatch[1];
        if (method !== "NONE") {
          currentKey = {
            method: method,
            uri: uriMatch ? new URL(uriMatch[1], playlistUrl).href : null,
            iv: ivMatch ? ivMatch[1] : null
          };
        } else {
          currentKey = null;
        }
      }
    }

    if (line.startsWith("#EXTINF")) {
      const durationMatch = line.match(/#EXTINF:([0-9.]+)/);
      const duration = durationMatch ? parseFloat(durationMatch[1]) : 0;

      let nextLine = "";
      let j = i + 1;
      while (j < lines.length && (!nextLine || nextLine.startsWith("#"))) {
        nextLine = lines[j].trim();
        j++;
      }
      i = j - 1;

      if (nextLine) {
        segments.push({
          url: new URL(nextLine, playlistUrl).href,
          duration: duration,
          key: currentKey,
          seqNum: mediaSequence + segments.length
        });
      }
    }
  }

  return { isMaster, variants, segments };
}

// Download HLS video segments and stitch them
async function downloadHls(playlistUrl, filename, videoId, settings) {
  try {
    // 1. Fetch playlist content
    const resp = await fetch(playlistUrl);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} ${resp.statusText || 'Forbidden'}`);
    }
    const text = await resp.text();
    
    let parsed = parseM3U8(text, playlistUrl);
    
    // 2. Resolve Master Playlists to Highest Quality Variant
    if (parsed.isMaster) {
      if (parsed.variants.length > 0) {
        parsed.variants.sort((a, b) => b.bandwidth - a.bandwidth);
        
        let selectedVariant = parsed.variants[0];
        const prefQuality = settings.qualityPreference || "highest";
        
        if (prefQuality !== "highest") {
          const targetRes = prefQuality === "1080p" ? "1920x1080" : 
                            prefQuality === "720p" ? "1280x720" : 
                            prefQuality === "480p" ? "854x480" : null;
          
          if (targetRes) {
            const matched = parsed.variants.find(v => v.resolution.includes(targetRes));
            if (matched) selectedVariant = matched;
          }
        }

        const varResp = await fetch(selectedVariant.url);
        if (!varResp.ok) {
          throw new Error(`HTTP ${varResp.status} ${varResp.statusText || 'Forbidden'}`);
        }
        const varText = await varResp.text();
        parsed = parseM3U8(varText, selectedVariant.url);
      } else {
        throw new Error("No quality streams found in master playlist.");
      }
    }

    const segments = parsed.segments;
    if (segments.length === 0) {
      throw new Error("No media segments discovered in stream.");
    }

    // 3. Import Decryption Keys if AES-128 is used
    const keyCache = {};
    for (const seg of segments) {
      if (seg.key && seg.key.method === "AES-128" && seg.key.uri && !keyCache[seg.key.uri]) {
        try {
          const keyResp = await fetch(seg.key.uri, { referrerPolicy: "no-referrer" });
          if (!keyResp.ok) throw new Error(`HTTP ${keyResp.status}`);
          const keyBuf = await keyResp.arrayBuffer();
          const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBuf,
            { name: "AES-CBC" },
            false,
            ["decrypt"]
          );
          keyCache[seg.key.uri] = cryptoKey;
        } catch (e) {
          throw new Error(`Failed to load encryption key: ${e.message}`);
        }
      } else if (seg.key && seg.key.method !== "AES-128" && seg.key.method !== "NONE") {
        throw new Error(`DRM protection detected (${seg.key.method}). Standard extensions cannot decrypt DRM media.`);
      }
    }

    // 4. Download Queue Setup
    const segmentBuffers = new Array(segments.length);
    let downloadedCount = 0;
    const concurrency = parseInt(settings.concurrentLimit, 10) || 5;
    let activeIndex = 0;
    
    const abortController = new AbortController();
    activeDownloads[videoId] = abortController;

    let totalBytesDownloaded = 0;
    const startTime = Date.now();
    let lastProgressTime = Date.now();

    async function worker() {
      while (activeIndex < segments.length && !abortController.signal.aborted) {
        const index = activeIndex++;
        const segment = segments[index];

        let attempts = 0;
        let success = false;
        let buffer = null;

        while (attempts < 3 && !success && !abortController.signal.aborted) {
          attempts++;
          try {
            const segResp = await fetch(segment.url, { signal: abortController.signal });
            if (!segResp.ok) throw new Error(`HTTP ${segResp.status}`);
            buffer = await segResp.arrayBuffer();
            success = true;
          } catch (e) {
            console.warn(`Segment ${index} fail (attempt ${attempts}):`, e);
            if (attempts >= 3) {
              throw new Error(`Failed to download segment ${index} after 3 attempts.`);
            }
            await new Promise(r => setTimeout(r, 1000 * attempts));
          }
        }

        if (abortController.signal.aborted) return;

        if (segment.key && segment.key.method === "AES-128") {
          const cryptoKey = keyCache[segment.key.uri];
          let iv = new Uint8Array(16);
          
          if (segment.key.iv) {
            const hex = segment.key.iv.replace(/^0x/, "").padStart(32, "0");
            for (let i = 0; i < 16; i++) {
              iv[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
            }
          } else {
            const view = new DataView(iv.buffer);
            view.setUint32(12, segment.seqNum, false);
          }

          try {
            const decrypted = await crypto.subtle.decrypt(
              { name: "AES-CBC", iv: iv },
              cryptoKey,
              buffer
            );
            buffer = decrypted;
          } catch (decErr) {
            throw new Error(`Failed to decrypt segment ${index}: ${decErr.message}`);
          }
        }

        segmentBuffers[index] = new Uint8Array(buffer);
        downloadedCount++;
        totalBytesDownloaded += buffer.byteLength;

        const now = Date.now();
        if (now - lastProgressTime > 800 || downloadedCount === segments.length) {
          const duration = (now - startTime) / 1000;
          const speedBytes = totalBytesDownloaded / (duration || 1);
          const speedStr = formatBytes(speedBytes) + "/s";
          const progress = Math.round((downloadedCount / segments.length) * 100);
          
          chrome.runtime.sendMessage({
            action: "offscreen-progress",
            videoId: videoId,
            progress: progress,
            status: "Downloading",
            speed: speedStr,
            sizeFormatted: formatBytes(totalBytesDownloaded)
          }).catch(() => {});
          
          lastProgressTime = now;
        }
      }
    }

    const workers = [];
    const poolSize = Math.min(concurrency, segments.length);
    for (let i = 0; i < poolSize; i++) {
      workers.push(worker());
    }

    await Promise.all(workers);

    if (abortController.signal.aborted) {
      throw new Error("Download aborted.");
    }

    chrome.runtime.sendMessage({
      action: "offscreen-progress",
      videoId: videoId,
      progress: 100,
      status: "Stitching",
      speed: "0 KB/s",
      sizeFormatted: formatBytes(totalBytesDownloaded)
    }).catch(() => {});

    let totalLength = 0;
    for (let i = 0; i < segmentBuffers.length; i++) {
      if (segmentBuffers[i]) {
        totalLength += segmentBuffers[i].length;
      }
    }

    const stitchedArray = new Uint8Array(totalLength);
    let offset = 0;
    for (let i = 0; i < segmentBuffers.length; i++) {
      if (segmentBuffers[i]) {
        stitchedArray.set(segmentBuffers[i], offset);
        offset += segmentBuffers[i].length;
      }
    }

    const mimeType = filename.toLowerCase().endsWith(".mp4") ? "video/mp4" : "video/mp2t";
    const outputBlob = new Blob([stitchedArray], { type: mimeType });
    const blobUrl = URL.createObjectURL(outputBlob);

    // Trigger Chrome download directly from offscreen document context where blob URL is valid
    chrome.downloads.download({
      url: blobUrl,
      filename: filename,
      saveAs: false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error("Offscreen download failed:", chrome.runtime.lastError);
        chrome.runtime.sendMessage({
          action: "offscreen-error",
          videoId: videoId,
          error: chrome.runtime.lastError.message
        }).catch(() => {});
      } else {
        chrome.runtime.sendMessage({
          action: "offscreen-ready",
          videoId: videoId,
          downloadId: downloadId,
          blobUrl: blobUrl,
          filename: filename
        }).catch(() => {});
      }
    });

  } catch (err) {
    console.error("HLS Downloader error:", err);
    chrome.runtime.sendMessage({
      action: "offscreen-error",
      videoId: videoId,
      error: err.message
    }).catch(() => {});
  } finally {
    delete activeDownloads[videoId];
  }
}

// Message listener from service worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "start-offscreen-download") {
    downloadHls(
      message.url,
      message.filename,
      message.videoId,
      message.settings
    );
  } else if (message.action === "cancel-offscreen-download") {
    const videoId = message.videoId;
    if (activeDownloads[videoId]) {
      activeDownloads[videoId].abort();
      delete activeDownloads[videoId];
    }
  }
});
