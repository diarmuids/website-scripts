function checkForWebsiteScriptUpdates() {
  chrome.runtime.sendMessage({ type: "website-scripts-check" }).catch(() => {});
}

const RELOAD_TOAST_KEY = "website-scripts-reload-toast";

function showReloadToast() {
  const toast = document.createElement("div");
  toast.textContent = "Website Scripts extension reloaded";
  Object.assign(toast.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "2147483647",
    padding: "10px 14px",
    borderRadius: "8px",
    background: "#16803c",
    color: "#ffffff",
    font: "600 13px system-ui, sans-serif",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    pointerEvents: "none",
  });
  document.documentElement.appendChild(toast);
  setTimeout(() => toast.remove(), 1800);
}

addEventListener(
  "keydown",
  (event) => {
    const target = event.target;
    const isTyping =
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]');
    const isReloadShortcut =
      event.code === "KeyL" &&
      event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey;

    if (!isReloadShortcut || isTyping) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    sessionStorage.setItem(RELOAD_TOAST_KEY, String(Date.now()));
    chrome.runtime
      .sendMessage({ type: "website-scripts-reload-extension" })
      .catch(() => {});
  },
  true,
);

const queuedToast = Number(sessionStorage.getItem(RELOAD_TOAST_KEY) || 0);
sessionStorage.removeItem(RELOAD_TOAST_KEY);
if (queuedToast && Date.now() - queuedToast < 15000) {
  showReloadToast();
}

checkForWebsiteScriptUpdates();
setInterval(checkForWebsiteScriptUpdates, 1500);
