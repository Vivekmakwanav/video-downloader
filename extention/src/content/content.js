// Scans page for video elements and displays a floating download overlay
(function() {
  // Main world script injection (inject.js) is handled by the background service worker using the chrome.scripting API to bypass strict CSP policies.

  // Keep track of processed video URLs to prevent spamming background worker
  const processedUrls = new Set();

  // Listen to messages from inject.js
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === "UVD_DETECTED_STREAMS") {
      const streams = event.data.streams;
      streams.forEach(stream => {
        if (stream.url && !processedUrls.has(stream.url)) {
          processedUrls.add(stream.url);
          chrome.runtime.sendMessage({
            action: "add-video-manually",
            video: stream
          }).catch(() => {});
        }
      });
    }
  });

  let showFloatingButton = true;
  // Load settings
  chrome.storage.local.get({ showFloatingButton: true }, (res) => {
    showFloatingButton = res.showFloatingButton;
  });

  // Keep track of processed video URLs to prevent spamming background worker
  const processedUrls = new Set();

  function scanDOMVideos() {
    const videos = document.querySelectorAll("video");
    videos.forEach(video => {
      let src = video.src;
      
      if (!src) {
        const sources = video.querySelectorAll("source");
        for (const s of sources) {
          if (s.src) {
            src = s.src;
            break;
          }
        }
      }

      if (src && !processedUrls.has(src)) {
        processedUrls.add(src);
        
        let ext = "mp4";
        if (src.includes(".webm")) ext = "webm";
        else if (src.includes(".m3u8")) ext = "ts";
        else if (src.includes(".mpd")) ext = "mp4";
        
        let sourceName = "DOM Crawler";
        if (src.startsWith("blob:")) {
          sourceName = "DOM (Blob Stream)";
        }

        let quality = "720p HD";
        if (video.videoHeight && video.videoHeight > 0) {
          if (video.videoHeight >= 2160) quality = "4K 2160p";
          else if (video.videoHeight >= 1080) quality = "1080p Full HD";
          else if (video.videoHeight >= 720) quality = "720p HD";
          else if (video.videoHeight >= 480) quality = "480p SD";
          else if (video.videoHeight >= 360) quality = "360p";
          else quality = `${video.videoHeight}p`;
        }

        chrome.runtime.sendMessage({
          action: "add-video-manually",
          video: {
            url: src,
            filename: document.title || "video",
            type: src.startsWith("blob:") ? "blob" : ext,
            extension: ext,
            quality: quality,
            size: 0,
            sizeFormatted: "Unknown size",
            source: sourceName
          }
        }).catch(() => {});
      }

      // Attach floating button if enabled
      if (showFloatingButton) {
        setupFloatingButton(video);
      }
    });
  }

  // Floating button overlay management
  let activeOverlayButton = null;
  let activeVideo = null;
  let hideTimeout = null;

  function setupFloatingButton(video) {
    if (video.dataset.uvdHasButton) return;
    video.dataset.uvdHasButton = "true";

    video.addEventListener("mouseenter", () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      showButtonForVideo(video);
    });

    video.addEventListener("mouseleave", () => {
      hideTimeout = setTimeout(hideButton, 1000);
    });
  }

  function showButtonForVideo(video) {
    activeVideo = video;
    
    if (!activeOverlayButton) {
      activeOverlayButton = document.createElement("div");
      activeOverlayButton.id = "uvd-floating-btn";
      activeOverlayButton.style.cssText = `
        position: absolute;
        z-index: 2147483647;
        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
        color: white;
        width: 38px;
        height: 38px;
        border-radius: 50%;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s, background 0.3s;
        user-select: none;
      `;
      
      activeOverlayButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      `;

      activeOverlayButton.addEventListener("mouseenter", () => {
        if (hideTimeout) clearTimeout(hideTimeout);
        activeOverlayButton.style.transform = "scale(1.15)";
        activeOverlayButton.style.boxShadow = "0 6px 18px rgba(139, 92, 246, 0.5)";
      });

      activeOverlayButton.addEventListener("mouseleave", () => {
        activeOverlayButton.style.transform = "scale(1)";
        activeOverlayButton.style.boxShadow = "0 4px 14px rgba(0,0,0,0.4)";
        hideTimeout = setTimeout(hideButton, 1000);
      });

      activeOverlayButton.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        if (activeVideo) {
          let src = activeVideo.src;
          if (!src) {
            const sources = activeVideo.querySelectorAll("source");
            for (const s of sources) {
              if (s.src) { src = s.src; break; }
            }
          }
          if (src) {
            let ext = "mp4";
            if (src.includes(".webm")) ext = "webm";
            else if (src.includes(".m3u8")) ext = "ts";
            
            // Set downloading status indicator on floating button
            activeOverlayButton.innerHTML = `
              <svg class="uvd-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff"></path>
              </svg>
            `;
            
            // Add dynamic rotating style if not present
            if (!document.getElementById("uvd-spinner-style")) {
              const style = document.createElement("style");
              style.id = "uvd-spinner-style";
              style.textContent = `
                @keyframes uvd-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .uvd-spinner { animation: uvd-spin 1s linear infinite; }
              `;
              document.head.appendChild(style);
            }

            chrome.runtime.sendMessage({
              action: "start-download",
              video: {
                id: "direct-" + Math.random().toString(36).substring(2, 7),
                url: src,
                filename: document.title || "video",
                type: src.startsWith("blob:") ? "blob" : ext,
                extension: ext,
                quality: "Floating Button",
                size: 0
              }
            }).then(response => {
              if (response && response.success) {
                // Success: green flash
                activeOverlayButton.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
                activeOverlayButton.innerHTML = `
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                `;
                setTimeout(() => {
                  activeOverlayButton.style.background = "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";
                  resetDownloadIcon();
                }, 2000);
              } else {
                // Fail: red flash
                activeOverlayButton.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
                activeOverlayButton.innerHTML = `
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                `;
                setTimeout(() => {
                  activeOverlayButton.style.background = "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";
                  resetDownloadIcon();
                }, 2000);
              }
            }).catch(() => {
              activeOverlayButton.style.background = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
              setTimeout(() => {
                activeOverlayButton.style.background = "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)";
                resetDownloadIcon();
              }, 2000);
            });
          }
        }
      });

      const targetContainer = document.fullscreenElement || document.body;
      if (activeOverlayButton.parentElement !== targetContainer) {
        targetContainer.appendChild(activeOverlayButton);
      }
    }

    updateButtonPosition(video);
    activeOverlayButton.style.display = "flex";
  }

  function resetDownloadIcon() {
    if (activeOverlayButton) {
      activeOverlayButton.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      `;
    }
  }

  function updateButtonPosition(video) {
    if (!activeOverlayButton || !video) return;
    const rect = video.getBoundingClientRect();
    
    if (rect.width === 0 || rect.height === 0) {
      activeOverlayButton.style.display = "none";
      return;
    }

    const isFullscreen = !!document.fullscreenElement;
    const scrollY = isFullscreen ? 0 : window.scrollY;
    const scrollX = isFullscreen ? 0 : window.scrollX;

    // Positions overlay at top right of video
    const top = rect.top + scrollY + 10;
    const left = rect.left + rect.width + scrollX - 48;

    activeOverlayButton.style.top = `${top}px`;
    activeOverlayButton.style.left = `${left}px`;
  }

  function hideButton() {
    if (activeOverlayButton) {
      activeOverlayButton.style.display = "none";
    }
  }

  window.addEventListener("scroll", () => {
    if (activeOverlayButton && activeOverlayButton.style.display !== "none" && activeVideo) {
      updateButtonPosition(activeVideo);
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (activeOverlayButton && activeOverlayButton.style.display !== "none" && activeVideo) {
      updateButtonPosition(activeVideo);
    }
  });

  // Run scans periodically
  setInterval(scanDOMVideos, 2000);
  scanDOMVideos();

  // Listen for context menu messages
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "context-menu-download-no-url") {
      alert("Please hover over the video and click the download button, or use the toolbar popup to download this stream.");
    }
  });
})();
