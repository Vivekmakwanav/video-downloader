// Script injected into the page's main world context to scrape player configurations
(function() {
  if (window.__uvd_injected) return;
  window.__uvd_injected = true;

  const log = (msg) => console.log("[UVD Injector]", msg);

  function scrapeYouTube() {
    try {
      let playerResponse = null;

      // Try different common locations for YouTube's player response
      const moviePlayer = document.getElementById("movie_player");
      if (moviePlayer && typeof moviePlayer.getPlayerResponse === "function") {
        playerResponse = moviePlayer.getPlayerResponse();
      } else if (window.ytInitialPlayerResponse) {
        playerResponse = window.ytInitialPlayerResponse;
      } else if (window.ytplayer && window.ytplayer.config && window.ytplayer.config.args && window.ytplayer.config.args.player_response) {
        try {
          playerResponse = JSON.parse(window.ytplayer.config.args.player_response);
        } catch (e) {}
      }

      if (!playerResponse || !playerResponse.streamingData) return null;

      const title = playerResponse.videoDetails ? playerResponse.videoDetails.title : document.title;
      const streams = [];

      const handleFormat = (fmt, isAdaptive) => {
        let quality = fmt.qualityLabel || fmt.audioQuality || "Unknown";
        let mimeType = fmt.mimeType || "";
        let size = fmt.contentLength ? parseInt(fmt.contentLength, 10) : 0;
        let ext = mimeType.includes("video/webm") || mimeType.includes("audio/webm") ? "webm" : "mp4";
        
        let type = "video";
        let label = quality;
        if (mimeType.startsWith("audio/")) {
          type = "audio";
          label = `Audio (${fmt.audioBitrate || 128}kbps)`;
          ext = "mp3"; // Or m4a, let's classify as audio
        } else if (isAdaptive) {
          type = "video-only";
          label = `${quality} (Video Only)`;
        } else {
          label = `${quality} (Muxed)`;
        }

        // De-obfuscate URL if needed (signature cipher)
        let url = fmt.url;
        if (!url && fmt.signatureCipher) {
          // Signature cipher parsing if applicable (usually requires decryption, 
          // but some links are directly decryptable or we can extract the base URL)
          const params = new URLSearchParams(fmt.signatureCipher);
          url = params.get("url");
          // Signature decryption is complex and changes frequently, we extract the base URL
          // and let the browser try to play/download it, or warn user.
        }

        if (url) {
          streams.push({
            url: url,
            filename: title,
            type: ext,
            extension: ext,
            quality: label,
            size: size,
            sizeFormatted: size ? formatBytes(size) : "Unknown size",
            source: "YouTube Parser"
          });
        }
      };

      // Muxed Formats (typically low qualities, audio+video)
      if (playerResponse.streamingData.formats) {
        playerResponse.streamingData.formats.forEach(f => handleFormat(f, false));
      }

      // Adaptive Formats (high qualities, audio or video separate)
      if (playerResponse.streamingData.adaptiveFormats) {
        playerResponse.streamingData.adaptiveFormats.forEach(f => handleFormat(f, true));
      }

      return streams;
    } catch (e) {
      log("Error scraping YouTube: " + e.message);
      return null;
    }
  }

  function scrapeVimeo() {
    try {
      // Look for Vimeo config objects on page
      let config = null;
      if (window.vimeo && window.vimeo.config) {
        config = window.vimeo.config;
      } else {
        // Scrape from player iframes or script tags containing config URL
        const scripts = document.querySelectorAll('script');
        for (const s of scripts) {
          if (s.textContent && s.textContent.includes('window.vimeo.config')) {
            // Match the config json
            const match = s.textContent.match(/window\.vimeo\.config\s*=\s*({.*?});/);
            if (match) {
              config = JSON.parse(match[1]);
              break;
            }
          }
        }
      }

      if (!config || !config.request || !config.request.files) return null;

      const title = config.video && config.video.title ? config.video.title : document.title;
      const streams = [];

      // Vimeo Progressive files
      const files = config.request.files;
      if (files.progressive) {
        try {
          files.progressive.forEach(f => {
            streams.push({
              url: f.url,
              filename: title,
              type: "mp4",
              extension: "mp4",
              quality: f.quality || "Unknown",
              size: 0,
              sizeFormatted: "Unknown size",
              source: "Vimeo Parser"
            });
          });
        } catch (e) {}
      }

      // Vimeo HLS stream
      if (files.hls && files.hls.default) {
        streams.push({
          url: files.hls.default.url,
          filename: title,
          type: "hls",
          extension: "ts",
          quality: "Auto (HLS)",
          size: 0,
          sizeFormatted: "HLS Stream",
          source: "Vimeo Parser"
        });
      }

      return streams;
    } catch (e) {
      log("Error scraping Vimeo: " + e.message);
      return null;
    }
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // Scrape periodically and send findings to content script
  function runScraper() {
    const findings = [];
    
    const ytStreams = scrapeYouTube();
    if (ytStreams && ytStreams.length > 0) {
      findings.push(...ytStreams);
    }

    const vimeoStreams = scrapeVimeo();
    if (vimeoStreams && vimeoStreams.length > 0) {
      findings.push(...vimeoStreams);
    }

    if (findings.length > 0) {
      window.postMessage({
        type: "UVD_DETECTED_STREAMS",
        streams: findings
      }, "*");
    }
  }

  // Run scraper on load and at intervals
  setTimeout(runScraper, 1500);
  setInterval(runScraper, 5000);

})();
