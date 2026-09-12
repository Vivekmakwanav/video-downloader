// Options Page Controller
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const showFloatingButton = document.getElementById("showFloatingButton");
  const qualityPreference = document.getElementById("qualityPreference");
  const formatPreference = document.getElementById("formatPreference");
  const concurrentLimit = document.getElementById("concurrentLimit");
  const concurrentLimitVal = document.getElementById("concurrentLimitVal");
  const namingPattern = document.getElementById("namingPattern");
  const namingPreview = document.getElementById("namingPreview");
  const toast = document.getElementById("toast");

  let toastTimeout = null;

  // Load preferences from local storage
  chrome.storage.local.get({
    showFloatingButton: true,
    qualityPreference: "highest",
    formatPreference: "mp4",
    concurrentLimit: 5,
    namingPattern: "{title}"
  }, (settings) => {
    showFloatingButton.checked = settings.showFloatingButton;
    qualityPreference.value = settings.qualityPreference;
    formatPreference.value = settings.formatPreference;
    concurrentLimit.value = settings.concurrentLimit;
    concurrentLimitVal.textContent = settings.concurrentLimit;
    namingPattern.value = settings.namingPattern;

    updateNamingPreview();
  });

  // Event Listeners for auto-saving
  showFloatingButton.addEventListener("change", saveSettings);
  qualityPreference.addEventListener("change", saveSettings);
  formatPreference.addEventListener("change", () => {
    saveSettings();
    updateNamingPreview();
  });
  
  concurrentLimit.addEventListener("input", () => {
    concurrentLimitVal.textContent = concurrentLimit.value;
  });
  concurrentLimit.addEventListener("change", saveSettings);

  namingPattern.addEventListener("input", () => {
    updateNamingPreview();
  });
  namingPattern.addEventListener("change", saveSettings);

  // Save Settings to chrome.storage
  function saveSettings() {
    const settings = {
      showFloatingButton: showFloatingButton.checked,
      qualityPreference: qualityPreference.value,
      formatPreference: formatPreference.value,
      concurrentLimit: parseInt(concurrentLimit.value, 10),
      namingPattern: namingPattern.value
    };

    chrome.storage.local.set(settings, () => {
      showToast();
    });
  }

  // Live naming preview generator
  function updateNamingPreview() {
    const pattern = namingPattern.value || "{title}";
    const format = formatPreference.value || "mp4";
    
    let preview = pattern
      .replace(/{title}/g, "nature_cinematic_4k")
      .replace(/{quality}/g, "1080p")
      .replace(/{format}/g, format)
      .replace(/[\\/:*?"<>|]/g, "_");

    if (!preview.toLowerCase().endsWith("." + format.toLowerCase())) {
      preview += "." + format;
    }
    namingPreview.textContent = "Filename Preview: " + preview;
  }

  // Display auto-save success toast
  function showToast() {
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }
});
