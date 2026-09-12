const PENDING_RELOAD_KEY = "websiteScriptsPendingExtensionReload";
const RULES = [
  {
    id: "plausible",
    matches: ["https://plausible.io/*"],
    hosts: ["plausible.io"],
    javascript: "plausible.js",
    css: "plausible.css",
  },
  {
    id: "gmail",
    matches: ["https://mail.google.com/*"],
    hosts: ["mail.google.com"],
    javascript: "gmail.js",
    css: "gmail.css",
  },
];
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

const activeChecks = new Map();

function findRule(url) {
  try {
    const hostname = new URL(url).hostname;
    return RULES.find((rule) => rule.hosts.includes(hostname)) || null;
  } catch (_) {
    return null;
  }
}

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

async function fetchBundle(rule) {
  let lastError;

  for (const source of SOURCES) {
    try {
      const [javascript, css] = await Promise.all([
        fetchFile(source, rule.javascript),
        fetchFile(source, rule.css),
      ]);

      return { javascript, css, source: source.name };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`No source was available for ${rule.id}`);
}

function createInjectedCode(rule, bundle) {
  const css = JSON.stringify(bundle.css);
  const styleId = `website-scripts-${rule.id}-css`;

  return `(() => {
  const oldStyles = document.getElementById(${JSON.stringify(styleId)});
  if (oldStyles) oldStyles.remove();
  const styles = document.createElement("style");
  styles.id = ${JSON.stringify(styleId)};
  styles.textContent = ${css};
  (document.head || document.documentElement).appendChild(styles);
})();
${bundle.javascript}`;
}

async function registerBundle(rule, bundle, existing) {
  const scriptId = `website-scripts-${rule.id}`;

  if (existing.length) {
    await chrome.userScripts.unregister({ ids: [scriptId] });
  }

  await chrome.userScripts.register([
    {
      id: scriptId,
      matches: rule.matches,
      js: [{ code: createInjectedCode(rule, bundle) }],
      runAt: "document_idle",
      world: "MAIN",
    },
  ]);
}

async function syncBundle(rule) {
  const scriptId = `website-scripts-${rule.id}`;
  const fingerprintKey = `${rule.id}Fingerprint`;
  const bundle = await fetchBundle(rule);
  const fingerprint = hash(`${bundle.javascript}\n${bundle.css}`);
  const [stored, existing] = await Promise.all([
    chrome.storage.local.get(fingerprintKey),
    chrome.userScripts.getScripts({ ids: [scriptId] }),
  ]);

  if (stored[fingerprintKey] === fingerprint && existing.length) {
    setBadge(bundle.source, bundle.source === "DEV" ? "#16803c" : "#2563eb");
    return { changed: false, source: bundle.source };
  }

  await registerBundle(rule, bundle, existing);
  await chrome.storage.local.set({ [fingerprintKey]: fingerprint });
  setBadge(bundle.source, bundle.source === "DEV" ? "#16803c" : "#2563eb");
  return { changed: true, source: bundle.source };
}

function runCheck(rule) {
  if (!activeChecks.has(rule.id)) {
    const check = syncBundle(rule)
      .catch((error) => {
        console.error(`[Website Scripts Live Injector: ${rule.id}]`, error);
        setBadge("ERR", "#b91c1c");
        throw error;
      })
      .finally(() => activeChecks.delete(rule.id));

    activeChecks.set(rule.id, check);
  }

  return activeChecks.get(rule.id);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const rule = findRule(sender.tab?.url || "");

  if (message?.type === "website-scripts-reload-extension") {
    if (!sender.tab?.id || !rule) {
      sendResponse({ error: "No supported active tab was found" });
      return false;
    }

    chrome.storage.local
      .set({
        [PENDING_RELOAD_KEY]: {
          tabId: sender.tab.id,
          timestamp: Date.now(),
        },
      })
      .finally(() => chrome.runtime.reload());

    return true;
  }

  if (message?.type !== "website-scripts-check") return false;

  if (!rule) {
    sendResponse({ error: "No Website Scripts rule matched this page" });
    return false;
  }

  runCheck(rule)
    .then(async (result) => {
      sendResponse(result);

      if (result.changed && sender.tab?.id) {
        await chrome.tabs.reload(sender.tab.id);
      }
    })
    .catch((error) => sendResponse({ error: error.message }));

  return true;
});

async function resumePendingExtensionReload() {
  const stored = await chrome.storage.local.get(PENDING_RELOAD_KEY);
  const pending = stored[PENDING_RELOAD_KEY];

  if (!pending?.tabId || Date.now() - Number(pending.timestamp || 0) > 15000) {
    if (pending) await chrome.storage.local.remove(PENDING_RELOAD_KEY);
    return;
  }

  await chrome.storage.local.remove(PENDING_RELOAD_KEY);

  try {
    const tab = await chrome.tabs.get(pending.tabId);
    if (!findRule(tab.url || "")) return;
    await chrome.tabs.reload(tab.id, { bypassCache: true });
  } catch (error) {
    console.error("[Website Scripts Live Injector] Reload failed", error);
  }
}

resumePendingExtensionReload();
