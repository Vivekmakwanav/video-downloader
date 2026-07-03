document.getElementById('open-btn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url) {
    window.open(`http://localhost:5173/?url=${encodeURIComponent(tab.url)}`, '_blank');
  }
});
