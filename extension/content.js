function injectButton() {
  if (document.getElementById('vidnexa-download-btn')) return;

  const target = document.querySelector('#top-level-buttons-computed, ytd-menu-renderer');
  if (!target) return;

  const btn = document.createElement('button');
  btn.id = 'vidnexa-download-btn';
  btn.innerHTML = `
    <span style="display: flex; align-items: center; gap: 6px; font-weight: 600; font-family: Roboto, Arial, sans-serif; font-size: 13px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Vidnexa Download
    </span>
  `;

  btn.style.background = 'linear-gradient(90deg, #00f0ff, #8a2be2)';
  btn.style.border = 'none';
  btn.style.color = '#000';
  btn.style.padding = '0 16px';
  btn.style.height = '36px';
  btn.style.borderRadius = '18px';
  btn.style.marginRight = '8px';
  btn.style.cursor = 'pointer';
  btn.style.display = 'inline-flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.transition = 'opacity 0.2s';
  
  btn.addEventListener('click', () => {
    const videoUrl = window.location.href;
    window.open(`http://localhost:5173/?url=${encodeURIComponent(videoUrl)}`, '_blank');
  });

  target.insertBefore(btn, target.firstChild);
}

const observer = new MutationObserver(() => {
  if (window.location.href.includes('watch')) {
    injectButton();
  }
});
observer.observe(document.body, { childList: true, subtree: true });
// Try initial run
if (window.location.href.includes('watch')) {
  injectButton();
}
