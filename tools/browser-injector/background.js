const SCRIPT_ID = "website-scripts-plausible";
const MATCHES = ["https://plausible.io/*"];
const FILES = {
  javascript: "plausible.js",
  css: "plausible.css",
};
const SOURCES = [
  {
    name: "DEV",
    base: "https://dev.wsitefiles.com/sites",
    cacheBust: true,
  },
  {
    name: "LIVE",
    base: "https://cdn.jsdelivr.net/gh/diarmuids/website-scripts@main/sites",
    cacheBust: false,
  },
];

let activeCheck = null;

function setBadge(text, color) {
  chrome.action.setBadgeBackgroundColor({ color });
  chrome.action.setBadgeText({ text });
}

function hash(text) {
  let value = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }

  return (value >>> 0).toString(16);
}

async function fetchFile(source, filename) {
  const suffix = source.cacheBust ? `?injector=${Date.now()}` : "";
  const response = await fetch(`${source.base}/${filename}${suffix}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`${response.status} loading ${filename} from ${source.name}`);
  }

  return response.text();
}

async function fetchBundle() {
  let lastError;

  for (const source of SOURCES) {
    try {
      const [javascript, css] = await Promise.all([
        fetchFile(source, FILES.javascript),
        fetchFile(source, FILES.css),
      ]);

      return { javascript, css, source: source.name };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("No Website Scripts source was available");
}

function createInjectedCode(bundle) {
  const css = JSON.stringify(bundle.css);

  return `(() => {
  const oldStyles = document.getElementById("website-scripts-plausible-css");
  if (oldStyles) oldStyles.remove();
  const styles = document.createElement("style");
  styles.id = "website-scripts-plausible-css";
  styles.textContent = ${css};
  (document.head || document.documentElement).appendChild(styles);
})();
${bundle.javascript}`;
}

async function registerBundle(bundle, existing) {
  if (existing.length) {
    await chrome.userScripts.unregister({ ids: [SCRIPT_ID] });
  }

  await chrome.userScripts.register([
    {
      id: SCRIPT_ID,
      matches: MATCHES,
      js: [{ code: createInjectedCode(bundle) }],
      runAt: "document_idle",
      world: "MAIN",
    },
  ]);
}

async function syncBundle() {
  const bundle = await fetchBundle();
  const fingerprint = hash(`${bundle.javascript}\n${bundle.css}`);
  const [stored, existing] = await Promise.all([
    chrome.storage.local.get("plausibleFingerprint"),
    chrome.userScripts.getScripts({ ids: [SCRIPT_ID] }),
  ]);

  if (stored.plausibleFingerprint === fingerprint && existing.length) {
    setBadge(bundle.source, bundle.source === "DEV" ? "#16803c" : "#2563eb");
    return { changed: false, source: bundle.source };
  }

  await registerBundle(bundle, existing);
  await chrome.storage.local.set({ plausibleFingerprint: fingerprint });
  setBadge(bundle.source, bundle.source === "DEV" ? "#16803c" : "#2563eb");
  return { changed: true, source: bundle.source };
}

function runCheck() {
  if (!activeCheck) {
    activeCheck = syncBundle()
      .catch((error) => {
        console.error("[Website Scripts Live Injector]", error);
        setBadge("ERR", "#b91c1c");
        throw error;
      })
      .finally(() => {
        activeCheck = null;
      });
  }

  return activeCheck;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "website-scripts-check") return false;

  runCheck()
    .then(async (result) => {
      sendResponse(result);

      if (result.changed && sender.tab?.id) {
        await chrome.tabs.reload(sender.tab.id);
      }
    })
    .catch((error) => sendResponse({ error: error.message }));

  return true;
});
