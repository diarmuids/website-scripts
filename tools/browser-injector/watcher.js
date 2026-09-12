function checkForWebsiteScriptUpdates() {
  chrome.runtime.sendMessage({ type: "website-scripts-check" }).catch(() => {});
}

checkForWebsiteScriptUpdates();
setInterval(checkForWebsiteScriptUpdates, 1500);

