// Last updated: 2026-10-06 08:33:40

// Chanelle Pet site script. Loaded in the site footer before Finsweet Attributes,
// so anything that must exist before the List solution starts runs at top level.

(function () {
  // Run once, even if the page includes the script twice (e.g. a loader plus a plain tag).
  if (window.chanellePetLoaded) return;
  window.chanellePetLoaded = true;

  // CMS card links: the API can't set "current item" links, so cards link to the
  // template root (/product or /brands) and carry the item slug as their id.
  const fixItemLinks = (root = document) => {
    root.querySelectorAll('a[id][href="/product"], a[id][href="/brands"]').forEach((a) => {
      a.href = `${a.getAttribute('href')}/${a.id}`;
      a.removeAttribute('id');
    });
  };
  // "On offer" badge on product cards whose hidden offer field is "true".
  const addOfferBadges = (root = document) => {
    root.querySelectorAll('.product-card').forEach((card) => {
      if (card.querySelector('.product-card_badge')) return;
      if (card.querySelector('[fs-list-field="offer"]')?.textContent.trim() !== 'true') return;
      // Top left of the image, opposite the heart.
      const badge = document.createElement('div');
      badge.className = 'product-card_badge';
      badge.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg><span>On offer</span>';
      (card.querySelector('.product-card_image-wrap') || card).appendChild(badge);
    });
  };

  // One-line text cut off with an ellipsis (the element's CSS does the cutting); while
  // the pointer is over `hoverEl` it scrolls slowly left to show the rest, then slides back.
  function ellipsisScroll(textEl, hoverEl) {
    // On hover a cut-off name slides quickly to its end, pauses, slides back, pauses,
    // and repeats until the pointer leaves. text-indent moves the text itself, so the
    // CSS ellipsis still shows at rest.
    let run = null;
    hoverEl.addEventListener('mouseenter', () => {
      const overflow = textEl.scrollWidth - textEl.clientWidth;
      if (overflow <= 0 || reduceMotion) return;
      textEl.style.textOverflow = 'clip';
      const slide = Math.max(400, (overflow / 160) * 1000); // ~160px a second
      const pause = 900;
      const total = 2 * slide + 2 * pause;
      const end = `-${overflow + 4}px`;
      run?.cancel();
      run = textEl.animate(
        [
          { textIndent: '0px', offset: 0, easing: 'ease-in-out' },
          { textIndent: end, offset: slide / total },
          { textIndent: end, offset: (slide + pause) / total, easing: 'ease-in-out' },
          { textIndent: '0px', offset: (2 * slide + pause) / total },
          { textIndent: '0px', offset: 1 },
        ],
        { duration: total, delay: 200, iterations: Infinity, easing: 'linear' },
      );
    });
    hoverEl.addEventListener('mouseleave', () => {
      if (!run) return;
      run.cancel();
      run = null;
      textEl.style.textOverflow = '';
    });
  }


  // -------------------------------------------------------
  // FAVOURITES
  // -------------------------------------------------------

  // Visitors heart products on cards or the product page. The list lives in this
  // browser's localStorage (no expiry, no login); a heart in the nav opens a panel
  // listing them. Defined before the first card pass below, which uses it.
  const FAV_KEY = 'chanellePetFavourites';
  const HEART_PATH =
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';
  const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true" style="display:block"><path d="${HEART_PATH}"/></svg>`;

  const favStyle = document.createElement('style');
  favStyle.textContent = `
    .product_item { position: relative; }
    /* Open menu button: its Webflow open-state colour points at a deleted variable. */
    .nav_menu-button.w--open { background-color: var(--colors--pink); }
    .fav-button { position: absolute; z-index: 3; top: .75rem; right: .75rem; width: 2.5rem; height: 2.5rem; padding: .6rem; border: 0; border-radius: var(--radius--radius-circle); background: var(--colors--white); color: var(--colors--dark-gray); box-shadow: 0 2px 8px rgba(15, 23, 42, .12); cursor: pointer; transition: transform .2s, color .2s; }
    .product-card_image-wrap { position: relative; }
    .product-card_badge { position: absolute; z-index: 2; top: 1rem; left: .75rem; display: inline-flex; align-items: center; gap: .35rem; height: 2rem; padding: 0 .75rem; border-radius: var(--radius--radius-circle); background: var(--colors--pink); color: var(--colors--white); font-size: .8125rem; font-weight: 600; line-height: 1; white-space: nowrap; box-shadow: 0 2px 8px rgba(15, 23, 42, .12); }
    /* Dropdown Clear: always shown, greyed and inert until something is ticked. */
    .filters_dropdown-clear[aria-disabled="true"] { opacity: .4; pointer-events: none; cursor: default; }
    .fav-button svg { fill: none; transition: fill .2s; }
    .fav-button:hover { color: var(--colors--pink); transform: scale(1.08); }
    .fav-button.is-active { color: var(--colors--pink); }
    .fav-button.is-active svg { fill: currentColor; }
    .fav-button.is-pop { animation: fav-pop .35s ease; }
    @keyframes fav-pop { 50% { transform: scale(1.25); } }
    .product-hero_image-card { position: relative; }
    .product-hero_image-card .fav-button { top: 1rem; right: 1rem; width: 3rem; height: 3rem; padding: .75rem; }
    /* Nav heart (native in the Nav component, filled in the Designer): outline only
       while there are no favourites. */
    .nav_icon-link.is-fav:not(.is-active) svg { fill: none; }
    .fav-count:empty { display: none; }
    /* Filter dropdown lists: a thin rounded scrollbar that stops short of the rounded
       corners (Webflow can't style scrollbars), so the border and radius stay visible. */
    .filters_dropdown-list::-webkit-scrollbar { width: 10px; }
    .filters_dropdown-list::-webkit-scrollbar-track { background: transparent; margin-block: var(--radius--radius-block); }
    .filters_dropdown-list::-webkit-scrollbar-thumb { background: var(--colors--dark-gray-15); border: 3px solid transparent; background-clip: padding-box; border-radius: var(--radius--radius-circle); }
    .filters_dropdown-list::-webkit-scrollbar-button { display: none; }
    /* Hovering anywhere on a filter chip (a click removes it) turns its x pink. Webflow
       styles can't target a child on the parent's hover. */
    .filters_tag-remove { transition: color .15s ease; }
    .filters_tag:hover .filters_tag-remove { color: var(--colors--pink); }
    @supports not selector(::-webkit-scrollbar) { .filters_dropdown-list { scrollbar-width: thin; scrollbar-color: var(--colors--dark-gray-15) transparent; } }
    .recent_track { display: grid; grid-auto-flow: column; grid-template-columns: none; grid-template-rows: auto; grid-auto-columns: calc((100% - 3 * var(--spacing--medium)) / 4); overflow: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
    .recent_track::-webkit-scrollbar { display: none; }
    .recent_track > * { scroll-snap-align: start; }
    .recent_controls { display: flex; align-items: center; gap: .5rem; }
    .recent_controls > .link_arrow, .recent_controls > .button-group { margin-right: .75rem; }
    .recent_controls.is-static .recent_arrow { display: none; }
    .recent_arrow { width: 2.5rem; height: 2.5rem; padding: .65rem; border: 1px solid var(--colors--pink-tint); border-radius: var(--radius--radius-circle); background: var(--colors--pink-tint); color: var(--colors--pink); cursor: pointer; transition: background-color .2s, border-color .2s, color .2s, opacity .2s; }
    .recent_arrow:hover:not(:disabled) { background: var(--colors--pink); border-color: var(--colors--pink); color: var(--colors--white); }
    .recent_arrow:disabled { opacity: .35; cursor: default; }
    @media (max-width: 991px) { .recent_track { grid-auto-columns: calc((100% - 2 * var(--spacing--medium)) / 3); } }
    @media (max-width: 767px) { .recent_track { grid-auto-columns: calc((100% - var(--spacing--small)) / 2); } }
  `;
  document.head.appendChild(favStyle);

  function readFavourites() {
    try {
      const list = JSON.parse(localStorage.getItem(FAV_KEY));
      return Array.isArray(list) ? list : [];
    } catch (error) {
      return [];
    }
  }
  function saveFavourites(list) {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(list));
    } catch (error) {
      // Storage blocked (private mode etc.): the heart still toggles for this page view.
    }
    favourites = list;
    syncFavourites();
  }
  let favourites = readFavourites();
  // Set by the favourites page (further down) so it re-renders when the list changes.
  let onFavouritesChange = null;
  const isFavourite = (url) => favourites.some((p) => p.url === url);

  // One undo history for the page: favourites and product filters both record steps
  // ({ undo(), redo() }), so Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) always reverses the
  // latest action. Only a removal shows a toast, with an Undo button for touch screens;
  // undo and redo themselves show nothing.
  const history = { undo: [], redo: [] };
  function recordStep(step) {
    history.undo.push(step);
    history.redo = [];
  }
  function undoStep(redo) {
    const step = (redo ? history.redo : history.undo).pop();
    if (!step) return;
    // The removal toast's Undo has been used (or overtaken), so close it.
    hideToast();
    (redo ? history.undo : history.redo).push(step);
    if (redo) step.redo();
    else step.undo();
  }
  function setFavourite(product, on, index = 0) {
    const rest = favourites.filter((p) => p.url !== product.url);
    if (on) rest.splice(Math.min(index, rest.length), 0, product);
    saveFavourites(rest);
  }
  function toggleFavourite(product, button) {
    const on = !isFavourite(product.url);
    const index = on ? 0 : favourites.findIndex((p) => p.url === product.url);
    setFavourite(product, on);
    recordStep({ undo: () => setFavourite(product, !on, index), redo: () => setFavourite(product, on, index) });
    if (on && button) {
      button.classList.remove('is-pop');
      void button.offsetWidth;
      button.classList.add('is-pop');
    }
    if (!on) showToast(`Removed ${product.name || 'product'} from favourites`, true);
  }
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key !== 'z' && key !== 'y') return;
    // Leave typing fields alone so Ctrl+Z still undoes text there (checkboxes are fine).
    const t = e.target;
    if (t.closest?.('input:not([type="checkbox"]):not([type="radio"]), textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    const redo = key === 'y' || e.shiftKey;
    if (!(redo ? history.redo : history.undo).length) return;
    e.preventDefault();
    undoStep(redo);
  });

  // The toast is a native element in the Global component (.fav-toast_component,
  // hidden until it gets the is-open combo); its filler text is replaced here.
  const favToast = document.querySelector('.fav-toast_component');
  const favToastText = favToast?.querySelector('.fav-toast_text');
  const favToastUndo = favToast?.querySelector('.fav-toast_undo');
  favToastUndo?.addEventListener('click', () => undoStep(false));
  // The x in its top-right corner (.fav-toast_close, role="button") closes it.
  const favToastClose = favToast?.querySelector('.fav-toast_close');
  favToastClose?.addEventListener('click', () => hideToast());
  favToastClose?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    hideToast();
  });
  let toastTimer;
  function hideToast() {
    clearTimeout(toastTimer);
    favToast?.classList.remove('is-open');
  }
  function showToast(text, withUndo) {
    if (!favToast) return;
    if (favToastText) favToastText.textContent = text;
    if (favToastUndo) favToastUndo.style.display = withUndo ? '' : 'none';
    favToast.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3000);
  }

  // One listener for every heart, so hearts on cards Finsweet clones still work.
  let pageProduct = null;
  function makeHeart(url) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'fav-button';
    button.dataset.favUrl = url;
    button.innerHTML = heartSvg;
    paintHeart(button);
    return button;
  }
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.fav-button');
    if (!button) return;
    e.preventDefault();
    e.stopPropagation();
    const card = button.parentElement.querySelector(':scope > .product-card');
    const product = card ? cardProduct(card) : pageProduct;
    if (product?.url) toggleFavourite(product, button);
  });

  // Product cards: the heart sits on the list item, beside (not inside) the card link.
  function cardProduct(card) {
    const img = card.querySelector('.product-card_image');
    return {
      url: card.getAttribute('href') || '',
      name: card.querySelector('.product-card_name')?.textContent.trim() || '',
      brand: card.querySelector('.product-card_brand, [fs-list-field="brandname"], .product-recent_brand')?.textContent.trim() || '',
      sku: card.querySelector('.product-card_sku, [fs-list-field="sku"]')?.textContent.trim() || card.dataset.sku || '',
      image: img ? img.currentSrc || img.src : '',
    };
  }
  const addFavouriteButtons = (root = document) => {
    root.querySelectorAll('.product-card').forEach((card) => {
      const item = card.parentElement;
      // Cards in a list item only (CMS items, or the script's own recently viewed / favourites cards).
      if (!item?.matches('.w-dyn-item, .product_item') || item.querySelector(':scope > .fav-button')) return;
      const url = card.getAttribute('href') || '';
      if (!url.startsWith('/product/')) return;
      item.appendChild(makeHeart(url));
    });
  };

  function paintHeart(button) {
    const on = isFavourite(button.dataset.favUrl);
    button.classList.toggle('is-active', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
  }

  // Nav heart with a count, opening the favourites panel: a Webflow element in the Nav
  // component (.nav_icon-link.is-fav[data-fav-toggle] > .nav_fav-icon > heart + .fav-count).
  let navFav = document.querySelector('[data-fav-toggle]');
  navFav?.addEventListener('click', () => openPanel());
  // Other "View favourites" triggers built in Webflow (role="button" with data-fav-open),
  // e.g. in the product page's Recently viewed row, open the same panel.
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-fav-open]')) openPanel();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('[data-fav-open]')) {
      e.preventDefault();
      openPanel();
    }
  });

  // -------------------------------------------------------
  // FAVOURITES DOWNLOADS (panel and /favourites page)
  // -------------------------------------------------------

  // Downloads: each favourite's product page is read for its details (spec table,
  // short summary, main image), then written as PDF, Excel, CSV or text. The Excel
  // and PDF libraries load only when first used.
  // The Download menus are Webflow elements (the favourites panel and the
  // /favourites page): .fav-download holds a role="button" toggle and a hidden
  // .fav-download_menu of role="button" options carrying data-export="pdf|xlsx|csv|txt".
  function initDownloadMenu(download) {
    const toggle = download.querySelector('.fav-download_toggle');
    const menu = download.querySelector('.fav-download_menu');
    const label = download.querySelector('.fav-download_label');
    const chevron = download.querySelector('.fav-download_chevron');
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-haspopup', 'true');
    let open = false;
    const setOpen = (on) => {
      open = on;
      menu.style.display = on ? 'flex' : '';
      toggle.setAttribute('aria-expanded', String(on));
      if (chevron) chevron.style.transform = on ? 'rotate(180deg)' : '';
    };
    setOpen(false);
    toggle.addEventListener('click', () => setOpen(!open));
    document.addEventListener('click', (e) => {
      if (open && !download.contains(e.target)) setOpen(false);
    });
    download.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) {
        e.stopPropagation();
        setOpen(false);
        toggle.focus();
      }
    });
    download.querySelectorAll('[data-export]').forEach((option) =>
      option.addEventListener('click', async () => {
        if (!EXPORTERS[option.dataset.export] || toggle.getAttribute('aria-busy')) return;
        setOpen(false);
        const text = label?.textContent;
        if (label) label.textContent = 'Preparing…';
        toggle.setAttribute('aria-busy', 'true');
        try {
          const items = await favouriteDetails();
          await EXPORTERS[option.dataset.export](items);
        } catch (error) {
          showToast('Sorry, the download failed. Please try again.', false);
        }
        if (label) label.textContent = text;
        toggle.removeAttribute('aria-busy');
      })
    );
  }

  const detailCache = new Map();
  async function productDetails(p) {
    if (detailCache.has(p.url)) return detailCache.get(p.url);
    const item = { ...p, specs: [], summary: '', link: location.origin + p.url };
    try {
      const html = await (await fetch(p.url)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('.product-spec_row').forEach((row) => {
        const label = row.querySelector('.product-spec_label')?.textContent.trim();
        const value = row.querySelector('.product-spec_value')?.textContent.trim();
        if (label && value) item.specs.push([label, value]);
      });
      item.summary = doc.querySelector('.product-hero_summary')?.textContent.trim() || '';
      item.name = doc.querySelector('.product-hero_name')?.textContent.trim() || item.name;
      item.brand = doc.querySelector('.product-hero_brand')?.textContent.trim() || item.brand;
      item.image = doc.querySelector('.product-hero_image')?.getAttribute('src') || item.image;
      const sku = item.specs.find(([label]) => label === 'SKU');
      if (sku) item.sku = sku[1];
    } catch (error) {
      // Offline or blocked: export what was saved with the heart.
    }
    detailCache.set(p.url, item);
    return item;
  }
  async function favouriteDetails() {
    const list = [...favourites];
    const out = new Array(list.length);
    let next = 0;
    const worker = async () => {
      while (next < list.length) {
        const i = next++;
        out[i] = await productDetails(list[i]);
      }
    };
    await Promise.all(Array.from({ length: Math.min(6, list.length) }, worker));
    return out;
  }

  // Spec columns in a stable order: the usual ones first, then anything else found.
  function specColumns(items) {
    const order = ['SKU', 'Barcode (EAN)', 'Supplier code', 'Brand'];
    items.forEach((it) => it.specs.forEach(([label]) => !order.includes(label) && order.push(label)));
    return order.filter((label) => label !== 'Brand');
  }
  const specOf = (it, label) => it.specs.find(([l]) => l === label)?.[1] || (label === 'SKU' ? it.sku : '') || '';
  const today = new Date().toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
  const fileBase = `chanelle-pet-favourites-${new Date().toISOString().slice(0, 10)}`;
  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function tableRows(items) {
    const cols = specColumns(items);
    return [
      ['Product', 'Brand', ...cols, 'Summary', 'Link'],
      ...items.map((it) => [it.name, it.brand, ...cols.map((c) => specOf(it, c)), it.summary, it.link]),
    ];
  }
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });

  const EXPORTERS = {
    txt(items) {
      const lines = [`Chanelle Pet: your favourites (${today})`, `${items.length} product${items.length === 1 ? '' : 's'}`, ''];
      items.forEach((it, i) => {
        lines.push(`${i + 1}. ${it.name}`);
        if (it.brand) lines.push(`   Brand: ${it.brand}`);
        specColumns([it]).forEach((c) => specOf(it, c) && lines.push(`   ${c}: ${specOf(it, c)}`));
        if (it.summary) lines.push(`   ${it.summary}`);
        lines.push(`   ${it.link}`, '');
      });
      saveBlob(new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }), `${fileBase}.txt`);
    },
    csv(items) {
      const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      // Byte-order mark so Excel opens it with the right characters.
      const csv = '﻿' + tableRows(items).map((r) => r.map(cell).join(',')).join('\r\n');
      saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${fileBase}.csv`);
    },
    async xlsx(items) {
      if (!window.XLSX) await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      const rows = tableRows(items);
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet['!cols'] = rows[0].map((h) => ({ wch: h === 'Product' || h === 'Summary' ? 48 : h === 'Link' ? 40 : 18 }));
      // Links clickable in Excel.
      const linkCol = rows[0].length - 1;
      items.forEach((it, i) => {
        const ref = XLSX.utils.encode_cell({ r: i + 1, c: linkCol });
        if (sheet[ref]) sheet[ref].l = { Target: it.link };
      });
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Favourites');
      XLSX.writeFile(book, `${fileBase}.xlsx`);
    },
    async pdf(items) {
      if (!window.jspdf) await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
      const [logo, ...images] = await Promise.all([
        imageData(document.querySelector('.nav_logo-img')?.src, 600, 'image/png'),
        ...items.map((it) => imageData(it.image, 360, 'image/jpeg')),
      ]);
      buildPdf(items, logo, images).save(`${fileBase}.pdf`);
    },
  };

  // Draws an image into a canvas (white behind transparency) and returns a data URL
  // plus its size, or null if it can't be loaded.
  function imageData(src, max, type) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w0 = img.naturalWidth || max;
        const h0 = img.naturalHeight || max;
        const scale = Math.min(1, max / Math.max(w0, h0)) || 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(w0 * scale);
        canvas.height = Math.round(h0 * scale);
        const ctx = canvas.getContext('2d');
        if (type === 'image/jpeg') {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          resolve({ data: canvas.toDataURL(type, 0.85), w: canvas.width, h: canvas.height });
        } catch (error) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  // A4 list: logo header on every page, one product per row (image left, details
  // right), page numbers in the footer.
  function buildPdf(items, logo, images) {
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;
    const H = 297;
    const M = 16;
    const PINK = [255, 20, 147];
    const NAVY = [15, 23, 42];
    const GREY = [100, 108, 124];
    const LINE = [226, 232, 240];
    const header = () => {
      doc.setFillColor(...PINK);
      doc.rect(0, 0, W, 4, 'F');
      let x = M;
      if (logo) {
        const h = 11;
        const w = (logo.w / logo.h) * h;
        doc.addImage(logo.data, 'PNG', M, 11, w, h);
        x = M + w;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(...PINK);
        doc.text('Chanelle Pet', M, 19);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...NAVY);
      doc.text('Your favourites', W - M, 16, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...GREY);
      doc.text(`${items.length} product${items.length === 1 ? '' : 's'} · ${today}`, W - M, 21.5, { align: 'right' });
      doc.setDrawColor(...PINK);
      doc.setLineWidth(0.6);
      doc.line(M, 27, W - M, 27);
      return x;
    };
    header();
    let y = 33;
    const IMG = 34;
    const textX = M + IMG + 7;
    const textW = W - M - textX;
    items.forEach((it, i) => {
      // Measure the text block so rows never split across pages.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      const nameLines = doc.splitTextToSize(it.name || '', textW).slice(0, 2);
      const specs = specColumns([it])
        .map((c) => [c, specOf(it, c)])
        .filter(([, v]) => v);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const specLines = doc.splitTextToSize(specs.map(([c, v]) => `${c}: ${v}`).join('   ·   '), textW).slice(0, 3);
      const summaryLines = it.summary ? doc.splitTextToSize(it.summary, textW).slice(0, 3) : [];
      const textH = 5 + nameLines.length * 5.2 + 1.5 + specLines.length * 4.3 + (summaryLines.length ? 1.5 + summaryLines.length * 4.1 : 0) + 5.5;
      const rowH = Math.max(IMG, textH) + 8;
      if (y + rowH > H - 18) {
        doc.addPage();
        header();
        y = 33;
      }
      // Image in a light rounded box, contained.
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.roundedRect(M, y, IMG, IMG, 3, 3, 'FD');
      const img = images[i];
      if (img) {
        const pad = 2.5;
        const box = IMG - pad * 2;
        const r = Math.min(box / img.w, box / img.h);
        const w = img.w * r;
        const h = img.h * r;
        doc.addImage(img.data, 'JPEG', M + pad + (box - w) / 2, y + pad + (box - h) / 2, w, h);
      }
      let ty = y + 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...PINK);
      doc.text((it.brand || '').toUpperCase(), textX, ty);
      ty += 5.5;
      doc.setFontSize(12);
      doc.setTextColor(...NAVY);
      doc.text(nameLines, textX, ty);
      ty += nameLines.length * 5.2 + 0.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      doc.text(specLines, textX, ty);
      ty += specLines.length * 4.3;
      if (summaryLines.length) {
        ty += 1.5;
        doc.setTextColor(...GREY);
        doc.text(summaryLines, textX, ty);
        ty += summaryLines.length * 4.1;
      }
      ty += 1.5;
      doc.setFontSize(8.5);
      doc.setTextColor(...PINK);
      doc.textWithLink('View product online', textX, ty, { url: it.link });
      y += rowH;
      if (i < items.length - 1) {
        doc.setDrawColor(...LINE);
        doc.line(M, y - 4, W - M, y - 4);
      }
    });
    const pages = doc.getNumberOfPages();
    for (let n = 1; n <= pages; n++) {
      doc.setPage(n);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GREY);
      doc.text(`Chanelle Pet · ${location.host}`, M, H - 9);
      doc.text(`Page ${n} of ${pages}`, W - M, H - 9, { align: 'right' });
    }
    return doc;
  }

  // The favourites panel is a Webflow element in the global component
  // (.fav-panel_component, display none until opened). Its first .fav-panel_item is
  // the row template; the sample rows are cleared on load and the visitor's own
  // favourites are written in on every open.
  const favPanel = document.querySelector('.fav-panel_component');
  const favDialog = favPanel?.querySelector('.fav-panel_wrapper');
  const favOverlay = favPanel?.querySelector('.fav-panel_overlay');
  const favClose = favPanel?.querySelector('.fav-panel_close');
  const panelList = favPanel?.querySelector('.fav-panel_list');
  const panelTemplate = panelList?.querySelector('.fav-panel_item')?.cloneNode(true);
  const panelDownload = favPanel?.querySelector('.fav-download');
  panelList?.replaceChildren();
  const PANEL_MS = 350;
  const PANEL_EASE = 'cubic-bezier(.4, 0, .2, 1)';
  let panelOpen = false;
  let panelAnims = [];
  if (favPanel) {
    favDialog?.setAttribute('role', 'dialog');
    favDialog?.setAttribute('aria-modal', 'true');
    favDialog?.setAttribute('data-lenis-prevent', '');
    if (favPanel.querySelector('#fav-panel-title')) favDialog?.setAttribute('aria-labelledby', 'fav-panel-title');
    favPanel.querySelectorAll('.fav-panel_close, .fav-panel_overlay').forEach((el) => el.addEventListener('click', () => closePanel()));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panelOpen) closePanel();
    });
    if (panelDownload) initDownloadMenu(panelDownload);
  } else if (navFav) {
    navFav.style.display = 'none';
    navFav = null;
  }

  // Slide the panel in from the right while the overlay fades up to its Webflow opacity.
  function animatePanel(opening) {
    panelAnims.forEach((a) => a.cancel());
    const shade = favOverlay ? getComputedStyle(favOverlay).opacity : 1;
    const out = { transform: 'translateX(100%)' };
    const into = { transform: 'none' };
    const options = { duration: PANEL_MS, easing: PANEL_EASE, fill: 'forwards' };
    panelAnims = [
      favDialog?.animate(opening ? [out, into] : [into, out], options),
      favOverlay?.animate(opening ? [{ opacity: 0 }, { opacity: shade }] : [{ opacity: shade }, { opacity: 0 }], options),
    ].filter(Boolean);
    return panelAnims[0];
  }
  function openPanel() {
    if (!favPanel) return;
    renderPanel();
    panelOpen = true;
    favPanel.style.display = 'block';
    animatePanel(true);
    navFav?.setAttribute('aria-expanded', 'true');
    favClose?.focus();
  }
  function closePanel() {
    if (!panelOpen) return;
    panelOpen = false;
    const anim = animatePanel(false);
    const hide = () => {
      if (panelOpen) return;
      favPanel.style.display = '';
      panelAnims.forEach((a) => a.cancel());
    };
    if (anim) anim.onfinish = hide;
    else hide();
    navFav?.setAttribute('aria-expanded', 'false');
    navFav?.focus();
  }

  function renderPanel() {
    if (!panelList || !panelTemplate) return;
    panelList.replaceChildren(
      ...favourites.map((p) => {
        const item = panelTemplate.cloneNode(true);
        const link = item.querySelector('.fav-panel_link');
        if (link) link.href = p.url;
        const img = item.querySelector('.fav-panel_image');
        if (img && p.image) {
          img.removeAttribute('srcset');
          img.removeAttribute('sizes');
          img.src = p.image;
          img.alt = '';
          img.loading = 'lazy';
        } else img?.remove();
        // Top line matches the product cards: brand · code (product-card_meta classes);
        // the name wraps onto two lines (text-style-2lines).
        const brand = item.querySelector('.product-card_brand, .fav-panel_brand');
        if (brand) brand.textContent = p.brand || '';
        const sku = item.querySelector('.product-card_sku');
        if (sku) sku.textContent = p.sku || '';
        item.querySelectorAll('.product-card_sku, .product-card_dot').forEach((el) => (el.style.display = p.sku ? '' : 'none'));
        const name = item.querySelector('.fav-panel_name');
        if (name) name.textContent = p.name;
        const remove = item.querySelector('.fav-panel_remove');
        if (remove) {
          remove.setAttribute('aria-label', `Remove ${p.name} from favourites`);
          remove.addEventListener('click', () => {
            toggleFavourite(p);
            favClose?.focus();
          });
        }
        return item;
      })
    );
    const n = favourites.length;
    panelList.style.display = n ? '' : 'none';
    const empty = favPanel.querySelector('.fav-panel_empty');
    if (empty) empty.style.display = n ? 'none' : '';
    if (panelDownload) panelDownload.style.display = n ? '' : 'none';
  }

  // Repaint every heart, the nav count and (if open) the panel.
  function syncFavourites() {
    document.querySelectorAll('.fav-button').forEach(paintHeart);
    if (navFav) {
      const n = favourites.length;
      const count = navFav.querySelector('.fav-count');
      count.textContent = n ? (n > 99 ? '99+' : String(n)) : '';
      count.classList.toggle('is-long', n > 9);
      navFav.classList.toggle('is-active', n > 0);
      navFav.setAttribute('aria-label', n ? `Favourites (${n})` : 'Favourites');
    }
    if (panelOpen) renderPanel();
    onFavouritesChange?.();
  }
  // Another tab changed the list.
  window.addEventListener('storage', (e) => {
    if (e.key !== FAV_KEY) return;
    favourites = readFavourites();
    syncFavourites();
  });

  fixItemLinks();
  addOfferBadges();
  addFavouriteButtons();
  syncFavourites();
  // Lenis smooth scroll (site footer code, a global `lenis`) measures the page once;
  // after Load more or filtering the page grows, so ask it to re-measure or it
  // stops scrolling at the old bottom.
  let resizeQueued = false;
  const resizeLenis = () => {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      try {
        if (typeof lenis !== 'undefined' && lenis && typeof lenis.resize === 'function') lenis.resize();
      } catch (error) {
        // No Lenis on this page: nothing to do.
      }
    });
  };

  // Finsweet load-more renders new items later; fix those as they appear.
  new MutationObserver(() => {
    fixItemLinks();
    addOfferBadges();
    addFavouriteButtons();
    resizeLenis();
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', resizeLenis);

  const SEARCH_FIELD = 'name, brandname, sku';
  const RECENT_KEY = 'chanellePetRecentlyViewed';
  // Up to 24 products are remembered; sliders hold the latest 12.
  const RECENT_MAX = 24;
  const RECENT_STRIP = 12;

  // -------------------------------------------------------
  // PRODUCT FILTERS (Finsweet Attributes v2 List)
  // -------------------------------------------------------

  // The Pet, Category and Brand dropdowns (Div Blocks) get their Finsweet fields
  // here, keyed by their toggle text: the Webflow API could not write them.
  function addDropdownFields() {
    const DROPDOWN_FIELDS = {
      pet: { 'fs-list-field': 'pet', 'fs-list-operator': 'contain', 'fs-list-tagvalues': 'separate' },
      category: { 'fs-list-field': 'category', 'fs-list-operator': 'contain', 'fs-list-tagvalues': 'separate' },
      brand: { 'fs-list-field': 'brand', 'fs-list-tagvalues': 'separate' },
    };
    document.querySelectorAll('div.filters_dropdown:not([fs-list-field])').forEach((dropdown) => {
      const key = dropdown.querySelector('.filters_dropdown-toggle')?.textContent.trim().toLowerCase();
      Object.entries(DROPDOWN_FIELDS[key] || {}).forEach(([name, value]) => dropdown.setAttribute(name, value));
    });
  }

  // Attributes the Webflow API could not write on these elements.
  function addFilterAttributes() {
    const set = (selector, attrs) =>
      document.querySelectorAll(selector).forEach((el) => {
        Object.entries(attrs).forEach(([name, value]) => {
          if (!el.hasAttribute(name)) el.setAttribute(name, value);
        });
      });

    set('.filters_form form, form.filters_form', { 'fs-list-element': 'filters' });
    // Fuzzy search: Finsweet only applies fs-list-fuzzy to the "equal" operator.
    set('.filters_search-input', {
      'fs-list-field': SEARCH_FIELD,
      'fs-list-operator': 'equal',
      'fs-list-fuzzy': '35',
      'fs-list-debounce': '200',
      'fs-list-tagfield': 'Search',
    });
    set('.filters_tag', { 'fs-list-element': 'tag' });
    set('.filters_tag > span', { 'fs-list-element': 'tag-value' });

    // Pet and category checkboxes: the item fields hold "|slug|slug|", so each box
    // filters on "|slug|" and its tag shows the label. The slug comes from the
    // option's CMS item (data-slug on its name), or from the label text.
    const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.querySelectorAll('.filters_dropdown[fs-list-field="pet"], .filters_dropdown[fs-list-field="category"]').forEach((dropdown) => {
      dropdown.querySelectorAll('.filters_checkbox').forEach((label) => {
        const input = label.querySelector('input');
        const name = label.textContent.trim();
        if (!input || !name) return;
        const slug = label.querySelector('[data-slug]')?.dataset.slug || slugify(name);
        input.setAttribute('fs-list-value', `|${slug}|`);
        input.setAttribute('fs-list-tagvalue', name);
      });
    });

    // Brand checkboxes come from a Brands collection list; their value is the brand name.
    document.querySelectorAll('.filters_dropdown-list.is-brands .filters_checkbox').forEach((label) => {
      const input = label.querySelector('input');
      const name = label.textContent.trim();
      if (!input || !name) return;
      input.setAttribute('fs-list-value', name);
      input.setAttribute('fs-list-tagvalue', name);
    });
  }

  // Friendly URLs from the homepage and footer (?pet=dog&category=food&featured=true&search=kong)
  // are rewritten into the Finsweet query format before the List solution reads them.
  function rewriteFilterParams() {
    const params = new URLSearchParams(location.search);
    const map = {
      pet: (v) => ['pet_contain', JSON.stringify(v.split(',').map((s) => `|${s}|`))],
      category: (v) => ['category_contain', JSON.stringify(v.split(',').map((s) => `|${s}|`))],
      brand: (v) => ['brand_equal', JSON.stringify(v.split(',').map(brandName))],
      offer: (v) => (v === 'true' ? ['offer_equal', 'true'] : null),
      search: (v) => [`${SEARCH_FIELD}_equal`, v],
    };
    let changed = false;
    Object.entries(map).forEach(([key, toFinsweet]) => {
      const value = params.get(key);
      if (value === null) return;
      params.delete(key);
      changed = true;
      const pair = value ? toFinsweet(value.toLowerCase()) : null;
      if (pair) params.set(pair[0], pair[1]);
    });
    if (!changed) return;
    const query = params.toString();
    // window.history: `history` in this file is the page's undo history.
    window.history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
  }

  // ?brand= takes a slug; the filter matches on the brand name shown in the dropdown.
  function brandName(slug) {
    const labels = document.querySelectorAll('.filters_dropdown-list.is-brands .filters_checkbox');
    const clean = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    for (const label of labels) {
      const name = label.textContent.trim();
      if (clean(name) === slug) return name;
    }
    return slug;
  }

  // The builder nested each checkbox in a second label and left the row label's for=""
  // empty, so only the box itself was clickable and Webflow's default checkbox offsets
  // pushed it out of line with the text. Flatten each row to <label><input><span>.
  function flattenCheckboxes() {
    document.querySelectorAll('.filters_checkbox, .filters_toggle').forEach((row) => {
      const inner = row.querySelector('label.filters_checkbox-input, label.filters_toggle-input');
      const input = row.querySelector('input[type="checkbox"]');
      if (!inner || !input) return;
      row.removeAttribute('for');
      input.removeAttribute('id');
      input.className = inner.classList.contains('filters_toggle-input') ? 'filters_toggle-input' : 'filters_checkbox-input';
      inner.replaceWith(input);
    });
  }

  // The Category dropdown was built with only some categories; add the rest (in
  // alphabetical order) so every product can be found by its category.
  const ALL_CATEGORIES = [
    'Aquatic', 'Bedding', 'Beds', 'Bowls & Feeders', 'Cages & Carriers', 'Car Accessories', 'Care & Hygiene',
    'Cat Flaps', 'Cat Litter', 'Coats', 'Collars & Leads', 'Food', 'Footwear & Training Aids', 'Grooming',
    'Harness', 'Healthcare', 'Home Care', 'Hygiene', 'Kennels & Runs', 'Poop Bags', 'POS', 'Scratchers',
    'Shampoo', 'Small Animal Accessories', 'Tie-Out Stakes & Cables', 'Toys', 'Training & Behaviour',
    'Travel Accessories', 'Travel Bowls', 'Treats', 'Wild Bird', 'Worming & Flea',
  ];
  function addMissingCategories() {
    const list = document.querySelector('.filters_dropdown[fs-list-field="category"] .filters_dropdown-list');
    const rows = () => [...(list?.querySelectorAll('.filters_checkbox') || [])];
    const template = rows()[0];
    // A CMS list already holds every category.
    if (!template || list.querySelector('.w-dyn-list')) return;
    const key = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
    const have = new Set(rows().map((row) => key(row.textContent.trim())));
    ALL_CATEGORIES.forEach((name) => {
      if (have.has(key(name))) return;
      const row = template.cloneNode(true);
      const input = row.querySelector('input');
      if (input) input.checked = false;
      const text = row.querySelector('span');
      if (!text) return;
      text.textContent = name;
      const before = rows().find((r) => r.textContent.trim().localeCompare(name) > 0);
      list.insertBefore(row, before || null);
    });
  }

  if (document.querySelector('[fs-list-element="list"]')) {
    addDropdownFields();
    flattenCheckboxes();
    addMissingCategories();
    addFilterAttributes();
    rewriteFilterParams();
    // Each Pet, Category and Brand option shows how many products it has in total
    // (as if it were the only filter), counted once from every item Finsweet loads.
    // Totals don't change as other filters are ticked.
    window.FinsweetAttributes = window.FinsweetAttributes || [];
    window.FinsweetAttributes.push([
      'list',
      async (lists) => {
        const list = lists && lists[0];
        if (!list) return;
        try {
          await list.loadingPaginatedItems;
        } catch (error) {
          // Counts use whatever loaded.
        }
        const items = (list.items && (list.items.value || list.items)) || [];
        const tally = { pet: new Map(), category: new Map(), brand: new Map() };
        items.forEach((item) => {
          Object.keys(tally).forEach((key) => {
            const raw = String(item.fields?.[key]?.value ?? '').toLowerCase();
            const values = key === 'brand' ? [raw.trim()] : raw.split('|').filter(Boolean).map((v) => `|${v}|`);
            values.forEach((v) => v && tally[key].set(v, (tally[key].get(v) || 0) + 1));
          });
        });
        document.querySelectorAll('.filters_dropdown[fs-list-field]').forEach((dropdown) => {
          const counts = tally[dropdown.getAttribute('fs-list-field')];
          if (!counts) return;
          dropdown.querySelectorAll('.filters_checkbox').forEach((row) => {
            const value = (row.querySelector('input')?.getAttribute('fs-list-value') || '').toLowerCase().trim();
            if (!value) return;
            let badge = row.querySelector('.filters_checkbox-count');
            if (!badge) {
              badge = document.createElement('span');
              badge.className = 'filters_checkbox-count';
              badge.style.cssText = 'margin-left:auto;padding-left:.75rem;font-size:.8125rem;color:var(--colors--dark-gray-50);font-variant-numeric:tabular-nums;';
              row.appendChild(badge);
            }
            badge.textContent = (counts.get(value) || 0).toLocaleString('en-IE');
          });
        });
        // Filters restored from the URL (a reload, or a ?pet=dog link) are ticked by
        // now: light up the counts, Clear all and chips straight away.
        setTimeout(() => document.dispatchEvent(new Event('cp:filters-ready')), 0);
      },
    ]);

    // Under "Load more": "Showing 24 of 850 products", copied from the filter bar's
    // live Finsweet counts, and the button says how many the next click adds.
    const pager = document.querySelector('.pagination_component');
    const visibleEl = document.querySelector('.filters_count [fs-list-element="visible-count"]');
    const resultsEl = document.querySelector('.filters_count [fs-list-element="results-count"]');
    if (pager && visibleEl && resultsEl) {
      const pageSize = document.querySelectorAll('[fs-list-element="list"] > .w-dyn-item').length || 24;
      const line = document.createElement('div');
      line.className = 'pagination_count';
      line.style.cssText = 'margin-top:.875rem;text-align:center;font-size:.875rem;color:var(--colors--dark-gray-70);';
      pager.after(line);
      const num = (el) => Number(el.textContent.replace(/[^0-9]/g, '')) || 0;
      const sync = () => {
        const shown = num(visibleEl);
        const total = num(resultsEl);
        line.textContent = total ? `Showing ${shown.toLocaleString('en-IE')} of ${total.toLocaleString('en-IE')} products` : '';
        const label = pager.querySelector('.w-pagination-next > div');
        const left = total - shown;
        if (label && left > 0) label.textContent = `Load ${Math.min(pageSize, left)} more`;
      };
      [visibleEl, resultsEl].forEach((el) => new MutationObserver(sync).observe(el, { childList: true, characterData: true, subtree: true }));
      sync();
    }

    // Sort: the native dropdown (.filters_dropdown[data-sort-dropdown]) drives the
    // hidden Finsweet select. Featured is the default unless the URL asks for a sort.
    const sortSelect = document.querySelector('.filters_sort-select');
    const sortDropdown = document.querySelector('[data-sort-dropdown]');
    if (sortSelect) {
      const sortOptions = sortDropdown ? [...sortDropdown.querySelectorAll('[data-sort]')] : [];
      const sortLabel = sortDropdown?.querySelector('[data-sort-label]');
      const paintSort = () => {
        const value = sortSelect.value || 'rank-desc';
        sortOptions.forEach((option) => {
          const on = option.dataset.sort === value;
          option.classList.toggle('is-active', on);
          option.setAttribute('aria-selected', String(on));
          if (on && sortLabel) sortLabel.textContent = option.textContent.trim();
        });
      };
      // Keyboard picks hand focus back to the toggle; mouse picks just close.
      const pickSort = (option, byKeyboard) => {
        sortSelect.value = option.dataset.sort;
        sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
        paintSort();
        if (byKeyboard) closeDropdown(sortDropdown);
        else {
          sortDropdown.open = false;
          document.activeElement?.blur();
        }
      };
      sortOptions.forEach((option) => {
        option.addEventListener('click', (e) => pickSort(option, e.detail === 0));
        option.addEventListener('keydown', (e) => {
          const i = sortOptions.indexOf(option);
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pickSort(option, true);
          } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            sortOptions[(i + (e.key === 'ArrowDown' ? 1 : -1) + sortOptions.length) % sortOptions.length].focus();
          } else if (e.key === 'Escape') {
            closeDropdown(sortDropdown);
          }
        });
      });
      sortDropdown?.addEventListener('toggle', () => {
        if (sortDropdown.open && canHover) (sortOptions.find((o) => o.classList.contains('is-active')) || sortOptions[0])?.focus({ preventScroll: true });
      });
      // Finsweet keeps the sort in the URL (e.g. ?…_sort=name-asc); restore it.
      const urlSort = [...new URLSearchParams(location.search)].find(([key]) => /sort/i.test(key))?.[1];
      if (urlSort && sortOptions.some((option) => option.dataset.sort === urlSort)) {
        sortSelect.value = urlSort;
      } else {
        sortSelect.value = 'rank-desc';
        window.addEventListener('load', () => sortSelect.dispatchEvent(new Event('change', { bubbles: true })));
      }
      paintSort();
      // Finsweet may set the select itself as it restores the URL.
      sortSelect.addEventListener('change', paintSort);
      window.addEventListener('load', () => setTimeout(paintSort, 600));
    }
  }

  // -------------------------------------------------------
  // BRAND LOGO MARQUEE
  // -------------------------------------------------------

  // Brand logo lists become two rows scrolling in opposite directions inside the
  // container (edges faded via CSS mask). Each row's logos are duplicated once and
  // the row slides by exactly one set.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cloneInto = (list, items) =>
    items.forEach((item) => {
      const copy = item.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
      list.appendChild(copy);
    });
  const runMarquee = (list, reverse) => {
    const start = () => {
      // Short rows are repeated until one set fills the container, then the whole
      // set is duplicated once so the loop is seamless.
      const base = [...list.children];
      const width = list.parentElement.clientWidth;
      for (let i = 0; i < 6 && list.scrollWidth < width; i++) cloneInto(list, base);
      cloneInto(list, [...list.children]);
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const distance = (list.scrollWidth + gap) / 2;
      const frames = [{ transform: 'translateX(0)' }, { transform: `translateX(-${distance}px)` }];
      const animation = list.animate(reverse ? frames.reverse() : frames, {
        duration: (distance / 40) * 1000, // 40px per second
        iterations: Infinity,
      });
      list.addEventListener('mouseenter', () => animation.pause());
      list.addEventListener('mouseleave', () => animation.play());
    };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  };
  document.querySelectorAll('.brand_list').forEach((list) => {
    if (reduceMotion || list.dataset.marquee || list.children.length < 2) return;
    list.dataset.marquee = 'on';
    const items = [...list.children];
    const second = document.createElement('div');
    second.className = 'brand_list';
    second.dataset.marquee = 'on';
    second.setAttribute('role', 'list');
    items.slice(Math.ceil(items.length / 2)).forEach((item) => second.appendChild(item));
    list.after(second);
    runMarquee(list, false);
    runMarquee(second, true);
  });

  // -------------------------------------------------------
  // SUPPLIERS: A–Z BRAND SEARCH
  // -------------------------------------------------------

  // Smaller arrows on the A–Z brand cards (the embed SVG otherwise fills its circle).
  document.querySelectorAll('.supplier-card .cat_pill-arrow svg').forEach((svg) => {
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.style.width = '1rem';
    svg.style.height = '1rem';
  });

  // Long brand names are cut off with an ellipsis; on hover they scroll slowly
  // left to show the full name, then slide back.
  document.querySelectorAll('.supplier-card_name').forEach((name) => {
    const card = name.closest('.supplier-card');
    if (card) ellipsisScroll(name, card);
  });

  // "1 products" -> "1 product" on brand counts.
  document.querySelectorAll('.supplier-card_count, .supplier-tile_count').forEach((count) => {
    const [n, word] = count.children;
    if (n && word && n.textContent.trim() === '1') word.textContent = 'product';
  });

  // Brand filter bar: search, pet pills and a Category dropdown. Each card carries
  // hidden "|dog|cat|" and "|food|toys|" values (Brands > Filter Pets / Filter
  // Categories). A brand shows if it matches any ticked pet and any ticked category.
  const supplierList = document.querySelector('.supplier_list');
  const supplierHeading = supplierList?.closest('.container-large')?.querySelector('.heading_row');
  if (supplierList && supplierHeading) {
    const items = [...supplierList.querySelectorAll('.supplier_item')];
    const valuesOf = (item, key) =>
      (item.querySelector(`[data-brand-field="${key}"]`)?.textContent || '').split('|').filter(Boolean);
    const labelOf = (slug) =>
      slug === 'pos' ? 'POS' : slug.replace(/-and-/g, ' & ').replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    const PETS = [['dog', 'Dog'], ['cat', 'Cat'], ['small-animal', 'Small animal'], ['bird', 'Bird'], ['fish', 'Fish']];
    const categories = [...new Set(items.flatMap((item) => valuesOf(item, 'categories')))].sort();
    const chosenPets = new Set();

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:0.5rem;margin-bottom:1.5rem;';

    // Search with a reset button on the right.
    const box = document.createElement('div');
    box.className = 'filters_search';
    Object.assign(box.style, {
      flex: '1 1 16rem',
      maxWidth: '24rem',
      backgroundColor: 'var(--colors--white)',
      border: '1px solid var(--colors--dark-gray-15)',
    });
    box.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'filters_search-input';
    input.placeholder = 'Search brands';
    input.setAttribute('aria-label', 'Search brands');
    const clearSearch = document.createElement('button');
    clearSearch.type = 'button';
    clearSearch.className = 'filters_dropdown-clear';
    clearSearch.innerHTML = '&#x2715;&nbsp;Reset';
    clearSearch.style.cssText = 'height:2rem;display:none;';
    box.append(input, clearSearch);
    bar.appendChild(box);

    // Pet pills.
    PETS.forEach(([slug, name]) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'filters_dropdown-toggle';
      pill.textContent = name;
      pill.addEventListener('click', () => {
        if (chosenPets.has(slug)) chosenPets.delete(slug);
        else chosenPets.add(slug);
        pill.classList.toggle('is-active', chosenPets.has(slug));
        apply();
      });
      bar.appendChild(pill);
    });

    // Category dropdown (same markup as the Products filters, so it gets the
    // search, Clear, count badge and keyboard behaviour).
    const dropdown = document.createElement('div');
    dropdown.className = 'filters_dropdown';
    dropdown.innerHTML =
      '<div class="filters_dropdown-toggle" role="button" tabindex="0"><div>Category</div><div class="icon_svg" style="width:1rem;height:1rem"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div></div>' +
      `<div class="filters_dropdown-list">${categories
        .map((c) => `<label class="filters_checkbox"><input type="checkbox" class="filters_checkbox-input" value="${c}"><span>${labelOf(c)}</span></label>`)
        .join('')}</div>`;
    bar.appendChild(dropdown);

    const count = document.createElement('div');
    count.className = 'filters_count';
    count.style.marginLeft = 'auto';
    bar.appendChild(count);

    supplierHeading.after(bar);
    addDropdownSearch(dropdown);
    dropdown.querySelector('.filters_dropdown-list')?.setAttribute('data-lenis-prevent', '');

    // "No brands match" message: built in Webflow under the list
    // (.products_empty.is-brands[data-brands-empty], hidden until shown here).
    const empty = document.querySelector('[data-brands-empty]') || document.createElement('div');
    const showEmpty = (on) => (empty.style.display = on ? 'block' : 'none');

    function apply() {
      const term = input.value.trim().toLowerCase();
      const cats = [...dropdown.querySelectorAll('input[type="checkbox"]:checked')].map((i) => i.value);
      let shown = 0;
      items.forEach((item) => {
        const pets = valuesOf(item, 'pets');
        const itemCats = valuesOf(item, 'categories');
        const match =
          (!term || item.querySelector('.supplier-card_name')?.textContent.toLowerCase().includes(term)) &&
          (!chosenPets.size || pets.some((p) => chosenPets.has(p))) &&
          (!cats.length || itemCats.some((c) => cats.includes(c)));
        item.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      showEmpty(!shown);
      count.textContent = `Showing ${shown} of ${items.length} brands`;
      clearSearch.style.display = term ? '' : 'none';
      // Count badge / active state on the Category toggle.
      const dropdownToggle = dropdown.querySelector('.filters_dropdown-toggle');
      dropdownToggle.classList.toggle('is-active', cats.length > 0);
      setClearEnabled(dropdown.querySelector('.filters_dropdown-clear'), cats.length > 0);
    }
    input.addEventListener('input', apply);
    dropdown.addEventListener('change', apply);
    dropdown.querySelector('.filters_dropdown-clear')?.addEventListener('click', () => setTimeout(apply, 0));
    clearSearch.addEventListener('click', () => {
      input.value = '';
      apply();
      input.focus();
    });
    apply();
  }

  // -------------------------------------------------------
  // ON-PAGE BUTTONS AND ACCORDIONS
  // -------------------------------------------------------

  // Divs with role="button" (accordion toggles, panel close, download options…)
  // answer Enter and Space like a real button.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target.closest?.('div[role="button"]');
    if (!el || el !== e.target) return;
    e.preventDefault();
    el.click();
  });

  // Accordions are Div Blocks: .accordion_item > .accordion_toggle (role="button")
  // + .accordion_content. The open/close animation is the native Webflow interaction
  // "Accordion [TOGGLE]"; this only keeps aria-expanded in step for screen readers.
  document.querySelectorAll('.accordion_toggle').forEach((toggle, i) => {
    const content = toggle.parentElement?.querySelector(':scope > .accordion_content');
    if (!content) return;
    content.id ||= `accordion-content-${i + 1}`;
    toggle.setAttribute('aria-controls', content.id);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
    });
  });

  // -------------------------------------------------------
  // FORMS
  // -------------------------------------------------------

  // Form labels: the builder left for="" and repeated ids (id="field"), so labels
  // weren't tied to their inputs. Give each field a unique id and point its label at it.
  const usedIds = new Set();
  document.querySelectorAll('form input:not([type="hidden"]):not([type="submit"]), form textarea, form select').forEach((field, i) => {
    let id = field.id;
    if (!id || usedIds.has(id) || document.querySelectorAll(`[id="${CSS.escape(id)}"]`).length > 1) {
      id = `${(field.name || 'field').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
      field.id = id;
    }
    usedIds.add(id);
    const wrapper = field.closest('.form_field-wrapper, .w-checkbox, label');
    const label = wrapper?.matches('label') ? wrapper : wrapper?.querySelector('label');
    if (label && !label.contains(field)) label.htmlFor = id;
  });

  // Selects show their "Select …" prompt in grey; once a real option is picked they
  // get the is-filled combo (Colors/dark-gray in Webflow).
  document.querySelectorAll('select.form_input').forEach((select) => {
    const sync = () => select.classList.toggle('is-filled', select.value !== '');
    select.addEventListener('change', sync);
    select.form?.addEventListener('reset', () => setTimeout(sync, 0));
    sync();
  });

  // Privacy checkbox (Webflow checkbox: .form_checkbox-field > input.form_checkbox-input
  // + text): the is-checked combo draws the pink ticked box.
  document.querySelectorAll('.form_checkbox-field input[type="checkbox"]').forEach((input) => {
    const sync = () => input.classList.toggle('is-checked', input.checked);
    input.addEventListener('change', sync);
    input.form?.addEventListener('reset', () => setTimeout(sync, 0));
    sync();
  });

  // Filter dropdowns (Products, and the Suppliers one built above) are Div Blocks:
  // .filters_dropdown > .filters_dropdown-toggle (role="button") +
  // .filters_dropdown-list, which is display none in Webflow until opened. Each gets
  // a <details>-style `open` property and `toggle` event for the code below.
  // Pet, Category and Brand are Webflow Dropdown elements (.w-dropdown): Webflow opens
  // and closes them; they get the same `open` property and `toggle` event, read from
  // its w--open class (closing goes through Webflow's own w-close event).
  document.querySelectorAll('.filters_dropdown.w-dropdown').forEach((dropdown) => {
    const toggle = dropdown.querySelector('.w-dropdown-toggle');
    const icon = toggle?.querySelector('.icon_svg');
    if (!toggle) return;
    const isOpen = () => toggle.classList.contains('w--open');
    Object.defineProperty(dropdown, 'open', {
      get: isOpen,
      set: (on) => {
        if (Boolean(on) === isOpen()) return;
        if (on) toggle.click();
        else if (window.jQuery) window.jQuery(dropdown).triggerHandler('w-close.w-dropdown');
        else toggle.click();
      },
    });
    let was = isOpen();
    new MutationObserver(() => {
      const now = isOpen();
      if (now === was) return;
      was = now;
      if (icon) icon.style.transform = now ? 'rotate(180deg)' : '';
      dropdown.dispatchEvent(new Event('toggle'));
    }).observe(toggle, { attributes: true, attributeFilter: ['class'] });
  });

  document.querySelectorAll('div.filters_dropdown:not(.w-dropdown)').forEach((dropdown) => {
    const toggle = dropdown.querySelector('.filters_dropdown-toggle');
    const list = dropdown.querySelector('.filters_dropdown-list');
    // Sort shows a sort icon, not a chevron, so it doesn't flip when open.
    const icon = toggle?.matches('.is-sort') ? null : toggle?.querySelector('.icon_svg');
    if (!toggle || !list) return;
    let isOpen = false;
    const paint = () => {
      list.style.display = isOpen ? 'flex' : '';
      toggle.setAttribute('aria-expanded', String(isOpen));
      if (icon) icon.style.transform = isOpen ? 'rotate(180deg)' : '';
    };
    Object.defineProperty(dropdown, 'open', {
      get: () => isOpen,
      set: (on) => {
        if (Boolean(on) === isOpen) return;
        isOpen = Boolean(on);
        paint();
        dropdown.dispatchEvent(new Event('toggle'));
      },
    });
    paint();
    toggle.addEventListener('click', () => {
      dropdown.open = !dropdown.open;
    });
  });

  // Keep one filter dropdown open at a time and close them on an outside click.
  const dropdowns = () => document.querySelectorAll('.filters_dropdown');
  document.addEventListener(
    'toggle',
    (e) => {
      const opened = e.target;
      if (!opened.matches || !opened.matches('.filters_dropdown') || !opened.open) return;
      dropdowns().forEach((d) => d !== opened && (d.open = false));
    },
    true,
  );
  document.addEventListener('click', (e) => {
    if (e.target.closest('.filters_dropdown')) return;
    dropdowns().forEach((d) => (d.open = false));
  });

  // An open list that would run past either side of the screen slides back in, so it
  // keeps a 1rem gap from the edge (narrow windows, dropdowns near the right).
  const EDGE_GAP = 16;
  function keepListOnScreen(dropdown) {
    const list = dropdown.querySelector('.filters_dropdown-list');
    if (!list) return;
    list.style.translate = '';
    if (!dropdown.open || getComputedStyle(list).position !== 'absolute') return;
    const box = list.getBoundingClientRect();
    const viewport = document.documentElement.clientWidth;
    let shift = Math.min(0, viewport - EDGE_GAP - box.right);
    if (box.left + shift < EDGE_GAP) shift = EDGE_GAP - box.left;
    if (shift) list.style.translate = `${Math.round(shift)}px 0`;
  }
  document.addEventListener(
    'toggle',
    (e) => {
      if (e.target.matches?.('.filters_dropdown')) requestAnimationFrame(() => keepListOnScreen(e.target));
    },
    true,
  );
  window.addEventListener('resize', () => dropdowns().forEach(keepListOnScreen));

  // Dropdown search and keyboard use. Longer option lists get a search box that is
  // focused as the dropdown opens: typing narrows the options, Enter (or Space once
  // the text no longer continues any option) ticks the top match, Arrow keys or Tab
  // move through the options, Enter/Space tick the focused one, Escape closes.
  // Function declarations (not const arrows) so the Suppliers filter, which runs
  // earlier in this file, can build its dropdown with them.
  const canHover = window.matchMedia('(hover: hover)').matches;
  // The dropdown's search box, unless it is hidden in Webflow.
  function searchIn(el) {
    const search = el.querySelector('.filters_dropdown-search');
    return search && getComputedStyle(search).display !== 'none' ? search : null;
  }
  function rowsOf(dropdown) {
    return [...dropdown.querySelectorAll('.filters_checkbox')];
  }
  function shownRows(dropdown) {
    return rowsOf(dropdown).filter((row) => row.style.display !== 'none');
  }

  function highlightTop(dropdown, on) {
    rowsOf(dropdown).forEach((row) => row.classList.remove('is-active'));
    if (on) shownRows(dropdown)[0]?.classList.add('is-active');
  }

  function filterRows(dropdown, term) {
    const search = term.trim().toLowerCase();
    rowsOf(dropdown).forEach((row) => {
      // Match the option name only, not its count.
      const label = [...row.children].find((c) => c.tagName !== 'INPUT' && !c.classList.contains('filters_checkbox-count'));
      const name = (label || row).textContent.toLowerCase();
      row.style.display = !search || name.includes(search) ? '' : 'none';
    });
    const empty = dropdown.querySelector('.filters_dropdown-empty');
    if (empty) empty.style.display = shownRows(dropdown).length ? 'none' : 'block';
    highlightTop(dropdown, Boolean(search));
  }

  function setClearEnabled(clear, on) {
    if (!clear) return;
    clear.setAttribute('aria-disabled', String(!on));
    clear.tabIndex = on ? 0 : -1;
  }

  function closeDropdown(dropdown) {
    dropdown.open = false;
    dropdown.querySelector('.filters_dropdown-toggle')?.focus();
  }

  // Each dropdown gets a head row: search box (longer lists) plus a "Clear" button
  // that appears once something in that dropdown is ticked and unticks just those.
  // The head row (search box + Clear) is a Webflow element in each dropdown list; the
  // script only builds one for dropdowns without it.
  function wireDropdownClear(dropdown, clear) {
    clear.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.querySelectorAll('input[type="checkbox"]:checked').forEach((input) => input.click());
      updateFilterCount();
    });
  }
  function addDropdownHead(dropdown) {
    const list = dropdown.querySelector('.filters_dropdown-list');
    if (!list) return;
    const native = list.querySelector('.filters_dropdown-head');
    if (native) {
      if (!native.dataset.wired) {
        native.dataset.wired = 'true';
        const clear = native.querySelector('.filters_dropdown-clear');
        if (clear) wireDropdownClear(dropdown, clear);
      }
      return native;
    }
    const head = document.createElement('div');
    head.className = 'filters_dropdown-head';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'filters_dropdown-clear';
    clear.textContent = 'Clear';
    clear.setAttribute('form', 'filters-dropdown-search');
    clear.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown.querySelectorAll('input[type="checkbox"]:checked').forEach((input) => input.click());
      updateFilterCount();
    });
    head.appendChild(clear);
    list.prepend(head);
    return head;
  }

  function addDropdownSearch(dropdown) {
    const head = addDropdownHead(dropdown);
    const list = dropdown.querySelector('.filters_dropdown-list');
    if (!head) return;
    let search = head.querySelector('.filters_dropdown-search');
    if (search?.dataset.wired) return;
    if (!search) {
      // No Webflow search box: longer lists get one built here.
      if (rowsOf(dropdown).length < 7) return;
      const name = dropdown.querySelector('.filters_dropdown-toggle')?.textContent.trim() || 'options';
      search = document.createElement('input');
      search.type = 'search';
      search.className = 'filters_dropdown-search';
      search.placeholder = `Search ${name.toLowerCase()}`;
      search.autocomplete = 'off';
      search.setAttribute('aria-label', `Search ${name}`);
      head.prepend(search);
    }
    search.dataset.wired = 'true';
    // Keep the box out of the filter form: Finsweet reads form.elements and listens on the form.
    search.setAttribute('form', 'filters-dropdown-search');
    search.removeAttribute('name');
    ['input', 'change', 'keydown', 'keyup'].forEach((type) =>
      search.addEventListener(type, (e) => e.stopPropagation()),
    );
    if (!list.querySelector('.filters_dropdown-empty')) {
      const empty = document.createElement('div');
      empty.className = 'filters_dropdown-empty';
      empty.textContent = 'No matches';
      list.append(empty);
    }

    search.addEventListener('input', () => {
      filterRows(dropdown, search.value);
      list.scrollTop = 0;
    });
    search.addEventListener('keydown', (e) => {
      const top = shownRows(dropdown)[0];
      const term = search.value.toLowerCase();
      const spaceTicks = e.key === ' ' && (!term.trim() || !rowsOf(dropdown).some((row) => row.textContent.toLowerCase().includes(`${term} `)));
      if ((e.key === 'Enter' || spaceTicks) && top) {
        e.preventDefault();
        top.querySelector('input')?.click();
        search.select();
      } else if (e.key === 'Enter') {
        e.preventDefault();
      } else if (e.key === 'ArrowDown' && top) {
        e.preventDefault();
        highlightTop(dropdown, false);
        top.querySelector('input')?.focus();
      } else if (e.key === 'Escape') {
        closeDropdown(dropdown);
      }
    });
  }

  document.querySelectorAll('.filters_dropdown:not([data-sort-dropdown])').forEach(addDropdownSearch);
  // Lists without a search box (or with it hidden in Webflow, like Pet) keep the head
  // row with Clear on the right.
  document.querySelectorAll('.filters_dropdown-head').forEach((head) => {
    if (searchIn(head)) return;
    head.style.justifyContent = 'flex-end';
  });
  document.querySelectorAll('.filters_dropdown .filters_dropdown-clear').forEach((clear) =>
    setClearEnabled(clear, Boolean(clear.closest('.filters_dropdown').querySelector('input[type="checkbox"]:checked'))),
  );

  // Lenis smooth scroll swallows wheel events; let the dropdown lists and the
  // mobile drawer scroll natively.
  document.querySelectorAll('.filters_dropdown-list, .filters_bar').forEach((el) => el.setAttribute('data-lenis-prevent', ''));

  document.addEventListener('toggle', (e) => {
    const dropdown = e.target;
    if (!dropdown.matches || !dropdown.matches('.filters_dropdown')) return;
    const search = searchIn(dropdown);
    if (!search) return;
    if (dropdown.open) {
      if (canHover) search.focus();
    } else if (search.value) {
      search.value = '';
      filterRows(dropdown, '');
    }
  }, true);

  // Mouse clicks on options (or Clear) in a list with a search box leave focus in the
  // search, so typing keeps narrowing. Pressing on the list itself (its scrollbar)
  // is left alone. Touch skips this so the on-screen keyboard doesn't pop up.
  const searchOf = (target) => {
    const list = target.closest?.('.filters_dropdown-list');
    const dropdown = list?.closest('.filters_dropdown');
    const search = list && searchIn(list);
    if (!canHover || !search || !dropdown.open || target === list || target === search) return null;
    return search;
  };
  document.addEventListener('mousedown', (e) => {
    if (searchOf(e.target)) e.preventDefault();
  });
  document.addEventListener('click', (e) => {
    // After the click, since ticking a box through its label can move focus to it.
    const search = e.detail && searchOf(e.target);
    if (search) setTimeout(() => search.focus({ preventScroll: true }), 0);
  });

  // Arrow keys, Enter and Escape on the options themselves (Space ticks natively).
  document.addEventListener('keydown', (e) => {
    const input = e.target;
    if (!input.matches || !input.matches('.filters_dropdown input[type="checkbox"]')) return;
    const dropdown = input.closest('.filters_dropdown');
    const rows = shownRows(dropdown);
    const index = rows.indexOf(input.closest('.filters_checkbox'));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = rows[index + (e.key === 'ArrowDown' ? 1 : -1)];
      if (next) next.querySelector('input')?.focus();
      else if (e.key === 'ArrowUp') dropdown.querySelector('.filters_dropdown-search')?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      input.click();
    } else if (e.key === 'Escape') {
      closeDropdown(dropdown);
    }
  });

  // Mobile filter drawer (tablet and down): the filter bar slides in from the left.
  const drawer = document.querySelector('.filters_bar');
  const overlay = document.querySelector('.filters_overlay');
  const toggleDrawer = (open) => {
    if (!drawer) return;
    drawer.classList.toggle('is-open', open);
    overlay?.classList.toggle('is-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  };
  document.addEventListener('click', (e) => {
    if (e.target.closest('.filters_mobile-toggle')) toggleDrawer(true);
    else if (e.target.closest('.filters_drawer-close, .filters_overlay, .filters_drawer-foot .button')) {
      e.preventDefault();
      toggleDrawer(false);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer?.classList.contains('is-open')) toggleDrawer(false);
  });

  // Active states: each dropdown toggle shows how many of its options are ticked,
  // the offer toggle turns pink when on, Clear all only lights up when there is
  // something to clear, and the mobile "Filters" button shows the total.
  // The x after the search text (.filters_search-clear, shown with is-visible while
  // there is text) empties the search; Finsweet, the URL and undo follow the input event.
  const syncSearchClear = () => {
    const input = document.querySelector('.filters_search-input');
    document.querySelector('.filters_search-clear')?.classList.toggle('is-visible', Boolean(input?.value));
  };
  const clearSearch = () => {
    const input = document.querySelector('.filters_search-input');
    if (!input) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    syncSearchClear();
  };
  document.addEventListener('input', (e) => {
    if (e.target.matches?.('.filters_search-input')) syncSearchClear();
  });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.filters_search-clear')) clearSearch();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.filters_search-clear')) {
      e.preventDefault();
      clearSearch();
    }
  });
  const updateFilterCount = () => {
    syncSearchClear();
    if (!drawer) return;
    drawer.querySelectorAll('.filters_dropdown:not([data-sort-dropdown])').forEach((dropdown) => {
      const dropdownToggle = dropdown.querySelector('.filters_dropdown-toggle');
      if (!dropdownToggle) return;
      const n = dropdown.querySelectorAll('input[type="checkbox"]:checked').length;
      // The count sits over the chevron so the toggle never changes width.
      const icon = dropdownToggle.querySelector('.icon_svg');
      let badge = dropdownToggle.querySelector('.filters_dropdown-count');
      if (!badge && icon) {
        // Badge and chevron share a holder; only the chevron rotates when open.
        const slot = document.createElement('span');
        slot.style.cssText = 'position:relative;display:inline-flex;';
        icon.before(slot);
        slot.appendChild(icon);
        badge = document.createElement('span');
        badge.className = 'filters_dropdown-count';
        slot.appendChild(badge);
      }
      if (badge) {
        badge.textContent = n;
        badge.style.display = n ? '' : 'none';
        icon.querySelector('svg').style.visibility = n ? 'hidden' : '';
      }
      dropdownToggle.classList.toggle('is-active', n > 0);
      setClearEnabled(dropdown.querySelector('.filters_dropdown-clear'), n > 0);
    });
    drawer.querySelectorAll('.filters_toggle').forEach((toggle) => {
      const on = Boolean(toggle.querySelector('input:checked'));
      toggle.classList.toggle('is-active', on);
      toggle.querySelector('input')?.classList.toggle('is-checked', on);
    });
    const checked = drawer.querySelectorAll('input[type="checkbox"]:checked').length;
    const search = drawer.querySelector('.filters_search-input')?.value.trim() ? 1 : 0;
    document.querySelectorAll('.filters_clear').forEach((clear) => clear.classList.toggle('is-active', checked + search > 0));
    const count = document.querySelector('.filters_mobile-toggle .filters_mobile-count');
    if (count) {
      count.textContent = checked + search;
      count.style.display = checked + search ? '' : 'none';
    }
  };
  document.addEventListener('input', updateFilterCount);
  document.addEventListener('change', updateFilterCount);
  // Clear all and tag removal untick boxes without firing change events; re-check
  // a few times while Finsweet catches up.
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[fs-list-element="clear"], [fs-list-element="tag-remove"]')) return;
    if (e.target.closest('[fs-list-element="clear"]')) {
      // Belt and braces: make sure every box and the search field are visibly reset.
      setTimeout(() => {
        drawer?.querySelectorAll('input[type="checkbox"]:checked').forEach((input) => (input.checked = false));
        const search = drawer?.querySelector('.filters_search-input');
        if (search) search.value = '';
        updateFilterCount();
      }, 100);
    }
    // A chip's x drops its filter from Finsweet and the URL but leaves the box ticked:
    // re-read every box from the URL once Finsweet has updated it.
    if (e.target.closest('[fs-list-element="tag-remove"]')) {
      [250, 700].forEach((delay) => setTimeout(() => tickFiltersFromUrl(true), delay));
    }
    [50, 250, 600, 800].forEach((delay) => setTimeout(updateFilterCount, delay));
  });
  // Finsweet applies filters from the URL after load without firing change events.
  window.addEventListener('load', () => {
    updateFilterCount();
    setTimeout(updateFilterCount, 600);
  });
  // Finsweet applies filters from the URL (?pet_contain=["|dog|"]) to the list and
  // the tags but leaves the boxes unticked, so tick them here (no change event:
  // Finsweet already has them) before the counts are drawn.
  // With reset, boxes not in the URL are unticked too (after a chip is removed).
  function tickFiltersFromUrl(reset = false) {
    if (reset) {
      document.querySelectorAll('.filters_bar [fs-list-field]').forEach((el) => {
        if (el.closest('[fs-list-element="list"]')) return;
        (el.matches('input') ? [el] : [...el.querySelectorAll('input[type="checkbox"]')]).forEach((input) => (input.checked = false));
      });
    }
    new URLSearchParams(location.search).forEach((raw, key) => {
      const match = key.match(/^(.+)_(contain|equal)$/);
      if (!match) return;
      const field = match[1];
      let values;
      try {
        values = [].concat(JSON.parse(raw));
      } catch (error) {
        values = [raw];
      }
      values = values.map((v) => String(v).toLowerCase().trim());
      if (field === SEARCH_FIELD) {
        const search = document.querySelector('.filters_search-input');
        if (search && !search.value) search.value = values.join(' ');
        return;
      }
      document.querySelectorAll(`[fs-list-field="${CSS.escape(field)}"]`).forEach((el) => {
        if (el.closest('[fs-list-element="list"]')) return;
        const inputs = el.matches('input') ? [el] : [...el.querySelectorAll('input[type="checkbox"]')];
        inputs.forEach((input) => {
          const value = (input.getAttribute('fs-list-value') || 'true').toLowerCase().trim();
          if (values.includes(value)) input.checked = true;
        });
      });
    });
  }
  // Filter undo/redo: after each change (a box, chip x, Clear, Clear all, sort or
  // search) the whole filter state is recorded as one step in the page history.
  // Undo/redo puts the boxes, sort and search back by clicking/setting them, so
  // Finsweet, the URL, chips and counts follow as if done by hand.
  const filterBar = document.querySelector('.filters_bar');
  const sortField = document.querySelector('.filters_sort-select');
  const searchField = document.querySelector('.filters_search-input');
  const filterBoxes = () =>
    [...(filterBar?.querySelectorAll('input[type="checkbox"]') || [])].filter((input) => input.closest('[fs-list-field]') || input.matches('[fs-list-field]'));
  const boxKey = (input) => `${(input.closest('[fs-list-field]') || input).getAttribute('fs-list-field')}:${input.getAttribute('fs-list-value') || 'true'}`;
  const boxLabel = (input) => input.getAttribute('fs-list-tagvalue') || input.closest('label')?.textContent.trim() || 'filter';
  const filterState = () => ({
    boxes: filterBoxes().filter((input) => input.checked).map(boxKey).sort(),
    sort: sortField?.value || '',
    search: searchField?.value.trim() || '',
  });
  const sameState = (a, b) => a.sort === b.sort && a.search === b.search && a.boxes.join('|') === b.boxes.join('|');
  let lastFilterState = null;
  let applyingFilters = false;
  let recordTimer;
  function describeFilters(from, to) {
    const labels = (keys) => keys.map((key) => boxLabel(filterBoxes().find((input) => boxKey(input) === key) || {})).filter(Boolean);
    const added = to.boxes.filter((key) => !from.boxes.includes(key));
    const removed = from.boxes.filter((key) => !to.boxes.includes(key));
    const parts = [];
    if (removed.length) parts.push(!to.boxes.length && removed.length > 1 ? 'Cleared all filters' : `Removed ${labels(removed).join(', ')}`);
    if (added.length) parts.push(`Added ${labels(added).join(', ')}`);
    if (from.search !== to.search) parts.push(to.search ? `Searched "${to.search}"` : 'Cleared the search');
    if (from.sort !== to.sort) parts.push(`Sorted by ${document.querySelector(`[data-sort="${to.sort}"]`)?.textContent.trim() || to.sort}`);
    return { text: parts.join(' · '), removed: removed.length > 0 || (from.search && !to.search) };
  }
  function applyFilterState(state) {
    applyingFilters = true;
    filterBoxes().forEach((input) => {
      if (input.checked !== state.boxes.includes(boxKey(input))) input.click();
    });
    if (sortField && sortField.value !== state.sort) {
      sortField.value = state.sort;
      sortField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (searchField && searchField.value.trim() !== state.search) {
      searchField.value = state.search;
      searchField.dispatchEvent(new Event('input', { bubbles: true }));
    }
    lastFilterState = state;
    setTimeout(() => {
      applyingFilters = false;
      updateFilterCount();
    }, 700);
  }
  function recordFilters(delay = 500) {
    if (!lastFilterState || applyingFilters) return;
    clearTimeout(recordTimer);
    recordTimer = setTimeout(() => {
      if (applyingFilters) return;
      const from = lastFilterState;
      const to = filterState();
      if (sameState(from, to)) return;
      lastFilterState = to;
      const { text, removed } = describeFilters(from, to);
      recordStep({ undo: () => applyFilterState(from), redo: () => applyFilterState(to) });
      if (removed && text) showToast(text, true);
    }, delay);
  }
  if (filterBar) {
    filterBar.addEventListener('change', () => recordFilters());
    searchField?.addEventListener('input', () => recordFilters(900));
    document.addEventListener('click', (e) => {
      if (e.target.closest('[fs-list-element="tag-remove"], [fs-list-element="clear"], .filters_dropdown-clear, [data-sort]')) recordFilters(800);
    });
  }

  document.addEventListener('cp:filters-ready', () => {
    // The starting point for undo is the state restored from the URL.
    setTimeout(() => {
      if (!lastFilterState) lastFilterState = filterState();
    }, 800);
    tickFiltersFromUrl();
    [0, 100, 400].forEach((delay) => setTimeout(updateFilterCount, delay));
  });

  // Desktop: once the filter bar sticks under the nav it gets is-stuck (square top
  // corners, so it meets the nav's bottom border).
  const stickyFilters = document.querySelector('.products_filters');
  const stickyBar = stickyFilters?.querySelector('.filters_bar');
  if (stickyFilters && stickyBar) {
    let ticking = false;
    const checkStuck = () => {
      ticking = false;
      const style = getComputedStyle(stickyFilters);
      const stuck = style.position === 'sticky' && window.scrollY > 0 && stickyFilters.getBoundingClientRect().top <= parseFloat(style.top) + 0.5;
      stickyBar.classList.toggle('is-stuck', stuck);
    };
    const onStickyScroll = () => {
      if (!ticking) (ticking = true), requestAnimationFrame(checkStuck);
    };
    window.addEventListener('scroll', onStickyScroll, { passive: true });
    window.addEventListener('resize', onStickyScroll);
    checkStuck();
  }

  // A click anywhere on a chip removes it, as if its x was clicked.
  document.addEventListener('click', (e) => {
    const tag = e.target.closest('[fs-list-element="tag"]');
    if (!tag || e.target.closest('[fs-list-element="tag-remove"]')) return;
    tag.querySelector('[fs-list-element="tag-remove"]')?.click();
  });

  // Active filter chips in the search bar: one chip shows as is; two or more fold
  // into a "3 filters" pill (.filters_tags-more) and clicking or tapping
  // it drops the chips down as a list (.filters_tags is-open) to remove them.
  const tagsMore = document.querySelector('.filters_tags-more');
  const tagsWrap = tagsMore?.closest('.filters_clear-wrap');
  if (tagsMore && tagsWrap) {
    // Finsweet swaps the tags box for its own copy once it loads, so look it up each time.
    const tagsBox = () => tagsWrap.querySelector('.filters_tags');
    const moreText = tagsMore.querySelector('[data-tags-count]');
    let open = false;
    const paintTags = () => {
      // Finsweet removes the whole tags box once the last tag goes: that counts as none.
      const box = tagsBox();
      const n = box ? [...box.querySelectorAll('[fs-list-element="tag"]')].filter((tag) => tag.style.display !== 'none').length : 0;
      // An open list stays open (down to its last chip) until it is closed.
      const many = n > 1 || (open && n > 0);
      if (!many) open = false;
      tagsMore.classList.toggle('is-visible', many);
      const label = `${n} filter${n === 1 ? '' : 's'}`;
      if (moreText && moreText.textContent !== label) moreText.textContent = label;
      box?.classList.toggle('is-collapsed', many && !open);
      box?.classList.toggle('is-open', many && open);
      tagsMore.setAttribute('aria-expanded', String(many && open));
    };
    const setOpen = (on) => {
      open = on;
      paintTags();
    };
    new MutationObserver(paintTags).observe(tagsWrap, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    paintTags();
    // Finsweet doesn't always remove tags inside the watched box (a dropdown's Clear),
    // so recount after any filter click or change too.
    const repaintSoon = () => [100, 400, 900].forEach((delay) => setTimeout(paintTags, delay));
    document.addEventListener('change', repaintSoon);
    document.addEventListener('click', (e) => {
      if (e.target.closest('.filters_bar, .filters_tags, [fs-list-element="clear"]')) repaintSoon();
    });
    // Click only (no hover): a click opens or closes the list; clicking outside or
    // Escape closes it.
    tagsMore.addEventListener('click', () => setOpen(!open));
    // The event path, not e.target: removing a chip deletes it before this runs, and
    // the list should stay open for removing the next one.
    // Only real clicks count: removing the On offer chip makes Finsweet click its checkbox,
    // which is outside the list.
    document.addEventListener('click', (e) => {
      if (!e.isTrusted) return;
      const inside = e.composedPath().some((el) => el.classList?.contains('filters_tags-more') || el.classList?.contains('filters_tags'));
      if (open && !inside) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        tagsMore.focus();
      }
    });
  }

  // Homepage categories are a Collection List of Categories; each card links to the
  // Products page, and here to that category (its slug sits in a hidden CMS-bound
  // [data-category-slug] element), using the friendly ?category= URL.
  document.querySelectorAll('.cat_pill [data-category-slug]').forEach((el) => {
    const slug = el.textContent.trim();
    const card = el.closest('.cat_pill');
    if (slug && card) card.href = `/products?category=${encodeURIComponent(slug)}`;
  });

  // -------------------------------------------------------
  // BRAND PAGES (/brands/slug)
  // -------------------------------------------------------

  // The range list can't be filtered to the current brand through the API, so it
  // lists every product and hides the ones from other brands. "View the range"
  // opens the filtered Products page.
  const brandMatch = location.pathname.match(/^\/brands\/([^/]+)/);
  if (brandMatch) {
    const brandName = document.querySelector('.section_product-hero h1')?.textContent.trim().toLowerCase();
    const list = document.querySelector('.section_brand-products .product_list');
    if (brandName && list) {
      list.querySelectorAll('.product_item').forEach((item) => {
        const meta = item.querySelector('.product-card_brand, .product-card_meta')?.textContent.trim().toLowerCase();
        if (meta !== brandName) item.remove();
      });
      if (!list.children.length) list.closest('.section_brand-products').style.display = 'none';
    }
    document.querySelectorAll('.section_product-hero a[href="/products?brand="]').forEach((a) => {
      a.href = `/products?brand=${brandMatch[1]}`;
    });
  }

  // Contact: "Message us" links point at /contact#message; give the form that id.
  if (location.pathname.startsWith('/contact')) {
    const formBlock = document.querySelector('.w-form');
    if (formBlock && !document.getElementById('message')) {
      formBlock.id = 'message';
      if (location.hash === '#message') window.addEventListener('load', () => formBlock.scrollIntoView({ block: 'start' }));
    }
  }

  // -------------------------------------------------------
  // POLICY PAGES
  // -------------------------------------------------------

  // Rich text headings on the policy pages use the smaller heading styles (the
  // API can't write "h2 inside this rich text" nested selectors).
  if (/^\/(privacy-policy|cookie-policy)/.test(location.pathname)) {
    document.querySelectorAll('.w-richtext h2').forEach((h) => h.classList.add('heading-style-h4'));
    document.querySelectorAll('.w-richtext h3').forEach((h) => h.classList.add('heading-style-h5'));
  }

  // -------------------------------------------------------
  // TOP BAR ICONS
  // -------------------------------------------------------

  // Solid (filled) icons in the pink top bar, chosen by each link's target.
  // Paths are Material Icons (Apache 2.0).
  const TOP_ICONS = [
    [/account\/login/, 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'],
    [/^tel:/, 'M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z'],
    [/^mailto:/, 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z'],
    [/#message/, 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'],
    [/#delivery/, 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'],
    [/^\/about$/, 'M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z'],
  ];
  document.querySelectorAll('.nav_top-link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const match = TOP_ICONS.find(([re]) => re.test(href));
    const slot = link.querySelector('.nav_top-icon, .w-embed');
    if (!match || !slot) return;
    slot.style.cssText = 'display:flex;width:1rem;height:1rem;flex-shrink:0;';
    slot.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="display:block"><path d="${match[1]}"/></svg>`;
  });

  // Solid icons for the "Why suppliers partner" bento (Material Icons, Apache 2.0),
  // in card order: distribution, field sales, relationships, group, expertise.
  const WHY_ICONS = [
    'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9 1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
    'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
    'M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z',
  ];
  // Each card's circle takes a deeper shade of the card tint, and a large faint
  // copy of the icon sits in the card corner for depth.
  const WHY_TONES = ['var(--colors--pink)', 'var(--colors--accent)', 'var(--colors--dark-gray)', '#e8833a', 'var(--colors--pink)'];
  document.querySelectorAll('.suppliers-why_grid .icon_svg').forEach((icon, i) => {
    if (!WHY_ICONS[i]) return;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${WHY_ICONS[i]}"/></svg>`;
    icon.innerHTML = svg;
    const circle = icon.closest('.icon_circle');
    if (circle) circle.style.backgroundColor = WHY_TONES[i];
    const card = icon.closest('.step_card');
    if (card && !card.querySelector('.why-watermark')) {
      const mark = document.createElement('div');
      mark.className = 'why-watermark';
      mark.style.cssText = `position:absolute;right:-1.5rem;bottom:-1.5rem;width:9rem;height:9rem;opacity:0.08;pointer-events:none;color:${WHY_TONES[i]};`;
      mark.innerHTML = svg;
      card.appendChild(mark);
    }
  });

  // -------------------------------------------------------
  // NAV ON SCROLL
  // -------------------------------------------------------

  // Once the page is scrolled, the pink top bar folds away and the nav gets shorter.
  const navTop = document.querySelector('.nav_top');
  const navContainer = document.querySelector('.nav_container');
  const navLogo = document.querySelector('.nav_logo-link');
  if (navTop || navContainer) {
    let compact = null;
    const onScroll = () => {
      const next = window.scrollY > 40;
      if (next === compact) return;
      compact = next;
      navTop?.classList.toggle('is-collapsed', next);
      navContainer?.classList.toggle('is-compact', next);
      navLogo?.classList.toggle('is-compact', next);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -------------------------------------------------------
  // NAV SEARCH
  // -------------------------------------------------------

  const panel = () => document.querySelector('.nav_search-panel');
  document.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-search-toggle]');
    if (toggle) {
      const p = panel();
      if (!p) return;
      p.classList.toggle('is-open');
      if (p.classList.contains('is-open')) p.querySelector('[data-search-input]')?.focus();
      return;
    }
    if (e.target.closest('[data-search-submit]')) submitSearch();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('[data-search-input]')) {
      e.preventDefault();
      submitSearch();
    }
    if (e.key === 'Escape') panel()?.classList.remove('is-open');
  });
  function submitSearch() {
    const input = document.querySelector('[data-search-input]');
    const term = input ? input.value.trim() : '';
    location.href = '/products' + (term ? `?search=${encodeURIComponent(term)}` : '');
  }

  // -------------------------------------------------------
  // RECENTLY VIEWED PRODUCTS
  // -------------------------------------------------------

  function readRecent() {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
    } catch (error) {
      return [];
    }
  }

  // Product template elements (CMS-bound) are found by class.
  const field = (name) => document.querySelector(`.product-hero_${name}`);
  if (field('name')) {
    const image = field('image');
    const product = {
      url: location.pathname,
      name: field('name').textContent.trim(),
      brand: field('brand')?.textContent.trim() || '',
      sku: field('sku')?.textContent.trim() || '',
      image: image ? image.currentSrc || image.src : '',
    };

    // Brand links go to the brand page; the slug sits in a hidden CMS-bound element.
    const brandSlug = document.querySelector('.product-hero_content .product-card_filters')?.textContent.trim();
    if (brandSlug) {
      document.querySelectorAll('.product-hero_brand, .breadcrumb_link.is-brand').forEach((a) => {
        a.href = `/brands/${brandSlug}`;
      });
    }

    // Hide spec rows and accordions whose CMS field is empty (the API can't set
    // Webflow conditional visibility on text fields).
    const isEmpty = (el) => !el || el.classList.contains('w-dyn-bind-empty') || !el.textContent.trim();
    document.querySelectorAll('.product-spec_row').forEach((row) => {
      if (isEmpty(row.querySelector('.product-spec_value'))) row.style.display = 'none';
    });
    // The last shown row drops its divider so it doesn't double up with the table border.
    document.querySelectorAll('.product-spec_list').forEach((specList) => {
      const shown = [...specList.querySelectorAll('.product-spec_row')].filter((row) => row.style.display !== 'none');
      if (shown.length) shown[shown.length - 1].style.borderBottom = '0';
    });
    document.querySelectorAll('.accordion_item').forEach((item) => {
      const content = item.querySelector('.accordion_content');
      if (content && !content.textContent.trim()) item.style.display = 'none';
    });

    // "Ask about this product" links to #product-enquiry (the API could not set this id).
    const enquirySection = document.querySelector('.section_product-enquiry');
    if (enquirySection && !enquirySection.id) enquirySection.id = 'product-enquiry';

    // Pre-fill the enquiry form with the product being viewed.
    const message = document.querySelector('.product-enquiry_card textarea');
    if (message && !message.value) {
      message.value = `I'd like to ask about ${product.name}${product.sku ? ` (${product.sku})` : ''}.`;
    }
    // Hidden fields so the enquiry records which product it's about (the form's Code Embed
  // carries the Basin Form and _gotcha fields).
    const enquiryForm = document.querySelector('.product-enquiry_card form');
    if (enquiryForm) {
      [
        ['Product', product.name],
        ['SKU', product.sku],
        ['Product link', location.origin + location.pathname],
      ].forEach(([name, value]) => {
        let input = enquiryForm.querySelector(`input[name="${name}"]`);
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          enquiryForm.appendChild(input);
        }
        input.value = value;
      });
    }

    // Favourite heart on the product image.
    const imageCard = document.querySelector('.product-hero_image-card');
    if (imageCard) {
      pageProduct = product;
      imageCard.appendChild(makeHeart(product.url));
    }

    const list = readRecent().filter((p) => p.url !== product.url);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([product, ...list].slice(0, RECENT_MAX)));
    } catch (error) {
      // Storage can be blocked; the recently viewed strips simply stay hidden.
    }
  }

  // Product card for the script's lists. Lists built in Webflow (the /favourites and
  // /recently-viewed pages, the product page strip) hold sample cards: the first one
  // is kept as the template, so card changes made in the Designer carry through.
  // Other lists get the same markup as the CMS cards.
  function productCard(p, template) {
    let item;
    if (template) {
      item = template.cloneNode(true);
      item.querySelectorAll('.fav-button').forEach((b) => b.remove());
    } else {
      item = document.createElement('div');
      item.className = 'product_item';
      item.innerHTML =
        '<a class="product-card w-inline-block"><div class="product-card_image-wrap"><img class="product-card_image" loading="lazy" alt=""></div>' +
        '<div class="product-card_text"><div class="product-card_meta"><div class="product-card_sku"></div><div class="product-card_dot">·</div><div class="product-card_brand"></div></div><div class="product-card_name"></div></div></a>';
    }
    const card = item.querySelector('.product-card');
    card.href = p.url;
    if (p.sku) card.dataset.sku = p.sku;
    const img = card.querySelector('.product-card_image');
    if (img && p.image) {
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
      img.src = p.image;
      img.alt = p.name;
      img.loading = 'lazy';
    } else img?.remove();
    // Meta line: product code · brand (the code and dot hide when there's no code).
    const sku = card.querySelector('.product-card_sku');
    const brand = card.querySelector('.product-card_brand');
    if (sku || brand) {
      if (sku) sku.textContent = p.sku || '';
      card.querySelectorAll('.product-card_sku, .product-card_dot').forEach((el) => (el.style.display = p.sku ? '' : 'none'));
      if (brand) brand.textContent = p.brand || '';
    } else {
      const meta = card.querySelector('.product-card_meta');
      if (meta) meta.textContent = p.brand || '';
    }
    const name = card.querySelector('.product-card_name');
    if (name) name.textContent = p.name;
    item.appendChild(makeHeart(p.url));
    return item;
  }
  const listTemplates = new WeakMap();
  function fillList(list, items) {
    if (!listTemplates.has(list)) listTemplates.set(list, list.querySelector('.product_item')?.cloneNode(true) || null);
    const template = listTemplates.get(list);
    list.replaceChildren(...items.map((p) => productCard(p, template)));
  }
  const ARROW =
    '<div class="icon_svg"><svg aria-hidden="true" stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" height="100%" width="100%" xmlns="http://www.w3.org/2000/svg"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg></div>';
  function viewAllLink(href, text) {
    const a = document.createElement('a');
    a.className = 'link_arrow w-inline-block';
    a.href = href;
    a.innerHTML = `${text}${ARROW}`;
    return a;
  }
  // A section in the site's usual layout: heading row, then a product grid.
  function productSection(className, title, text) {
    const section = document.createElement('section');
    section.className = className;
    section.innerHTML =
      '<div class="padding-global padding-section-large"><div class="container-large">' +
      '<div class="heading_row"><div class="heading_text"><h2 class="heading-style-h2"></h2><p class="text-size-medium"></p></div></div>' +
      '<div class="product_list"></div></div></div>';
    section.querySelector('h2').textContent = title;
    section.querySelector('.heading_text p').textContent = text || '';
    return section;
  }

  // -------------------------------------------------------
  // RECENTLY VIEWED AND FAVOURITES PAGES AND STRIPS
  // -------------------------------------------------------

  // /favourites lists every favourite (with a Download menu) and ends with a
  // Recently viewed strip; /recently-viewed lists everything viewed and ends with a
  // Favourites strip (the only place that strip appears). Product, Home, Products and
  // brand pages get a Recently viewed strip above the closing call to action.
  // Strips are sliders: 4 at a time (3 tablet, 2 mobile), arrows, and "View all".
  const path = location.pathname.replace(/\/$/, '') || '/';
  const isFavPage = path === '/favourites' && !document.querySelector('._404_wrapper');
  const isRecentPage = path === '/recently-viewed' && !document.querySelector('._404_wrapper');
  const CHEVRON = (d) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  // Slider arrows for a product list, at the far right of the section's heading row.
  // Links built in Webflow in that row (a .button-group or .link_arrow) sit just before
  // the arrows; otherwise a "View all" link to viewAll is added there. Returns update(),
  // which disables the arrows at either end and hides them when everything fits.
  function sliderControls(section, list, viewAll) {
    list.classList.add('recent_track');
    const row = section.querySelector('.heading_row');
    const controls = document.createElement('div');
    controls.className = 'recent_controls';
    const nativeLinks = row?.querySelector(':scope > .button-group, :scope > .link_arrow');
    if (nativeLinks) controls.appendChild(nativeLinks);
    else if (viewAll) controls.appendChild(viewAllLink(viewAll, 'View all'));
    controls.insertAdjacentHTML(
      'beforeend',
      `<button type="button" class="recent_arrow" data-dir="-1" aria-label="Previous products">${CHEVRON('m15 18-6-6 6-6')}</button>` +
        `<button type="button" class="recent_arrow" data-dir="1" aria-label="Next products">${CHEVRON('m9 18 6-6-6-6')}</button>`,
    );
    row?.appendChild(controls);
    const [prev, next] = controls.querySelectorAll('.recent_arrow');
    const update = () => {
      prev.disabled = list.scrollLeft <= 2;
      next.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
      controls.classList.toggle('is-static', prev.disabled && next.disabled);
    };
    controls.addEventListener('click', (e) => {
      const arrow = e.target.closest('.recent_arrow');
      if (arrow) list.scrollBy({ left: Number(arrow.dataset.dir) * list.clientWidth, behavior: 'smooth' });
    });
    list.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    requestAnimationFrame(update);
    return update;
  }
  // A strip section whose items come from getItems(); refresh() re-renders it and
  // hides it when empty.
  function makeStrip(section, list, getItems, viewAll) {
    const update = sliderControls(section, list, viewAll);
    const refresh = () => {
      const items = getItems().slice(0, RECENT_STRIP);
      section.style.display = items.length ? '' : 'none';
      fillList(list, items);
      requestAnimationFrame(update);
    };
    refresh();
    return refresh;
  }
  function stripSection(title, getItems, viewAll) {
    const section = productSection('section_product-recent', title);
    section.querySelector('.heading_text p').remove();
    const refresh = makeStrip(section, section.querySelector('.product_list'), getItems, viewAll);
    // Above the closing call to action, else above the footer (Home has no <main>).
    const anchor = document.querySelector('[class*="section_cta"], .footer_component');
    if (anchor) anchor.before(section);
    else (document.querySelector('main') || document.body).appendChild(section);
    return refresh;
  }
  const recentOthers = () => readRecent().filter((p) => p.url !== path);
  const refreshers = [];
  // A strip built in Webflow (.section_product-recent with a .product-recent_list),
  // else one made here on the pages that show it.
  const nativeStrip = document.querySelector('.section_product-recent');
  const nativeStripList = nativeStrip?.querySelector('.product-recent_list');
  function strip(title, getItems, viewAll) {
    if (nativeStrip && nativeStripList) return makeStrip(nativeStrip, nativeStripList, getItems, viewAll);
    return stripSection(title, getItems, viewAll);
  }
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  // Both list pages are built in Webflow with sample cards, which are replaced here.
  if (isFavPage) {
    const favSection = document.querySelector('.section_favourites');
    const favList = favSection?.querySelector('.product_list');
    if (favList) {
      const favEmpty = favSection.querySelector('.fav-page_empty');
      const count = favSection.querySelector('.fav-page_count');
      const actions = favSection.querySelector('.fav-page_actions');
      favSection.querySelectorAll('.fav-download').forEach(initDownloadMenu);
      refreshers.push(() => {
        const n = favourites.length;
        fillList(favList, favourites);
        favList.style.display = n ? '' : 'none';
        if (favEmpty) favEmpty.style.display = n ? 'none' : '';
        if (actions) actions.style.display = n ? '' : 'none';
        if (count) count.textContent = n ? `${plural(n, 'saved product')}, stored on this device.` : '';
      });
    }
    refreshers.push(strip('Recently viewed', recentOthers, '/recently-viewed'));
  } else if (isRecentPage) {
    const recentSection = document.querySelector('.section_recent');
    const recentList = recentSection?.querySelector('.product_list');
    if (recentList) {
      const recentEmpty = recentSection.querySelector('.fav-page_empty');
      const count = recentSection.querySelector('.fav-page_count');
      const clear = recentSection.querySelector('.fav-page_clear');
      refreshers.push(() => {
        const items = readRecent();
        fillList(recentList, items);
        recentList.style.display = items.length ? '' : 'none';
        if (recentEmpty) recentEmpty.style.display = items.length ? 'none' : '';
        if (clear) clear.style.display = items.length ? '' : 'none';
        if (count) count.textContent = items.length ? `The last ${plural(items.length, 'product')} you looked at, on this device.` : '';
      });
      clear?.addEventListener('click', () => {
        try {
          localStorage.removeItem(RECENT_KEY);
        } catch (error) {
          // Nothing to clear if storage is blocked.
        }
        refreshers.forEach((fn) => fn());
      });
    }
    refreshers.push(strip('Your favourites', () => favourites, '/favourites'));
  } else if (nativeStrip || path === '/' || path === '/products' || path.startsWith('/brands/')) {
    refreshers.push(strip('Recently viewed', recentOthers, '/recently-viewed'));
  }
  refreshers.forEach((fn) => fn());

  // Product page "Related products": a Collection List filtered in the Designer to this
  // product's categories. The product itself is taken out here, the list becomes a
  // slider like the strips, and it hides when empty. "View all" opens Products with
  // this product's categories ticked (their slugs sit in a hidden CMS-bound element,
  // [data-product-categories], as "|food|treats|").
  const related = document.querySelector('.section_product-related');
  if (related) {
    const relatedList = related.querySelector('.product_list');
    relatedList?.querySelectorAll('.product_item').forEach((item) => {
      if (item.querySelector('.product-card')?.getAttribute('href') === location.pathname) item.remove();
    });
    if (!relatedList?.querySelector('.product_item')) related.style.display = 'none';
    else {
      const cats = (document.querySelector('[data-product-categories]')?.textContent || '')
        .split('|')
        .map((slug) => slug.trim())
        .filter(Boolean)
        .map((slug) => `|${slug}|`);
      const viewAll = related.querySelector('.heading_row > .link_arrow');
      if (cats.length && viewAll) viewAll.href = `/products?category_contain=${encodeURIComponent(JSON.stringify(cats))}`;
      sliderControls(related, relatedList);
    }
  }
  // On the two list pages, hearts toggled here (or in another tab) re-render the lists.
  // Elsewhere the hearts just repaint, so a slider keeps its scroll position.
  if (isFavPage || isRecentPage) onFavouritesChange = () => refreshers.forEach((fn) => fn());
  window.addEventListener('storage', (e) => e.key === RECENT_KEY && refreshers.forEach((fn) => fn()));
})();
