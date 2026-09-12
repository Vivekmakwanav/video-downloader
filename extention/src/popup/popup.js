// Controller for extension popup window
document.addEventListener("DOMContentLoaded", () => {
  let activeTabId = null;
  let detectedVideosList = [];
  let settings = {};

  // DOM Elements
  const tabDetected = document.getElementById("tab-detected");
  const tabDownloads = document.getElementById("tab-downloads");
  const viewDetected = document.getElementById("view-detected");
  const viewDownloads = document.getElementById("view-downloads");
  
  const countDetected = document.getElementById("count-detected");
  const countDownloads = document.getElementById("count-downloads");

  const emptyState = document.getElementById("empty-state");
  const videoListContainer = document.getElementById("video-list-container");
  const emptyDownloads = document.getElementById("empty-downloads");
  const downloadsListContainer = document.getElementById("downloads-list-container");
  
  const appFooter = document.getElementById("app-footer");
  const chkSelectAll = document.getElementById("chk-select-all");
  const btnBatchDownload = document.getElementById("btn-batch-download");
  const btnOptions = document.getElementById("btn-options");

  // Load Settings
  chrome.storage.local.get({
    concurrentLimit: 5,
    namingPattern: "{title}",
    qualityPreference: "highest"
  }, (res) => {
    settings = res;
  });

  // Open Options page
  btnOptions.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Tab Navigation
  tabDetected.addEventListener("click", () => {
    switchTab("detected");
  });

  tabDownloads.addEventListener("click", () => {
    switchTab("downloads");
  });

  function switchTab(tab) {
    if (tab === "detected") {
      tabDetected.classList.add("active");
      tabDownloads.classList.remove("active");
      viewDetected.classList.add("active");
      viewDownloads.classList.remove("active");
    } else {
      tabDetected.classList.remove("active");
      tabDownloads.classList.add("active");
      viewDetected.classList.remove("active");
      viewDownloads.classList.add("active");
      refreshDownloads();
    }
  }

  // Get active tab and load videos
  function initActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        activeTabId = tabs[0].id;
        loadDetectedVideos();
        setInterval(loadDetectedVideos, 1500);
      } else {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs2) => {
          if (tabs2 && tabs2[0] && tabs2[0].id) {
            activeTabId = tabs2[0].id;
            loadDetectedVideos();
            setInterval(loadDetectedVideos, 1500);
          }
        });
      }
    });
  }

  initActiveTab();

  // Poll downloads list
  setInterval(refreshDownloads, 1000);

  let lastVideoIdsHash = "";
  // Load videos from background service worker
  function loadDetectedVideos() {
    if (!activeTabId) return;

    chrome.runtime.sendMessage({
      action: "get-videos",
      tabId: activeTabId
    }, (response) => {
      if (chrome.runtime.lastError) return;
      
      if (response && response.videos) {
        detectedVideosList = response.videos;
        countDetected.textContent = detectedVideosList.length;
        
        const currentHash = detectedVideosList.map(v => `${v.id}:${v.quality}:${v.size}`).join("|");
        if (currentHash !== lastVideoIdsHash) {
          lastVideoIdsHash = currentHash;
          renderVideoList();
        }
      }
    });
  }

  // Render list of videos on screen
  function renderVideoList() {
    if (detectedVideosList.length === 0) {
      emptyState.classList.remove("hidden");
      videoListContainer.classList.add("hidden");
      appFooter.classList.add("hidden");
      return;
    }

    emptyState.classList.add("hidden");
    videoListContainer.classList.remove("hidden");
    appFooter.classList.remove("hidden");

    // Preserve checked state if rendering while checked
    const checkedIds = new Set();
    document.querySelectorAll(".video-select:checked").forEach(input => {
      checkedIds.add(input.dataset.videoId);
    });

    videoListContainer.innerHTML = "";

    detectedVideosList.forEach(video => {
      const card = document.createElement("div");
      card.className = "video-card";
      
      const isChecked = checkedIds.has(video.id) ? "checked" : "";

      card.innerHTML = `
        <label class="checkbox-container">
          <input type="checkbox" class="video-select" data-video-id="${video.id}" ${isChecked}>
          <span class="checkmark"></span>
        </label>
        <div class="video-details">
          <div class="video-title" title="${video.filename}">${video.filename}</div>
          <div class="badges-row">
            <span class="badge badge-quality">${video.quality || "Detected"}</span>
            <span class="badge badge-size">${video.sizeFormatted || "Unknown size"}</span>
            <span class="badge badge-source">${video.source || "Network"}</span>
            <span class="badge" style="background-color:rgba(139,92,246,0.1);color:#a78bfa">${video.extension.toUpperCase()}</span>
          </div>
        </div>
        <button class="btn-card-download" data-video-id="${video.id}" title="Download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="8 17 12 21 16 17"></polyline>
            <line x1="12" y1="12" x2="12" y2="21"></line>
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
          </svg>
        </button>
      `;

      // Click on single download
      card.querySelector(".btn-card-download").addEventListener("click", () => {
        downloadSingleVideo(video);
      });

      videoListContainer.appendChild(card);
    });

    // Add checkbox toggle listeners
    document.querySelectorAll(".video-select").forEach(chk => {
      chk.addEventListener("change", updateBatchButtonState);
    });

    updateBatchButtonState();
  }

  // Update "Download Selected" state
  function updateBatchButtonState() {
    const checkedCount = document.querySelectorAll(".video-select:checked").length;
    if (checkedCount > 0) {
      btnBatchDownload.classList.remove("disabled");
      btnBatchDownload.disabled = false;
      btnBatchDownload.textContent = `Download Selected (${checkedCount})`;
    } else {
      btnBatchDownload.classList.add("disabled");
      btnBatchDownload.disabled = true;
      btnBatchDownload.textContent = "Download Selected";
    }

    // Update select all checkbox state
    const allCount = document.querySelectorAll(".video-select").length;
    chkSelectAll.checked = allCount > 0 && checkedCount === allCount;
  }

  // Select all checkboxes
  chkSelectAll.addEventListener("change", () => {
    const isChecked = chkSelectAll.checked;
    document.querySelectorAll(".video-select").forEach(chk => {
      chk.checked = isChecked;
    });
    updateBatchButtonState();
  });

  // Batch download triggered
  btnBatchDownload.addEventListener("click", () => {
    const checkedInputs = document.querySelectorAll(".video-select:checked");
    checkedInputs.forEach(input => {
      const videoId = input.dataset.videoId;
      const video = detectedVideosList.find(v => v.id === videoId);
      if (video) {
        downloadSingleVideo(video);
      }
    });
    // Move to downloads tracker tab
    switchTab("downloads");
  });

  // Download individual video
  function downloadSingleVideo(video) {
    chrome.runtime.sendMessage({
      action: "start-download",
      video: video,
      settings: settings
    }, (response) => {
      if (response && response.success) {
        // Move to downloads page to monitor progress
        switchTab("downloads");
      } else {
        alert("Failed to start download: " + (response ? response.error : "Unknown error"));
      }
    });
  }

  // Unified Download Tracker (Combines chrome.downloads and custom HLS offscreen downloads)
  function refreshDownloads() {
    // 1. Fetch custom HLS downloads
    chrome.runtime.sendMessage({ action: "get-active-downloads" }, (hlsResp) => {
      const hlsDownloads = hlsResp ? hlsResp.hlsDownloads || {} : {};

      // 2. Fetch standard chrome downloads in progress
      chrome.downloads.search({ state: "in_progress" }, (chromeDownloads) => {
        if (chrome.runtime.lastError) return;

        const totalActiveDownloads = Object.keys(hlsDownloads).length + chromeDownloads.length;
        countDownloads.textContent = totalActiveDownloads;

        if (totalActiveDownloads === 0) {
          emptyDownloads.classList.remove("hidden");
          downloadsListContainer.classList.add("hidden");
          return;
        }

        emptyDownloads.classList.add("hidden");
        downloadsListContainer.classList.remove("hidden");
        downloadsListContainer.innerHTML = "";

        // Render HLS downloads
        Object.values(hlsDownloads).forEach(download => {
          const card = document.createElement("div");
          card.className = "download-card";
          
          let speedVal = download.speed || "0 KB/s";
          let statusText = download.status || "Downloading";
          let statusClass = download.status ? download.status.toLowerCase() : "downloading";
          let sizeText = download.sizeFormatted || "0 Bytes";

          let isStitching = statusText === "Stitching";
          let isFinished = statusText === "Finished" || statusText === "Completed";
          let isFailed = statusText === "Failed";

          card.innerHTML = `
            <div class="download-header">
              <div class="download-title" title="${download.filename}">${download.filename}</div>
              ${!isFinished && !isFailed ? `
                <button class="btn-cancel" data-hls-id="${download.id}" title="Cancel">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              ` : ""}
            </div>
            <div class="progress-container">
              <div class="progress-track">
                <div class="progress-fill ${isStitching ? "stitching" : ""}" style="width: ${download.progress}%"></div>
              </div>
              <div class="progress-pct">${download.progress}%</div>
            </div>
            <div class="download-stats">
              <span class="status-text ${statusClass}">${statusText}</span>
              ${!isFinished && !isFailed && !isStitching ? `
                <span class="speed-text">${speedVal} (${sizeText})</span>
              ` : `
                <span>${sizeText}</span>
              `}
            </div>
          `;

          // Handle cancel
          const cancelBtn = card.querySelector(".btn-cancel");
          if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
              chrome.runtime.sendMessage({
                action: "cancel-hls-download",
                videoId: download.id
              });
            });
          }

          downloadsListContainer.appendChild(card);
        });

        // Render direct downloads
        chromeDownloads.forEach(download => {
          // Avoid duplicating if we are already tracking this through HLS wrapper
          const isHlsBlob = download.url.startsWith("blob:");
          if (isHlsBlob) return;

          const card = document.createElement("div");
          card.className = "download-card";

          const totalBytes = download.totalBytes;
          const receivedBytes = download.bytesReceived;
          const progress = totalBytes ? Math.round((receivedBytes / totalBytes) * 100) : 0;
          const sizeText = totalBytes ? formatBytes(totalBytes) : formatBytes(receivedBytes);

          card.innerHTML = `
            <div class="download-header">
              <div class="download-title" title="${download.filename ? download.filename.split(/[\\/]/).pop() : "Direct Download"}">
                ${download.filename ? download.filename.split(/[\\/]/).pop() : "Direct Download"}
              </div>
              <button class="btn-cancel" data-chrome-id="${download.id}" title="Cancel">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="progress-container">
              <div class="progress-track">
                <div class="progress-fill" style="width: ${progress}%"></div>
              </div>
              <div class="progress-pct">${progress}%</div>
            </div>
            <div class="download-stats">
              <span class="status-text downloading">Downloading</span>
              <span class="speed-text">${formatBytes(receivedBytes)} / ${sizeText}</span>
            </div>
          `;

          // Handle cancel
          card.querySelector(".btn-cancel").addEventListener("click", () => {
            chrome.downloads.cancel(download.id);
          });

          downloadsListContainer.appendChild(card);
        });
      });
    });
  }

  // Format bytes helper
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Real-time progress updates via messaging (avoids waiting for polling)
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "offscreen-progress") {
      const { videoId, progress, status, speed, sizeFormatted } = message;
      // Find cards corresponding to this HLS download and update them instantly
      const cancelBtn = document.querySelector(`[data-hls-id="${videoId}"]`);
      if (cancelBtn) {
        const card = cancelBtn.closest(".download-card");
        if (card) {
          const fill = card.querySelector(".progress-fill");
          const pct = card.querySelector(".progress-pct");
          const statusTxt = card.querySelector(".status-text");
          const speedTxt = card.querySelector(".speed-text");

          if (fill) {
            fill.style.width = progress + "%";
            if (status === "Stitching") {
              fill.classList.add("stitching");
            } else {
              fill.classList.remove("stitching");
            }
          }
          if (pct) pct.textContent = progress + "%";
          if (statusTxt) {
            statusTxt.textContent = status;
            statusTxt.className = `status-text ${status.toLowerCase()}`;
          }
          if (speedTxt && status !== "Stitching") {
            speedTxt.textContent = `${speed} (${sizeFormatted})`;
          }
        }
      }
    }
  });
});
