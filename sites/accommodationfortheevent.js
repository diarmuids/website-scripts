// Last updated: 2026-09-12 16:01:44

// Version: 2026-05-13.1
// Paste this whole file into the browser DevTools console while viewing either:
// - one accommodation detail page, or
// - the Ryder Cup rentals listing page.
//
// On a detail page it downloads that one listing.
// On a listing page it opens a bottom-right scraper panel that can collect
// listings across pagination and download JSON plus Webflow import-ready CSV.

(() => {
  const SCRIPT_VERSION = "2026-05-13.1";
  const PANEL_ID = "afte-scraper-panel";
  const IMPORT_HEADERS = [
    "Name",
    "Archived",
    "Draft",
    "Meta description",
    "Location",
    "County",
    "Bedrooms",
    "Price",
    "Contact Name",
    "Contact Number",
    "Description",
    "Existing URL",
    "Listing Page URL",
    "Main Image",
    "Gallery",
  ];

  const state = {
    running: false,
    currentPageUrl: window.location.href,
    pagesScanned: 0,
    found: 0,
    queued: 0,
    downloaded: 0,
    success: 0,
    failed: 0,
    errors: [],
    listings: [],
    rows: [],
    seenUrls: new Set(),
  };

  const cleanText = (value) => (value || "").replace(/\s+/g, " ").trim();

  const absoluteUrl = (url, baseUrl = window.location.href) => {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url || "";
    }
  };

  const unique = (values) => [...new Set(values.filter(Boolean))];

  const imageSizeArea = (url) => {
    const match = String(url).match(/\/(\d+)x(\d+)_p/i);
    return match ? Number(match[1]) * Number(match[2]) : 0;
  };

  const sortImagesLargestFirst = (urls) =>
    [...urls].sort((a, b) => imageSizeArea(b) - imageSizeArea(a) || a.localeCompare(b));

  const imageCandidates = (url, baseUrl) => {
    const sizes = ["700x500", "1024x768", "1200x900", "1400x1000", "1600x1200", "2000x1500"];
    const value = absoluteUrl(url, baseUrl);
    const candidates = [value];

    for (const size of sizes) {
      candidates.push(value.replace(/\/\d+x\d+_p/i, `/${size}_p`));
    }

    candidates.push(value.replace(/\/\d+x\d+_p/i, "/p"));
    return unique(candidates);
  };

  const imageExists = async (url) => {
    try {
      const response = await fetch(url, { method: "HEAD", cache: "no-store" });
      const contentType = response.headers.get("content-type") || "";
      return response.ok && contentType.toLowerCase().includes("image");
    } catch {
      try {
        const response = await fetch(url, { method: "GET", cache: "no-store" });
        const contentType = response.headers.get("content-type") || "";
        return response.ok && contentType.toLowerCase().includes("image");
      } catch {
        return false;
      }
    }
  };

  const filterExistingImages = async (urls) => {
    const checks = await Promise.all(
      unique(urls).map(async (url) => ({
        url,
        exists: await imageExists(url),
      }))
    );

    return sortImagesLargestFirst(checks.filter((item) => item.exists).map((item) => item.url));
  };

  const download = (filename, mimeType, content) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const csvEscape = (value) => {
    const stringValue = String(value ?? "");
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const csvFromRows = (headers, rows) =>
    `${headers.join(",")}\n${rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")).join("\n")}\n`;

  const compactDescription = (value, maxLength = 155) => {
    const text = cleanText(value);
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}...`;
  };

  const countyFromLocation = (value) => {
    const text = cleanText(value);
    const explicitCounty = text.match(/\b(?:co\.?|county)\s+([a-z][a-z\s'-]+)/i);
    if (explicitCounty) return cleanText(explicitCounty[1]).replace(/[,.]$/, "");

    const parts = text
      .split(",")
      .map((part) => cleanText(part).replace(/^(?:co\.?|county)\s+/i, "").replace(/[,.]$/, ""))
      .filter(Boolean);

    return parts.length > 1 ? parts[parts.length - 1] : "";
  };

  const parseHtml = (html) => new DOMParser().parseFromString(html, "text/html");

  const fetchDocument = async (url) => {
    const response = await fetch(url, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return parseHtml(await response.text());
  };

  const detailValueFromContainer = (container, label) => {
    if (!container) return "";
    const labelElement = [...container.querySelectorAll("b, strong")].find(
      (node) => cleanText(node.textContent).toLowerCase() === label.toLowerCase()
    );
    if (!labelElement) return "";

    let value = "";
    let node = labelElement.nextSibling;
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.matches("br")) break;
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.matches("b, strong") &&
        cleanText(node.textContent)
      ) {
        break;
      }
      value += node.textContent || "";
      node = node.nextSibling;
    }

    return cleanText(value.replace(/^:/, ""));
  };

  const detailValueFromText = (text, label) => {
    const pattern = new RegExp(`${label}\\s*:\\s*(.*?)(?=\\s*(Location|Bedrooms|Price)\\s*:|$)`, "i");
    const match = cleanText(text).match(pattern);
    return cleanText(match?.[1]);
  };

  const extractListing = async (doc = document, pageUrl = window.location.href, listingPageUrl = "") => {
    const mainContent = doc.querySelector(".listing_detail .main_content") || doc.querySelector(".main_content");
    const title = cleanText(mainContent?.querySelector("h1")?.textContent || doc.querySelector("h1")?.textContent);
    const metaTitle = cleanText(doc.querySelector("title")?.textContent);
    const metaDescription = cleanText(doc.querySelector('meta[name="description"]')?.getAttribute("content"));
    const canonicalUrl = absoluteUrl(doc.querySelector('link[rel="canonical"]')?.getAttribute("href"), pageUrl);
    const ogTitle = cleanText(doc.querySelector('meta[property="og:title"]')?.getAttribute("content"));
    const ogDescription = cleanText(doc.querySelector('meta[property="og:description"]')?.getAttribute("content"));
    const ogImage = absoluteUrl(doc.querySelector('meta[property="og:image"]')?.getAttribute("content"), pageUrl);

    const detailParagraph = [...(mainContent?.querySelectorAll("p, div") || [])].find((node) =>
      /\b(location|bedrooms|price)\b\s*:/i.test(cleanText(node.textContent))
    );

    const descriptionNodes = mainContent
      ? [...mainContent.children].filter((node) => {
        const text = cleanText(node.textContent);
        if (node.matches?.("h1")) return false;
        if (node === detailParagraph) return false;
        if (!text) return false;
        if (/\b(location|bedrooms|price)\b\s*:/i.test(text)) return false;
        if (/please contact/i.test(text)) return false;
        return node.matches?.("p, ul, ol, div, section, article") || false;
      })
      : [];

    const descriptionHtml =
      descriptionNodes.map((node) => node.outerHTML).join("\n").trim() ||
      [...(mainContent?.querySelectorAll("p, ul, ol") || [])]
        .filter((node) => {
          const text = cleanText(node.textContent);
          return node !== detailParagraph && text && !/\b(location|bedrooms|price)\b\s*:/i.test(text);
        })
        .map((node) => node.outerHTML)
        .join("\n")
        .trim();

    const descriptionText =
      cleanText(descriptionNodes.map((node) => node.textContent).join(" ")) ||
      cleanText(
        [...(mainContent?.querySelectorAll("p, ul, ol") || [])]
          .filter((node) => {
            const text = cleanText(node.textContent);
            return node !== detailParagraph && text && !/\b(location|bedrooms|price)\b\s*:/i.test(text);
          })
          .map((node) => node.textContent)
          .join(" ")
      );

    const detailsText = cleanText(detailParagraph?.textContent);
    const location = detailValueFromContainer(detailParagraph, "Location") || detailValueFromText(detailsText, "Location");
    const bedroomsRaw = detailValueFromContainer(detailParagraph, "Bedrooms") || detailValueFromText(detailsText, "Bedrooms");
    const price = detailValueFromContainer(detailParagraph, "Price") || detailValueFromText(detailsText, "Price");
    const bedrooms = /^\d+$/.test(bedroomsRaw) ? Number(bedroomsRaw) : bedroomsRaw;
    const county = countyFromLocation(location);

    const contactParagraph = [...doc.querySelectorAll("p")].find((p) => /please contact/i.test(cleanText(p.textContent)));
    const contactName = cleanText(contactParagraph?.querySelector("b, strong")?.textContent);
    const contactPhone = cleanText(contactParagraph?.querySelector("span")?.textContent);

    const eventNotice = doc.querySelector(".event_notice");
    const eventInfoUrl = absoluteUrl(eventNotice?.querySelector("a[href]")?.getAttribute("href"), pageUrl);
    const imageElements = [...doc.querySelectorAll("#galleria img, .galleria img, .img_group img")];
    const imageLinkUrls = [...doc.querySelectorAll("#galleria a[href], .galleria a[href], .img_group a[href]")]
      .map((link) => absoluteUrl(link.getAttribute("href"), pageUrl));
    const imageThumbUrls = unique(imageElements.map((img) => absoluteUrl(img.getAttribute("src"), pageUrl)));
    const imageDataBigUrls = unique(imageElements.map((img) => absoluteUrl(img.getAttribute("data-big"), pageUrl)));
    const knownImageUrls = sortImagesLargestFirst([...imageDataBigUrls, ...imageLinkUrls, ...imageThumbUrls]);
    const probedImageUrls = await filterExistingImages(knownImageUrls.flatMap((url) => imageCandidates(url, pageUrl)));
    const imageUrls = probedImageUrls.length ? probedImageUrls : knownImageUrls;
    const resolvedUrl = canonicalUrl || pageUrl;

    const listing = {
      scraper_version: SCRIPT_VERSION,
      source_url: pageUrl,
      listing_page_url: listingPageUrl,
      canonical_url: canonicalUrl,
      scraped_at: new Date().toISOString(),
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_title: ogTitle,
      og_description: ogDescription,
      og_image: ogImage,
      title,
      description_html: descriptionHtml,
      description_text: descriptionText,
      location,
      county,
      bedrooms,
      price,
      contact_name: contactName,
      contact_phone: contactPhone,
      image_urls_large: imageUrls,
      image_urls_known: knownImageUrls,
      image_urls_thumbnails: imageThumbUrls,
      event_notice: cleanText(eventNotice?.textContent),
      event_info_url: eventInfoUrl,
    };

    const row = {
      Name: title,
      Archived: "FALSE",
      Draft: "FALSE",
      "Meta description": metaDescription || ogDescription || compactDescription(descriptionText),
      Location: location,
      County: county,
      Bedrooms: bedrooms,
      Price: price,
      "Contact Name": contactName,
      "Contact Number": contactPhone,
      Description: descriptionHtml,
      "Existing URL": resolvedUrl,
      "Listing Page URL": listingPageUrl,
      "Main Image": imageUrls[0] || ogImage,
      Gallery: imageUrls.slice(1).join("; "),
    };

    return { listing, row };
  };

  const listingUrlsFromDocument = (doc, pageUrl) => {
    const urls = [
      ...doc.querySelectorAll(
        ".listing_house_rental_listing .listing_info a[href], .listing_house_rental_listing .listing_name a[href], .listing_house_rental_listing .img_cell a[href]"
      ),
    ].map((link) => absoluteUrl(link.getAttribute("href"), pageUrl));

    return unique(urls).filter((url) => /\/rydercup\/\d+\/rentals\/\d+\/?$/i.test(url));
  };

  const nextPageFromDocument = (doc, pageUrl) => {
    const navLinks = [...doc.querySelectorAll(".category_page_nav a[href]")];
    const nextLink = navLinks.find((link) => /next/i.test(cleanText(link.textContent)));
    return nextLink ? absoluteUrl(nextLink.getAttribute("href"), pageUrl) : "";
  };

  const pageUrlForNumber = (currentUrl, pageNumber) => {
    const number = Math.max(1, Number.parseInt(pageNumber, 10) || 1);
    const url = new URL(currentUrl, window.location.href);
    const path = url.pathname.replace(/\/+$/, "/");
    const basePath = path.replace(/\/\d+\/$/, "/");
    url.pathname = number === 1 ? basePath : `${basePath}${number}/`;
    return url.href;
  };

  const isDetailPage = () => Boolean(document.querySelector(".listing_detail .main_content, #galleria, .galleria"));

  const setPanelText = (key, value) => {
    const node = document.querySelector(`#${PANEL_ID} [data-afte="${key}"]`);
    if (node) node.textContent = String(value);
  };

  const updatePanel = (status = "") => {
    setPanelText("status", status || (state.running ? "Running" : "Ready"));
    setPanelText("pages", state.pagesScanned);
    setPanelText("found", state.found);
    setPanelText("queued", state.queued);
    setPanelText("downloaded", state.downloaded);
    setPanelText("success", state.success);
    setPanelText("failed", state.failed);
    setPanelText("current", state.currentPageUrl || "-");
    const startButton = document.querySelector(`#${PANEL_ID} [data-action="start"]`);
    const stopButton = document.querySelector(`#${PANEL_ID} [data-action="stop"]`);
    if (startButton) startButton.disabled = state.running;
    if (stopButton) stopButton.disabled = !state.running;
  };

  const addPanel = () => {
    document.getElementById(PANEL_ID)?.remove();

    const style = document.createElement("style");
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        right: 18px;
        bottom: 18px;
        z-index: 2147483647;
        width: 330px;
        box-sizing: border-box;
        padding: 14px;
        border: 1px solid #25563b;
        border-radius: 8px;
        background: #ffffff;
        color: #111111;
        font: 13px/1.35 Arial, sans-serif;
        box-shadow: 0 14px 36px rgba(0, 0, 0, 0.24);
      }
      #${PANEL_ID} * { box-sizing: border-box; font-family: Arial, sans-serif; }
      #${PANEL_ID} h3 { margin: 0 0 10px; font-size: 15px; line-height: 1.2; }
      #${PANEL_ID} label { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; }
      #${PANEL_ID} input { width: 90px; padding: 6px 7px; border: 1px solid #bbbbbb; border-radius: 4px; }
      #${PANEL_ID} button { padding: 7px 10px; border: 0; border-radius: 4px; cursor: pointer; font-weight: 700; }
      #${PANEL_ID} button:disabled { opacity: 0.5; cursor: default; }
      #${PANEL_ID} [data-action="start"] { background: #205019; color: #ffffff; }
      #${PANEL_ID} [data-action="stop"] { background: #ececec; color: #111111; }
      #${PANEL_ID} [data-action="close"] { margin-left: auto; background: transparent; color: #333333; padding: 2px 5px; }
      #${PANEL_ID} .afte-head { display: flex; align-items: center; gap: 8px; }
      #${PANEL_ID} .afte-actions { display: flex; gap: 8px; margin: 0 0 11px; }
      #${PANEL_ID} .afte-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; margin: 0 0 10px; }
      #${PANEL_ID} .afte-grid div { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid #eeeeee; padding-bottom: 3px; }
      #${PANEL_ID} .afte-current { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #444444; font-size: 11px; }
      #${PANEL_ID} .afte-status { margin: 0 0 8px; font-weight: 700; color: #205019; }
    `;
    document.head.appendChild(style);

    const panel = document.createElement("div");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="afte-head">
        <h3>AFTE scraper <span style="font-weight:400">v${SCRIPT_VERSION}</span></h3>
        <button type="button" data-action="close" title="Close">x</button>
      </div>
      <label>
        Listings to download
        <input type="number" min="1" step="1" value="6" data-afte-input="limit">
      </label>
      <label>
        Start page
        <input type="number" min="1" step="1" value="1" data-afte-input="start-page">
      </label>
      <div class="afte-actions">
        <button type="button" data-action="start">Scrape</button>
        <button type="button" data-action="stop" disabled>Stop</button>
      </div>
      <div class="afte-status" data-afte="status">Ready</div>
      <div class="afte-grid">
        <div><span>Pages</span><strong data-afte="pages">0</strong></div>
        <div><span>Found</span><strong data-afte="found">0</strong></div>
        <div><span>Queued</span><strong data-afte="queued">0</strong></div>
        <div><span>Downloaded</span><strong data-afte="downloaded">0</strong></div>
        <div><span>Successful</span><strong data-afte="success">0</strong></div>
        <div><span>Failed</span><strong data-afte="failed">0</strong></div>
      </div>
      <div class="afte-current" data-afte="current">-</div>
    `;

    document.body.appendChild(panel);
    panel.querySelector('[data-action="start"]').addEventListener("click", startListingScrape);
    panel.querySelector('[data-action="stop"]').addEventListener("click", () => {
      state.running = false;
      updatePanel("Stopping after current request");
    });
    panel.querySelector('[data-action="close"]').addEventListener("click", () => panel.remove());
    updatePanel();
  };

  const resetRun = () => {
    state.running = true;
    state.currentPageUrl = window.location.href;
    state.pagesScanned = 0;
    state.found = 0;
    state.queued = 0;
    state.downloaded = 0;
    state.success = 0;
    state.failed = 0;
    state.errors = [];
    state.listings = [];
    state.rows = [];
    state.seenUrls = new Set();
  };

  const downloadResults = () => {
    const date = new Date().toISOString().slice(0, 10);
    const csv = csvFromRows(IMPORT_HEADERS, state.rows);
    const json = JSON.stringify(
      {
        scraper_version: SCRIPT_VERSION,
        scraped_at: new Date().toISOString(),
        success: state.success,
        failed: state.failed,
        errors: state.errors,
        listings: state.listings,
      },
      null,
      2
    );

    download(`accommodation-listings-${date}.json`, "application/json;charset=utf-8", json);
    download(`accommodation-listings-${date}.csv`, "text/csv;charset=utf-8", csv);
  };

  const startListingScrape = async () => {
    const limitInput = document.querySelector(`#${PANEL_ID} [data-afte-input="limit"]`);
    const startPageInput = document.querySelector(`#${PANEL_ID} [data-afte-input="start-page"]`);
    const limit = Math.max(1, Number.parseInt(limitInput?.value || "1", 10) || 1);
    const startPage = Math.max(1, Number.parseInt(startPageInput?.value || "1", 10) || 1);
    resetRun();
    updatePanel("Scanning listing page");

    let nextPageUrl = pageUrlForNumber(window.location.href, startPage);

    try {
      while (state.running && nextPageUrl && state.queued < limit) {
        state.currentPageUrl = nextPageUrl;
        updatePanel("Scanning listing page");
        const pageDoc = nextPageUrl === window.location.href ? document : await fetchDocument(nextPageUrl);
        state.pagesScanned += 1;

        const urls = listingUrlsFromDocument(pageDoc, nextPageUrl);
        state.found += urls.length;

        for (const url of urls) {
          if (!state.running || state.queued >= limit) break;
          if (state.seenUrls.has(url)) continue;
          state.seenUrls.add(url);
          state.queued += 1;
          state.currentPageUrl = url;
          updatePanel("Downloading detail page");

          try {
            const detailDoc = await fetchDocument(url);
            state.downloaded += 1;
            const { listing, row } = await extractListing(detailDoc, url, nextPageUrl);
            state.listings.push(listing);
            state.rows.push(row);
            state.success += 1;
            updatePanel("Listing saved");
          } catch (error) {
            state.failed += 1;
            state.errors.push({ url, message: error?.message || String(error) });
            console.warn("AFTE scraper failed:", url, error);
            updatePanel("Listing failed");
          }
        }

        nextPageUrl = state.queued < limit ? nextPageFromDocument(pageDoc, nextPageUrl) : "";
      }

      state.running = false;
      if (state.rows.length) {
        updatePanel("Downloading CSV and JSON");
        downloadResults();
        updatePanel("Finished");
      } else {
        updatePanel("No listings downloaded");
      }
      console.log(`AFTE scraper ${SCRIPT_VERSION} finished`, {
        success: state.success,
        failed: state.failed,
        rows: state.rows,
        errors: state.errors,
      });
    } catch (error) {
      state.running = false;
      state.failed += 1;
      state.errors.push({ url: state.currentPageUrl, message: error?.message || String(error) });
      console.error("AFTE scraper stopped:", error);
      updatePanel("Stopped with an error");
    }
  };

  const runSingleDetailPage = async () => {
    const { listing, row } = await extractListing(document, window.location.href);
    const date = new Date().toISOString().slice(0, 10);
    download(`accommodation-listing-${date}.json`, "application/json;charset=utf-8", JSON.stringify(listing, null, 2));
    download(`accommodation-listing-${date}.csv`, "text/csv;charset=utf-8", csvFromRows(IMPORT_HEADERS, [row]));
    console.log(`Extracted accommodation listing with scraper ${SCRIPT_VERSION}:`, listing);
    console.log("Webflow import CSV row:", row);
  };

  if (isDetailPage()) {
    runSingleDetailPage().catch((error) => console.error("AFTE detail scraper failed:", error));
  } else {
    addPanel();
    console.log(`AFTE listing scraper ${SCRIPT_VERSION} ready. Use the bottom-right panel to start.`);
  }
})();


