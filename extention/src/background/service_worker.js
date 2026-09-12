// State management for detected videos per tab
let detectedVideos = {};
// State for active HLS downloads (since they are custom and not tracked by chrome.downloads initially)
const activeHlsDownloads = {};
// Map chrome downloadId to videoId for progress tracking of direct downloads
const directDownloadMap = {};

// Helper: Save state to chrome.storage.session so state persists across Manifest V3 service worker restarts
function saveState(tabId) {
  if (chrome.storage && chrome.storage.session) {
    chrome.storage.session.get(["detectedVideos"], (res) => {
      const all = (res && res.detectedVideos) ? res.detectedVideos : {};
      if (tabId && detectedVideos[tabId]) {
        all[tabId] = detectedVideos[tabId];
      } else if (tabId) {
        delete all[tabId];
      }
      chrome.storage.session.set({ detectedVideos: all });
    });
  }
}

// Load state on startup
if (chrome.storage && chrome.storage.session) {
  chrome.storage.session.get(["detectedVideos"], (res) => {
    if (res && res.detectedVideos) {
      detectedVideos = res.detectedVideos;
    }
  });
}

// Clean up state on tab navigate or close
chrome.tabs.onRemoved.addListener((tabId) => {
  delete detectedVideos[tabId];
  saveState(tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame navigation
    delete detectedVideos[details.tabId];
    saveState(details.tabId);
  }
});

// Resolution & quality parser helper
function parseQuality(url, contentType, size) {
  if (!url) return "720p HD";
  const lower = url.toLowerCase();
  
  const resMatch = lower.match(/(2160p?|1440p?|1080p?|720p?|480p?|360p?|240p?|_1080|_720|_480|_360)/i);
  if (resMatch) {
    let val = resMatch[1].toLowerCase().replace("_", "");
    if (!val.endsWith("p")) val += "p";
    if (val === "2160p") return "4K 2160p";
    if (val === "1080p") return "1080p Full HD";
    if (val === "720p") return "720p HD";
    if (val === "480p") return "480p SD";
    return val;
  }

  if (lower.includes("4k") || lower.includes("uhd") || lower.includes("2160")) return "4K 2160p";
  if (lower.includes("1080") || lower.includes("fhd")) return "1080p Full HD";
  if (lower.includes("720") || lower.includes("hd")) return "720p HD";
  if (lower.includes("480") || lower.includes("sd")) return "480p SD";
  if (lower.includes("360")) return "360p";

  if (size > 80 * 1024 * 1024) return "1080p Full HD";
  if (size > 20 * 1024 * 1024) return "720p HD";
  if (size > 0) return "480p SD";

  return "720p HD";
}

// Helper: Add detected video to state with smart deduplication
function addVideo(tabId, video) {
  if (!tabId || tabId < 0) return;
  if (!detectedVideos[tabId]) {
    detectedVideos[tabId] = [];
  }

  // Determine quality if missing or generic
  if (!video.quality || video.quality === "Detected" || video.quality === "Detected (HTML5)") {
    video.quality = parseQuality(video.url, video.type, video.size);
  }

  // Clean URL string for smart matching
  const cleanUrl = (u) => {
    try {
      const parsed = new URL(u);
      return parsed.origin + parsed.pathname;
    } catch (e) {
      return u;
    }
  };

  const targetClean = cleanUrl(video.url);

  // Check if existing entry matches this video
  const existingIndex = detectedVideos[tabId].findIndex(v => {
    if (v.url === video.url) return true;
    if (cleanUrl(v.url) === targetClean && v.extension === video.extension) return true;
    return false;
  });

  if (existingIndex >= 0) {
    const existing = detectedVideos[tabId][existingIndex];
    if ((!existing.size || existing.size === 0) && video.size > 0) {
      existing.size = video.size;
      existing.sizeFormatted = video.sizeFormatted;
    }
    if ((existing.quality === "Detected" || existing.quality === "Detected (HTML5)") && video.quality !== "Detected") {
      existing.quality = video.quality;
    }
  } else {
    detectedVideos[tabId].push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      ...video,
      detectedAt: Date.now()
    });
    updateBadge(tabId);
    saveState(tabId);
  }
}

// Update Extension Badge Count
function updateBadge(tabId) {
  const count = detectedVideos[tabId] ? detectedVideos[tabId].length : 0;
  chrome.action.setBadgeText({
    tabId: tabId,
    text: count > 0 ? count.toString() : ""
  });
  chrome.action.setBadgeBackgroundColor({
    tabId: tabId,
    color: "#6366f1"
  });
}

// Watch network requests to detect videos
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId < 0) return;

    const url = details.url;
    let contentType = "";
    let contentLength = 0;
    let contentDisposition = "";

    if (details.responseHeaders) {
      for (const header of details.responseHeaders) {
        const name = header.name.toLowerCase();
        if (name === "content-type") {
          contentType = header.value ? header.value.toLowerCase() : "";
        } else if (name === "content-length") {
          contentLength = parseInt(header.value, 10);
        } else if (name === "content-disposition") {
          contentDisposition = header.value;
        }
      }
    }

    let isVideo = false;
    let type = "unknown";
    let extension = "mp4";

    const lowerUrl = url.toLowerCase();

    if (contentType.includes("application/x-mpegurl") || 
        contentType.includes("application/vnd.apple.mpegurl") || 
        contentType.includes("audio/mpegurl") || 
        /\.m3u8($|\?)/i.test(lowerUrl) || 
        lowerUrl.includes(".m3u8") ||
        lowerUrl.includes("/playlist.m3u8") ||
        lowerUrl.includes("/master.m3u8")) {
      isVideo = true;
      type = "hls";
      extension = "mp4";
    } else if (contentType.includes("application/dash+xml") || /\.mpd($|\?)/i.test(lowerUrl) || lowerUrl.includes(".mpd")) {
      isVideo = true;
      type = "dash";
      extension = "mp4";
    } else if (contentType.includes("video/mp4") || /\.mp4($|\?)/i.test(lowerUrl) || lowerUrl.includes(".mp4")) {
      isVideo = true;
      type = "mp4";
      extension = "mp4";
    } else if (contentType.includes("video/webm") || /\.webm($|\?)/i.test(lowerUrl) || lowerUrl.includes(".webm")) {
      isVideo = true;
      type = "webm";
      extension = "webm";
    } else if ((contentType.startsWith("video/") || contentType.startsWith("audio/")) && 
               !contentType.includes("mp2t") && 
               !contentType.includes("mpegurl")) {
      isVideo = true;
      type = contentType.split("/")[1] || "media";
      extension = type.includes("mpeg") ? "mp3" : type.includes("mp4") ? "mp4" : type;
    } else if (contentType.includes("octet-stream") && (lowerUrl.includes("video") || lowerUrl.includes("stream")) && !lowerUrl.includes("segment") && !lowerUrl.includes("chunk")) {
      isVideo = true;
      type = "mp4";
      extension = "mp4";
    }

    // Explicitly reject HLS/DASH chunk segments (ts, mp2t, m4s, range, etc.)
    if (contentType === "video/mp2t" || 
        contentType.includes("mp2t") ||
        (lowerUrl.includes(".ts") && !lowerUrl.includes(".m3u8")) || 
        lowerUrl.includes(".m4s") || 
        lowerUrl.includes(".mp4/range/") ||
        lowerUrl.includes("range=") ||
        lowerUrl.includes("bytes=") ||
        lowerUrl.includes("/segment") ||
        lowerUrl.includes("/frag/") ||
        lowerUrl.includes("/chunk")) {
      isVideo = false;
    }

    // Filter out tiny header responses (< 1 KB) for non-playlist files to eliminate metadata files
    if (type !== "hls" && type !== "dash" && contentLength > 0 && contentLength < 1024) {
      return;
    }

    if (isVideo) {
      let filename = "video";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=["']?(?:UTF-8'')?([^;"'\n]+)["']?/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      if (filename === "video") {
        try {
          const pathname = new URL(url).pathname;
          const lastSegment = pathname.substring(pathname.lastIndexOf('/') + 1);
          if (lastSegment && lastSegment.includes('.')) {
            filename = lastSegment.substring(0, lastSegment.lastIndexOf('.'));
          }
        } catch (e) {}
      }

      chrome.tabs.get(details.tabId, (tab) => {
        if (chrome.runtime.lastError) {}
        let title = (tab && tab.title) ? tab.title : filename;
        title = title.replace(/[\\/:*?"<>|]/g, "_").trim();
        if (!title) title = "Video Downloader";
        const sizeStr = contentLength ? formatBytes(contentLength) : "Unknown size";
        const qualityVal = parseQuality(url, type, contentLength);

        addVideo(details.tabId, {
          url: url,
          filename: title,
          type: type,
          extension: extension,
          quality: qualityVal,
          size: contentLength || 0,
          sizeFormatted: sizeStr,
          source: "Network"
        });
      });
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders", "extraHeaders"]
);

// Helper: Format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Offscreen Document creation
let offscreenCreating = null;
async function setupOffscreenDocument(path) {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL(path)]
  });

  if (contexts.length > 0) return;

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }

  offscreenCreating = chrome.offscreen.createDocument({
    url: path,
    reasons: [chrome.offscreen.Reason.BLOBS],
    justification: "Downloading and stitching video segments (HLS/DASH) in background context"
  });

  await offscreenCreating;
  offscreenCreating = null;
}

async function closeOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"]
  });
  if (contexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

// Message Router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "get-videos") {
    const tabId = message.tabId;
    if (detectedVideos[tabId]) {
      sendResponse({ videos: detectedVideos[tabId] || [] });
    } else if (chrome.storage && chrome.storage.session) {
      chrome.storage.session.get(["detectedVideos"], (res) => {
        const stored = (res && res.detectedVideos) ? res.detectedVideos[tabId] || [] : [];
        if (stored.length > 0) {
          detectedVideos[tabId] = stored;
        }
        sendResponse({ videos: stored });
      });
      return true;
    } else {
      sendResponse({ videos: [] });
    }
  } 
  
  else if (message.action === "add-video-manually") {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    if (tabId) {
      addVideo(tabId, message.video);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "No Tab ID found" });
    }
  } 
  
  else if (message.action === "start-download") {
    handleStartDownload(message.video, message.settings || {})
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  } 
  
  else if (message.action === "get-active-downloads") {
    // Send list of active HLS downloads and combine with chrome.downloads in popup
    sendResponse({ hlsDownloads: activeHlsDownloads });
  } 
  
  else if (message.action === "cancel-hls-download") {
    const videoId = message.videoId;
    if (activeHlsDownloads[videoId]) {
      activeHlsDownloads[videoId].status = "Cancelled";
      // Send cancel signal to offscreen document
      chrome.runtime.sendMessage({
        action: "cancel-offscreen-download",
        videoId: videoId
      }).catch(() => {});
      
      setTimeout(() => {
        delete activeHlsDownloads[videoId];
        checkOffscreenLifecycle();
      }, 2000);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false });
    }
  }
  
  // Messages from Offscreen Document
  else if (message.action === "offscreen-progress") {
    const { videoId, progress, status, speed, sizeFormatted } = message;
    if (activeHlsDownloads[videoId]) {
      activeHlsDownloads[videoId].progress = progress;
      if (status) activeHlsDownloads[videoId].status = status;
      if (speed) activeHlsDownloads[videoId].speed = speed;
      if (sizeFormatted) activeHlsDownloads[videoId].sizeFormatted = sizeFormatted;
    }
    // Forward progress to active popup if open
    chrome.runtime.sendMessage(message).catch(() => {});
  } 
  
  else if (message.action === "offscreen-ready") {
    const { videoId, downloadId, blobUrl } = message;
    if (activeHlsDownloads[videoId]) {
      activeHlsDownloads[videoId].status = "Completed";
      activeHlsDownloads[videoId].downloadId = downloadId;
      if (downloadId && blobUrl) {
        directDownloadMap[downloadId] = { videoId, blobUrl };
      }
    }
    checkOffscreenLifecycle();
  } 
  
  else if (message.action === "offscreen-error") {
    const { videoId, error } = message;
    if (activeHlsDownloads[videoId]) {
      activeHlsDownloads[videoId].status = "Failed";
      activeHlsDownloads[videoId].error = error;
    }
    checkOffscreenLifecycle();
  }
});

// Handle download initiation based on video type
async function handleStartDownload(video, settings) {
  const customNaming = settings.namingPattern || "{title}";

  // Clean raw title: remove query parameters, invalid filename characters, and trim trailing whitespace/dots
  let cleanTitle = (video.filename || "video")
    .replace(/\?.*$/g, "")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\.+$/, "");

  if (!cleanTitle) cleanTitle = "video";

  let cleanQuality = (video.quality || "720p")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .trim();

  let cleanFormat = (video.extension || "mp4")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!cleanFormat) cleanFormat = "mp4";

  let formattedFilename = customNaming
    .replace("{title}", cleanTitle)
    .replace("{quality}", cleanQuality)
    .replace("{format}", cleanFormat)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .trim()
    .replace(/\.+$/, "");

  // Ensure file extension is appended only once
  if (!formattedFilename.toLowerCase().endsWith("." + cleanFormat)) {
    formattedFilename += "." + cleanFormat;
  }

  if (video.type === "hls") {
    // 1. Mark as downloading in active HLS
    activeHlsDownloads[video.id] = {
      id: video.id,
      filename: formattedFilename,
      progress: 0,
      status: "Analyzing",
      type: "hls",
      speed: "0 KB/s"
    };

    // 2. Setup Offscreen Document
    await setupOffscreenDocument("src/offscreen/offscreen.html");

    // 3. Command offscreen document to download HLS
    chrome.runtime.sendMessage({
      action: "start-offscreen-download",
      url: video.url,
      filename: formattedFilename,
      videoId: video.id,
      settings: settings
    }).catch((err) => {
      console.error("Error messaging offscreen:", err);
      activeHlsDownloads[video.id].status = "Failed";
      activeHlsDownloads[video.id].error = "Failed to communicate with download engine.";
    });

    return { success: true, mode: "hls", videoId: video.id };
  } else {
    // Direct download (MP4, WebM, etc.)
    return new Promise((resolve) => {
      chrome.downloads.download({
        url: video.url,
        filename: formattedFilename,
        saveAs: true
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve({ success: true, mode: "direct", downloadId: downloadId });
        }
      });
    });
  }
}

// Check if we should close the offscreen document (no active HLS downloads)
function checkOffscreenLifecycle() {
  const activeCount = Object.values(activeHlsDownloads).filter(
    d => d.status === "Analyzing" || d.status === "Downloading" || d.status === "Stitching"
  ).length;

  if (activeCount === 0) {
    closeOffscreenDocument();
  }
}

// Track Chrome downloads to clean up blob URLs when done
chrome.downloads.onChanged.addListener((delta) => {
  const downloadId = delta.id;
  if (directDownloadMap[downloadId]) {
    const { videoId, blobUrl } = directDownloadMap[downloadId];
    
    if (delta.state && (delta.state.current === "complete" || delta.state.current === "interrupted")) {
      // Revoke the blob URL to free memory
      URL.revokeObjectURL(blobUrl);
      delete directDownloadMap[downloadId];
      
      // Update status in active HLS
      if (activeHlsDownloads[videoId]) {
        if (delta.state.current === "complete") {
          activeHlsDownloads[videoId].status = "Finished";
        } else {
          activeHlsDownloads[videoId].status = "Failed";
          activeHlsDownloads[videoId].error = "Download interrupted by browser.";
        }
        
        // Remove after short delay
        setTimeout(() => {
          delete activeHlsDownloads[videoId];
        }, 5000);
      }
    }
  }
});

// Context Menu "Download This Video"
if (chrome.contextMenus) {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "download-video",
      title: "Download This Video",
      contexts: ["video"]
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "download-video" && tab) {
      // If a video element was right-clicked, its src is in info.srcUrl
      if (info.srcUrl) {
        let ext = "mp4";
        try {
          const urlObj = new URL(info.srcUrl);
          const extMatch = urlObj.pathname.match(/\.([a-z0-9]+)$/i);
          if (extMatch) ext = extMatch[1];
        } catch (e) {}

        let tabTitle = tab.title ? tab.title.replace(/[\\/:*?"<>|]/g, "_").trim() : "video";

        const video = {
          url: info.srcUrl,
          filename: tabTitle,
          type: ext,
          extension: ext,
          quality: "Context Menu",
          size: 0,
          sizeFormatted: "Unknown size",
          source: "Context Menu"
        };

        // Add to list and trigger download
        addVideo(tab.id, video);
        // Retrieve settings and trigger
        chrome.storage.local.get(null, (settings) => {
          handleStartDownload(video, settings).catch(err => {
            console.error("Context menu download failed:", err);
          });
        });
      } else {
        // Alert popup or content script
        chrome.tabs.sendMessage(tab.id, { action: "context-menu-download-no-url" }).catch(() => {});
      }
    }
  });
}

// Dynamic injection of scraper into main world using chrome.scripting API
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.url && tab.url.startsWith("http")) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["src/content/inject.js"],
        world: "MAIN"
      }).catch((err) => {
        // Suppress errors for system pages (e.g. chrome://) or if injection is restricted
      });
    }
  }
});
