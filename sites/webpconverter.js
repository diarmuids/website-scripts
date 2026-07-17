// Last updated: 2026-07-17 17:45:37

const state = {
  files: [],
  results: [],
  errors: [],
  objectUrls: [],
  sourceUrls: [],
  dimensions: [],
  converting: false,
  convertingIndex: null,
  autoQueue: [],
  autoProcessing: false
};

const resultsPanel = document.getElementById("resultsPanel");
const fileInput = document.getElementById("fileInput");
const resizeModeGroup = document.getElementById("resizeMode");
const resizeValueField = document.getElementById("resizeValueField");
const resizeValueLabel = document.getElementById("resizeValueLabel");
const resizeValue = document.getElementById("resizeValue");
const resizeSuffix = document.getElementById("resizeSuffix");
const enlargeOption = document.getElementById("enlargeOption");
const allowEnlarge = document.getElementById("allowEnlarge");
const defaultQuality = document.getElementById("defaultQuality");
const qualityOptions = document.getElementById("qualityOptions");
const qualityRange = document.getElementById("qualityRange");
const qualityOutput = document.getElementById("qualityOutput");
const renameEnabled = document.getElementById("renameEnabled");
const renameOptions = document.getElementById("renameOptions");
const renameBase = document.getElementById("renameBase");
const renameNumbered = document.getElementById("renameNumbered");
const renamePrefix = document.getElementById("renamePrefix");
const renameSuffix = document.getElementById("renameSuffix");
const saveToFolder = document.getElementById("saveToFolder");
const removeMetadata = document.getElementById("removeMetadata");
const autoConvertSave = document.getElementById("autoConvertSave");
const convertAllButton = document.getElementById("convertAllButton");
const clearButton = document.getElementById("clearButton");
const saveAllButton = document.getElementById("saveAllButton");
const saveDefaultsButton = document.getElementById("saveDefaultsButton");
const resetDefaultsButton = document.getElementById("resetDefaultsButton");
const statusText = document.getElementById("statusText");
const footerStatus = document.getElementById("footerStatus");
const results = document.getElementById("results");
const toastStack = document.getElementById("toastStack");
const resizeLabels = {
  width: "Width in pixels",
  height: "Height in pixels",
  percent: "Percentage"
};

const resizeDefaults = {
  width: "1920",
  height: "1000",
  percent: "50"
};

const resizeSuffixes = {
  width: "px",
  height: "px",
  percent: "%"
};

const resizeValues = { ...resizeDefaults };
const builtInDefaults = {
  defaultQuality: true,
  quality: "0.9",
  renameEnabled: true,
  renameBase: "converted",
  renameMode: "numbered",
  saveToFolder: true,
  resizeMode: "none",
  resizeValues: { ...resizeDefaults },
  allowEnlarge: false,
  removeMetadata: true
};
const settingsStorageKey = "webpConverterDefaults";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatSizeChange(originalBytes, convertedBytes) {
  const difference = originalBytes - convertedBytes;
  const percent = originalBytes ? Math.abs(difference / originalBytes) * 100 : 0;

  if (Math.abs(difference) < 1) {
    return {
      className: "same",
      text: "0%"
    };
  }

  if (difference > 0) {
    return {
      className: "savings",
      text: `-${formatPercent(percent)}`
    };
  }

  return {
    className: "increase",
    text: `+${formatPercent(percent)}`
  };
}

function formatPercent(value) {
  const rounded = value.toFixed(1);
  return `${rounded.endsWith(".0") ? Math.round(value) : rounded}%`;
}

function baseName(filename) {
  return filename.replace(/\.[^/.]+$/, "") || "converted-image";
}

function sanitizeFilenamePart(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "") || "converted-image";
}

function outputFolderName() {
  return `${sanitizeFilenamePart(renameBase.value || builtInDefaults.renameBase)}_folder`;
}

function uniqueOutputName(file, usedNames) {
  const base = sanitizeFilenamePart(baseName(file.name));
  let candidate = `${base}.webp`;
  let index = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base}-${index}.webp`;
    index += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function uniqueRenamedBase(base, usedNames) {
  let candidate = `${base}.webp`;
  let index = 1;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base}-${index}.webp`;
    index += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function renamedOutputName(file, index, usedNames) {
  const base = sanitizeFilenamePart(renameBase.value || "converted");
  const sourceBase = sanitizeFilenamePart(baseName(file.name));
  const mode = getRenameMode();
  let counter = index + 1;
  let candidate = "";

  if (mode === "prefix") {
    return uniqueRenamedBase(`${base}_${sourceBase}`, usedNames);
  }

  if (mode === "suffix") {
    return uniqueRenamedBase(`${sourceBase}_${base}`, usedNames);
  }

  do {
    candidate = `${base}_${String(counter).padStart(3, "0")}.webp`;
    counter += 1;
  } while (usedNames.has(candidate.toLowerCase()));

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function revokeObjectUrls() {
  state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.objectUrls = [];
}

function revokeSourceUrls() {
  state.sourceUrls.forEach((url) => URL.revokeObjectURL(url));
  state.sourceUrls = [];
}

function setNotice(message) {
  if (!message) return;

  const toast = document.createElement("div");
  const text = document.createElement("span");
  const close = document.createElement("button");

  toast.className = "toast";
  text.textContent = message;
  close.className = "toast-close";
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss notification");
  close.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  const dismiss = () => {
    window.clearTimeout(timeoutId);
    toast.remove();
  };
  const timeoutId = window.setTimeout(dismiss, 3000);

  close.addEventListener("click", dismiss);
  toast.append(text, close);
  toastStack.appendChild(toast);
}

function updateGlobalActions() {
  clearButton.disabled = (!state.files.length && !state.results.length && !state.errors
    .length) || state.converting;
}

function renderResults() {
  const convertedCount = state.results.filter(Boolean).length;
  const queuedCount = state.files.length;

  convertAllButton.disabled = !queuedCount || state.converting;
  saveAllButton.disabled = !queuedCount || state.converting;
  footerStatus.textContent = convertedCount ?
    `${convertedCount} file${convertedCount === 1 ? "" : "s"} ready to save.` :
    queuedCount ?
      `${queuedCount} file${queuedCount === 1 ? "" : "s"} ready` :
      "";

  if (!queuedCount) {
    results.innerHTML = `
          ${emptyUploadHtml()}
        `;
    return;
  }

  const resultHtml = state.files.map((file, index) => {
    const item = state.results[index];
    const error = state.errors[index];
    const isConverting = state.convertingIndex === index;
    const change = item ? formatSizeChange(item.originalSize, item.blob.size) : null;
    const dimensions = state.dimensions[index];
    const thumbImage = item ?
      `<img class="thumb" src="${item.url}" alt="Preview of ${escapeHtml(item.outputName)}">` :
      `<img class="thumb" src="${state.sourceUrls[index]}" alt="Preview of ${escapeHtml(file.name)}">`;
    const thumbnail = `
          <div class="thumb-wrap">
            ${thumbImage}
            <button class="remove-item" type="button" data-remove-index="${index}" aria-label="Remove ${escapeHtml(file.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        `;
    const statusClass = error ? "error" : item ? "done" : "queued";
    const statusMessage = error ? error.message : "";
    const details = item ?
      `
              <div class="meta-line"><span class="meta-label">ORIG:</span> ${item.originalWidth} x ${item.originalHeight}px, ${formatBytes(item.originalSize)}</div>
              <div class="converted-stack">
                <span class="output-name">${escapeHtml(item.outputName.toUpperCase())}</span>
                <div class="meta-line converted"><span class="meta-label">CONV:</span> ${item.width} x ${item.height}px, ${formatBytes(item.blob.size)} <span class="meta-change ${change.className}">(${change.text})</span></div>
              </div>
            ` :
      `
              <div class="meta-line"><span class="meta-label">ORIG:</span> ${dimensions ? `${dimensions.width} x ${dimensions.height}px` : "Reading dimensions"}, ${formatBytes(file.size)}</div>
            `;

    return `
          <article class="result-item ${item ? "converted" : ""}">
            ${thumbnail}
            <div class="result-meta">
              <div class="filename">
                <span class="source-name">${escapeHtml(file.name.toUpperCase())}</span>
              </div>
              <div class="meta-grid">
                ${details}
              </div>
              ${statusMessage ? `<div class="status-text ${statusClass}">${escapeHtml(statusMessage)}</div>` : ""}
            </div>
            <div class="result-actions">
              <button class="btn ${isConverting ? "converting" : item ? "" : "convert-ready"}" type="button" data-convert-index="${index}" ${state.converting ? "disabled" : ""}>${isConverting ? "Converting" : item ? "Reconvert" : "Convert"}</button>
              <button class="btn" type="button" data-save-index="${index}" ${state.converting ? "disabled" : ""}>Save</button>
            </div>
          </article>
        `;
  }).join("");

  results.innerHTML = `<div class="result-list">${resultHtml}${uploadMoreHtml()}</div>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character]));
}

function emptyUploadHtml() {
  return `
        <div class="empty-state" data-upload-trigger>
          <div class="empty-upload">
            <div class="drop-icon" aria-hidden="true">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12m0-12 4.5 4.5M12 3 7.5 7.5" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round" />
                <path d="M5 15v3a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-3" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" />
              </svg>
            </div>
            <h2>Drop image files here</h2>
            <p>PNG, JPEG, BMP, GIF, and WebP images<br>are processed locally in your browser.</p>
            <div class="button-row" style="justify-content:center">
              <label class="btn primary" for="fileInput">Choose images</label>
            </div>
          </div>
        </div>
      `;
}

function uploadMoreHtml() {
  return `
        <div class="upload-more" data-upload-trigger>
          Upload more images
        </div>
      `;
}

function updateResizeControls() {
  const mode = getResizeMode();
  resizeValueField.hidden = mode === "none";
  if (mode !== "none") {
    resizeValueLabel.textContent = resizeLabels[mode];
    resizeValue.value = resizeValues[mode] || resizeDefaults[mode];
    resizeSuffix.textContent = resizeSuffixes[mode];
    resizeValue.min = "1";
    enlargeOption.hidden = mode !== "width" && mode !== "height";
    updateResizeSuffixPosition();
  } else {
    enlargeOption.hidden = true;
  }
}

function rememberResizeValue() {
  const mode = getResizeMode();
  if (mode !== "none") {
    resizeValues[mode] = resizeValue.value || resizeDefaults[mode];
    updateResizeSuffixPosition();
  }
}

function updateResizeSuffixPosition() {
  const text = resizeValue.value || "1";
  const canvas = updateResizeSuffixPosition.canvas || (updateResizeSuffixPosition.canvas =
    document.createElement("canvas"));
  const context = canvas.getContext("2d");
  const styles = window.getComputedStyle(resizeValue);
  context.font = `${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  resizeSuffix.style.left = `${10 + Math.ceil(context.measureText(text).width) + 1}px`;
}

function stepResizeValue(event) {
  if (!event.shiftKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) {
    return;
  }

  event.preventDefault();
  const direction = event.key === "ArrowUp" ? 1 : -1;
  const current = Number(resizeValue.value) || 0;
  resizeValue.value = String(Math.max(1, current + direction * 10));
  rememberResizeValue();
}

function updateRenameControls() {
  renameOptions.hidden = !renameEnabled.checked;
  updateRenameModeControls();
  refreshConvertedOutputNames();
}

function updateRenameModeControls() {
  document.querySelector(".rename-suffix").hidden = getRenameMode() !== "numbered";
}

function updateQualityControls() {
  qualityOptions.hidden = defaultQuality.checked;
}

function getWebpQuality() {
  return defaultQuality.checked ? 0.9 : Number(qualityRange.value);
}

function refreshConvertedOutputNames() {
  state.results.forEach((item, index) => {
    if (item) {
      item.outputName = outputNameForIndex(index);
    }
  });
  renderResults();
}

function updateRenameInputWidth() {
  renameBase.style.width = "1px";
  renameBase.style.width = `${renameBase.scrollWidth}px`;
}

function focusRenameInput() {
  renameBase.focus();
  if (renameBase.value === builtInDefaults.renameBase) {
    renameBase.select();
    return;
  }
  renameBase.setSelectionRange(renameBase.value.length, renameBase.value.length);
}

function getResizeMode() {
  return document.querySelector('input[name="resizeMode"]:checked')?.value || "none";
}

function getRenameMode() {
  return document.querySelector('input[name="renameMode"]:checked')?.value || "numbered";
}

function setRenameMode(mode) {
  const option = document.querySelector(`input[name="renameMode"][value="${mode}"]`);
  (option || renameNumbered).checked = true;
  updateRenameModeControls();
}

function setResizeMode(mode) {
  const option = document.querySelector(`input[name="resizeMode"][value="${mode}"]`);
  if (option) {
    option.checked = true;
  }
}

function collectCurrentDefaults() {
  rememberResizeValue();
  return {
    defaultQuality: defaultQuality.checked,
    quality: qualityRange.value,
    renameEnabled: renameEnabled.checked,
    renameBase: renameBase.value || "converted",
    renameMode: getRenameMode(),
    saveToFolder: saveToFolder.checked,
    resizeMode: getResizeMode(),
    resizeValues: { ...resizeValues },
    allowEnlarge: allowEnlarge.checked,
    removeMetadata: removeMetadata.checked
  };
}

function applyDefaults(settings) {
  defaultQuality.checked = Boolean(settings.defaultQuality);
  qualityRange.value = settings.quality || builtInDefaults.quality;
  qualityOutput.textContent = Number(qualityRange.value).toFixed(2);

  renameEnabled.checked = Boolean(settings.renameEnabled);
  renameBase.value = settings.renameBase || builtInDefaults.renameBase;
  setRenameMode(settings.renameMode || builtInDefaults.renameMode);
  saveToFolder.checked = settings.saveToFolder !== false;

  Object.assign(resizeValues, resizeDefaults, settings.resizeValues || {});
  setResizeMode(settings.resizeMode || builtInDefaults.resizeMode);
  allowEnlarge.checked = Boolean(settings.allowEnlarge);

  removeMetadata.checked = settings.removeMetadata !== false;

  updateResizeControls();
  updateQualityControls();
  updateRenameControls();
  updateRenameInputWidth();
}

function loadSavedDefaults() {
  try {
    const saved = localStorage.getItem(settingsStorageKey);
    applyDefaults(saved ? { ...builtInDefaults, ...JSON.parse(saved) } : builtInDefaults);
  } catch (error) {
    applyDefaults(builtInDefaults);
  }
}

function saveDefaults() {
  localStorage.setItem(settingsStorageKey, JSON.stringify(collectCurrentDefaults()));
  setNotice("Defaults saved for this browser.");
}

function resetDefaults() {
  localStorage.removeItem(settingsStorageKey);
  applyDefaults(builtInDefaults);
  setNotice("Defaults reset.");
}

function addFiles(fileList) {
  const incoming = Array.from(fileList || []);
  if (!incoming.length) return;

  let skipped = 0;
  const addedIndexes = [];
  const queuedKeys = new Set(state.files.map(fileKey));

  incoming.forEach((file) => {
    const key = fileKey(file);
    if (queuedKeys.has(key)) {
      skipped += 1;
      return;
    }

    queuedKeys.add(key);
    state.files.push(file);
    state.results.push(null);
    state.errors.push(null);
    state.dimensions.push(null);
    const index = state.files.length - 1;
    addedIndexes.push(index);
    const sourceUrl = URL.createObjectURL(file);
    state.sourceUrls.push(sourceUrl);
    readDimensions(file, index);
  });
  statusText.textContent = "";
  setNotice(skipped ? `${skipped} duplicate file${skipped === 1 ? "" : "s"} skipped.` : "");
  updateGlobalActions();
  renderResults();

  if (autoConvertSave.checked && addedIndexes.length) {
    enqueueAutoSave(addedIndexes);
  }
}

function fileKey(file) {
  return `${file.name}|${file.size}|${file.lastModified}`;
}

async function readDimensions(file, index) {
  try {
    const decoded = await decodeImage(file);
    state.dimensions[index] = {
      width: decoded.width,
      height: decoded.height
    };
  } catch (error) {
    state.dimensions[index] = null;
  }
  renderResults();
}

function getResizeDimensions(width, height) {
  const mode = getResizeMode();
  const value = Number(resizeValue.value);

  if (mode === "none") {
    return { width, height };
  }

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Enter a resize value greater than zero.");
  }

  if (mode === "width") {
    const requestedWidth = Math.max(1, Math.round(value));
    const nextWidth = allowEnlarge.checked ? requestedWidth : Math.min(requestedWidth, width);
    return {
      width: nextWidth,
      height: Math.max(1, Math.round(height * (nextWidth / width)))
    };
  }

  if (mode === "height") {
    const requestedHeight = Math.max(1, Math.round(value));
    const nextHeight = allowEnlarge.checked ? requestedHeight : Math.min(requestedHeight,
      height);
    return {
      width: Math.max(1, Math.round(width * (nextHeight / height))),
      height: nextHeight
    };
  }

  const scale = value / 100;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        drawTo(ctx, width, height) {
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
        }
      };
    } catch (error) {
      // Fall back to HTMLImageElement below for formats createImageBitmap rejects.
    }
  }

  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        drawTo(ctx, width, height) {
          ctx.drawImage(image, 0, 0, width, height);
        }
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be decoded as an image."));
    };
    image.src = url;
  });
}

function canvasToWebp(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("The browser could not create a WebP file."));
        return;
      }
      resolve(blob);
    }, "image/webp", quality);
  });
}

async function convertFile(file, outputName) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Unsupported file type.");
  }

  const decoded = await decodeImage(file);
  const size = getResizeDimensions(decoded.width, decoded.height);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("Canvas is unavailable in this browser.");
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  decoded.drawTo(ctx, size.width, size.height);

  const quality = getWebpQuality();
  const blob = await canvasToWebp(canvas, quality);
  const url = URL.createObjectURL(blob);
  state.objectUrls.push(url);

  return {
    originalName: file.name,
    originalSize: file.size,
    outputName,
    originalWidth: decoded.width,
    originalHeight: decoded.height,
    width: size.width,
    height: size.height,
    metadataRemoved: true,
    blob,
    url
  };
}

function outputNameForIndex(targetIndex) {
  const usedNames = new Set();
  let outputName = "";

  state.files.forEach((file, index) => {
    const candidate = renameEnabled.checked ?
      renamedOutputName(file, index, usedNames) :
      uniqueOutputName(file, usedNames);
    if (index === targetIndex) {
      outputName = candidate;
    }
  });

  return outputName;
}

async function convertOne(index, batchMode = false) {
  if (!state.files[index] || state.converting) return;

  state.converting = true;
  state.convertingIndex = index;
  setNotice("");
  state.errors[index] = null;
  statusText.textContent = `Converting ${state.files[index].name}...`;
  updateGlobalActions();
  renderResults();

  if (state.results[index]?.url) {
    URL.revokeObjectURL(state.results[index].url);
  }
  state.results[index] = null;

  try {
    state.results[index] = await convertFile(state.files[index], outputNameForIndex(index));
  } catch (error) {
    state.errors[index] = {
      name: state.files[index].name,
      message: error.message || "Could not convert this file."
    };
  }

  state.converting = false;
  state.convertingIndex = null;

  if (!batchMode) {
    const convertedCount = state.results.filter(Boolean).length;
    const errorCount = state.errors.filter(Boolean).length;
    statusText.textContent =
      `${convertedCount} converted${errorCount ? `, ${errorCount} skipped` : ""}.`;
    updateGlobalActions();
    renderResults();
  }
}

async function saveOne(index) {
  if (!state.files[index] || state.converting) return;

  if (!state.results[index]) {
    await convertOne(index);
  }

  const item = state.results[index];
  if (item) {
    downloadBlob(item.blob, item.outputName);
  }
}

async function convertAll() {
  if (!state.files.length || state.converting) return;

  setNotice("");
  statusText.textContent = "Converting images...";
  updateGlobalActions();
  renderResults();

  for (let index = 0; index < state.files.length; index += 1) {
    await convertOne(index, true);
    statusText.textContent =
      `Converted ${state.results.filter(Boolean).length} of ${state.files.length}.`;
    renderResults();
  }

  const convertedCount = state.results.filter(Boolean).length;
  const errorCount = state.errors.filter(Boolean).length;
  statusText.textContent =
    `${convertedCount} converted${errorCount ? `, ${errorCount} skipped` : ""}.`;
  updateGlobalActions();
  renderResults();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function crc32(bytes) {
  const table = crc32.table || (crc32.table = Array.from({ length: 256 }, (_, index) => {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    return value >>> 0;
  }));

  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipTimestamp(date = new Date()) {
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date
    .getSeconds() / 2);
  const day = Math.max(1, date.getDate());
  const month = date.getMonth() + 1;
  const year = Math.max(1980, date.getFullYear()) - 1980;
  return {
    time,
    date: (year << 9) | (month << 5) | day
  };
}

function makeZipRecord(signature, length) {
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  view.setUint32(0, signature, true);
  return { bytes: new Uint8Array(buffer), view };
}

async function buildZipBlob(entries) {
  const encoder = new TextEncoder();
  const chunks = [];
  const centralDirectory = [];
  const timestamp = zipTimestamp();
  let offset = 0;

  for (const entry of entries) {
    const pathBytes = encoder.encode(entry.path);
    const data = new Uint8Array(await entry.blob.arrayBuffer());
    const checksum = crc32(data);

    if (data.byteLength > 0xffffffff || offset > 0xffffffff) {
      throw new Error("This batch is too large for a ZIP download.");
    }

    const local = makeZipRecord(0x04034b50, 30);
    local.view.setUint16(4, 20, true);
    local.view.setUint16(6, 0, true);
    local.view.setUint16(8, 0, true);
    local.view.setUint16(10, timestamp.time, true);
    local.view.setUint16(12, timestamp.date, true);
    local.view.setUint32(14, checksum, true);
    local.view.setUint32(18, data.byteLength, true);
    local.view.setUint32(22, data.byteLength, true);
    local.view.setUint16(26, pathBytes.byteLength, true);
    local.view.setUint16(28, 0, true);
    chunks.push(local.bytes, pathBytes, data);

    const central = makeZipRecord(0x02014b50, 46);
    central.view.setUint16(4, 20, true);
    central.view.setUint16(6, 20, true);
    central.view.setUint16(8, 0, true);
    central.view.setUint16(10, 0, true);
    central.view.setUint16(12, timestamp.time, true);
    central.view.setUint16(14, timestamp.date, true);
    central.view.setUint32(16, checksum, true);
    central.view.setUint32(20, data.byteLength, true);
    central.view.setUint32(24, data.byteLength, true);
    central.view.setUint16(28, pathBytes.byteLength, true);
    central.view.setUint16(30, 0, true);
    central.view.setUint16(32, 0, true);
    central.view.setUint16(34, 0, true);
    central.view.setUint16(36, 0, true);
    central.view.setUint32(38, 0, true);
    central.view.setUint32(42, offset, true);
    centralDirectory.push(central.bytes, pathBytes);

    offset += local.bytes.byteLength + pathBytes.byteLength + data.byteLength;
  }

  const centralOffset = offset;
  const centralSize = centralDirectory.reduce((total, chunk) => total + chunk.byteLength, 0);
  const end = makeZipRecord(0x06054b50, 22);
  end.view.setUint16(4, 0, true);
  end.view.setUint16(6, 0, true);
  end.view.setUint16(8, entries.length, true);
  end.view.setUint16(10, entries.length, true);
  end.view.setUint32(12, centralSize, true);
  end.view.setUint32(16, centralOffset, true);
  end.view.setUint16(20, 0, true);

  return new Blob([...chunks, ...centralDirectory, end.bytes], { type: "application/zip" });
}

function enqueueAutoSave(indexes) {
  indexes.forEach((index) => {
    if (!state.autoQueue.includes(index)) {
      state.autoQueue.push(index);
    }
  });
  processAutoQueue();
}

async function processAutoQueue() {
  if (state.autoProcessing || !autoConvertSave.checked) return;

  state.autoProcessing = true;
  while (state.autoQueue.length && autoConvertSave.checked) {
    const index = state.autoQueue.shift();
    if (!state.files[index]) continue;

    if (!state.results[index]) {
      await convertOne(index, true);
    }

    const item = state.results[index];
    if (item) {
      downloadBlob(item.blob, item.outputName);
      setNotice(`Auto saved ${item.outputName}.`);
    }
  }

  state.autoProcessing = false;
  const convertedCount = state.results.filter(Boolean).length;
  const errorCount = state.errors.filter(Boolean).length;
  statusText.textContent = convertedCount ?
    `${convertedCount} converted${errorCount ? `, ${errorCount} skipped` : ""}.` : "";
  updateGlobalActions();
  renderResults();
}

async function saveAllToFolder() {
  if (!state.files.length || state.converting) return;

  if (state.results.some((item) => !item)) {
    await convertAll();
  }

  const convertedItems = state.results.filter(Boolean);
  if (!convertedItems.length) {
    setNotice("No files could be converted, so there is nothing to save.");
    return;
  }

  if (!saveToFolder.checked) {
    convertedItems.forEach((item) => downloadBlob(item.blob, item.outputName));
    setNotice(
      `Downloaded ${convertedItems.length} file${convertedItems.length === 1 ? "" : "s"}.`);
    return;
  }

  try {
    const folderName = outputFolderName();
    const entries = convertedItems.map((item) => ({
      path: `${folderName}/${item.outputName}`,
      blob: item.blob
    }));
    const zipBlob = await buildZipBlob(entries);
    downloadBlob(zipBlob, `${folderName}.zip`);
    setNotice(`Downloaded ${folderName}.zip.`);
  } catch (error) {
    setNotice(error.message || "The browser could not create the ZIP file.");
  }
}

function clearAll() {
  state.files = [];
  state.results = [];
  state.errors = [];
  state.dimensions = [];
  state.autoQueue = [];
  revokeObjectUrls();
  revokeSourceUrls();
  fileInput.value = "";
  setNotice("");
  statusText.textContent = "";
  updateGlobalActions();
  renderResults();
}

function removeFile(index) {
  if (state.converting || !state.files[index]) return;

  const resultUrl = state.results[index]?.url;
  const sourceUrl = state.sourceUrls[index];
  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
  }
  if (sourceUrl) {
    URL.revokeObjectURL(sourceUrl);
  }

  state.files.splice(index, 1);
  state.results.splice(index, 1);
  state.errors.splice(index, 1);
  state.dimensions.splice(index, 1);
  state.sourceUrls.splice(index, 1);
  state.objectUrls = state.objectUrls.filter((url) => url !== resultUrl);
  state.autoQueue = state.autoQueue
    .filter((queuedIndex) => queuedIndex !== index)
    .map((queuedIndex) => queuedIndex > index ? queuedIndex - 1 : queuedIndex);

  statusText.textContent = "";
  updateGlobalActions();
  renderResults();
}

function wireDropTarget(element) {
  element.addEventListener("dragenter", (event) => {
    event.preventDefault();
    element.classList.add("dragging");
  });

  element.addEventListener("dragover", (event) => {
    event.preventDefault();
    element.classList.add("dragging");
  });

  element.addEventListener("dragleave", (event) => {
    if (!element.contains(event.relatedTarget)) {
      element.classList.remove("dragging");
    }
  });

  element.addEventListener("drop", (event) => {
    event.preventDefault();
    element.classList.remove("dragging");
    addFiles(event.dataTransfer.files);
  });
}

wireDropTarget(resultsPanel);

fileInput.addEventListener("change", () => addFiles(fileInput.files));

resizeModeGroup.addEventListener("change", updateResizeControls);
resizeValue.addEventListener("input", rememberResizeValue);
resizeValue.addEventListener("keydown", stepResizeValue);

qualityRange.addEventListener("input", () => {
  qualityOutput.textContent = Number(qualityRange.value).toFixed(2);
});

defaultQuality.addEventListener("change", updateQualityControls);

renameEnabled.addEventListener("change", updateRenameControls);
renameBase.addEventListener("input", () => {
  updateRenameInputWidth();
  refreshConvertedOutputNames();
});
document.querySelectorAll('input[name="renameMode"]').forEach((option) => {
  option.addEventListener("change", () => {
    updateRenameModeControls();
    refreshConvertedOutputNames();
  });
});
renameBase.addEventListener("focus", () => {
  if (renameBase.value === builtInDefaults.renameBase) {
    renameBase.select();
  }
});
document.querySelector(".rename-preview").addEventListener("click", focusRenameInput);
removeMetadata.addEventListener("change", () => {
  setNotice("");
});
autoConvertSave.addEventListener("change", () => {
  if (autoConvertSave.checked) {
    setNotice("Auto convert and save is on.");
    const unconvertedIndexes = state.files
      .map((file, index) => state.results[index] ? null : index)
      .filter((index) => index !== null);
    enqueueAutoSave(unconvertedIndexes);
    return;
  }

  state.autoQueue = [];
  setNotice("Auto convert and save is off.");
});

convertAllButton.addEventListener("click", convertAll);
clearButton.addEventListener("click", clearAll);
saveAllButton.addEventListener("click", saveAllToFolder);
saveDefaultsButton.addEventListener("click", saveDefaults);
resetDefaultsButton.addEventListener("click", resetDefaults);

results.addEventListener("click", (event) => {
  if (event.target.closest("[data-upload-trigger]")) {
    fileInput.click();
    return;
  }

  const removeButton = event.target.closest("[data-remove-index]");
  if (removeButton) {
    removeFile(Number(removeButton.dataset.removeIndex));
    return;
  }

  const convertButton = event.target.closest("[data-convert-index]");
  if (convertButton) {
    convertOne(Number(convertButton.dataset.convertIndex));
    return;
  }

  const button = event.target.closest("[data-save-index]");
  if (!button) return;

  saveOne(Number(button.dataset.saveIndex));
});

loadSavedDefaults();
updateGlobalActions();
renderResults();
