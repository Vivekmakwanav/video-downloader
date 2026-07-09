function addDownloadButton() {
  if (document.getElementById('vidnexa-btn')) return;

  // Target YouTube's native channel owner layout block using fallbacks
  const ownerSection = document.querySelector('#top-row #owner') || 
                       document.querySelector('ytd-video-owner-renderer #owner') ||
                       document.querySelector('#owner') ||
                       document.querySelector('ytd-video-owner-renderer');
  if (!ownerSection) return;

  const btn = document.createElement('button');
  btn.id = 'vidnexa-btn';
  btn.style.marginLeft = '8px';
  btn.style.padding = '0 16px';
  btn.style.height = '36px';
  btn.style.borderRadius = '18px';
  btn.style.border = 'none';
  btn.style.background = 'linear-gradient(90deg, #00f0ff, #a855f7)';
  btn.style.color = '#000';
  btn.style.fontWeight = 'bold';
  btn.style.fontSize = '14px';
  btn.style.cursor = 'pointer';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.gap = '6px';
  btn.style.transition = 'filter 0.2s';
  btn.onmouseover = () => btn.style.filter = 'brightness(1.1)';
  btn.onmouseout = () => btn.style.filter = 'brightness(1.0)';

  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    <span>Download</span>
  `;

  btn.addEventListener('click', () => {
    if (document.getElementById('vidnexa-overlay')) return;

    const videoUrl = window.location.href;
    const targetUrl = `https://vidnexa.space/?url=${encodeURIComponent(videoUrl)}&embed=true`;

    const backdrop = document.createElement('div');
    backdrop.id = 'vidnexa-overlay';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    backdrop.style.backdropFilter = 'blur(8px)';
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';
    backdrop.style.zIndex = '9999999';
    backdrop.style.transition = 'all 0.3s ease';

    const popup = document.createElement('div');
    popup.style.position = 'relative';
    popup.style.width = '640px';
    popup.style.height = '520px';
    popup.style.maxWidth = '95%';
    popup.style.backgroundColor = '#0b0f19';
    popup.style.border = '1px solid rgba(0, 240, 255, 0.3)';
    popup.style.boxShadow = '0 0 25px rgba(0, 240, 255, 0.15)';
    popup.style.borderRadius = '16px';
    popup.style.overflow = 'hidden';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';

    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.padding = '12px 20px';
    topBar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    topBar.style.backgroundColor = '#070a13';

    const title = document.createElement('span');
    title.textContent = 'Vidnexa Media Downloader';
    title.style.color = '#fff';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '15px';
    title.style.fontFamily = 'sans-serif';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
    closeBtn.style.fontSize = '18px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.padding = '4px 8px';
    closeBtn.style.transition = 'color 0.2s';
    closeBtn.onmouseover = () => closeBtn.style.color = '#ff6b6b';
    closeBtn.onmouseout = () => closeBtn.style.color = 'rgba(255, 255, 255, 0.6)';

    const closeOverlay = () => {
      backdrop.style.opacity = '0';
      setTimeout(() => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }, 200);
    };

    closeBtn.addEventListener('click', closeOverlay);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeOverlay();
    });

    topBar.appendChild(title);
    topBar.appendChild(closeBtn);
    popup.appendChild(topBar);

    const iframe = document.createElement('iframe');
    iframe.src = targetUrl;
    iframe.style.width = '100%';
    iframe.style.height = 'calc(100% - 45px)';
    iframe.style.border = 'none';
    popup.appendChild(iframe);

    backdrop.appendChild(popup);
    document.body.appendChild(backdrop);
  });

  ownerSection.appendChild(btn);
}

// Poll periodically to adapt to YouTube client-side dynamic page transitions
setInterval(addDownloadButton, 1500);
