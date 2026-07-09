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
    const videoUrl = window.location.href;
    const targetUrl = `https://vidnexa.space/?url=${encodeURIComponent(videoUrl)}`;
    window.open(targetUrl, '_blank');
  });

  ownerSection.appendChild(btn);
}

// Poll periodically to adapt to YouTube client-side dynamic page transitions
setInterval(addDownloadButton, 1500);
