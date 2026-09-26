// Last updated: 2026-09-26 10:55:36

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
      // Sits on the card (not the clipped image box) so it can overhang the corner.
      const badge = document.createElement('div');
      badge.className = 'product-card_badge';
      badge.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg><span>On offer</span>';
      card.appendChild(badge);
    });
  };

  // One-line text cut off with an ellipsis (the element's CSS does the cutting); while
  // the pointer is over `hoverEl` it scrolls slowly left to show the rest, then slides back.
  function ellipsisScroll(textEl, hoverEl) {
    // text-indent moves the text itself, so the CSS ellipsis still shows at rest.
    hoverEl.addEventListener('mouseenter', () => {
      const overflow = textEl.scrollWidth - textEl.clientWidth;
      if (overflow <= 0) return;
      textEl.style.textOverflow = 'clip';
      textEl.style.transition = `text-indent ${Math.max(1, overflow / 30)}s linear 0.3s`;
      textEl.style.textIndent = `-${overflow + 4}px`;
    });
    hoverEl.addEventListener('mouseleave', () => {
      textEl.style.transition = 'text-indent 0.4s ease';
      textEl.style.textIndent = '';
      setTimeout(() => (textEl.style.textOverflow = ''), 400);
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
    .fav-button svg { fill: none; transition: fill .2s; }
    .fav-button:hover { color: var(--colors--pink); transform: scale(1.08); }
    .fav-button.is-active { color: var(--colors--pink); }
    .fav-button.is-active svg { fill: currentColor; }
    .fav-button.is-pop { animation: fav-pop .35s ease; }
    @keyframes fav-pop { 50% { transform: scale(1.25); } }
    .product-hero_image-card { position: relative; }
    .product-hero_image-card .fav-button { top: 1rem; right: 1rem; width: 3rem; height: 3rem; padding: .75rem; }
    /* Nav heart: same box as the search icon, a slightly larger heart, and the count
       in white inside the filled heart. */
    .nav_icon-link.is-fav { position: relative; flex: none; margin: 0; }
    .nav_icon-link.is-fav .nav_icon { position: relative; width: 1.625rem; height: 1.625rem; }
    .nav_icon-link.is-fav:hover { color: var(--colors--pink); }
    .nav_icon-link.is-fav.is-active { color: var(--colors--pink); }
    .nav_icon-link.is-fav svg { fill: none; }
    .nav_icon-link.is-fav.is-active svg { fill: currentColor; }
    /* Tabular figures keep digits (especially "1") centred in the heart. */
    /* Centred on the heart itself; the bottom offset lifts it to the heart's optical middle. */
    .fav-count { position: absolute; inset: 0 0 .2rem; display: flex; align-items: center; justify-content: center; color: var(--colors--white); font-size: .75rem; font-weight: 700; font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; line-height: 1; pointer-events: none; }
    .fav-count.is-long { font-size: .6875rem; }
    .fav-count:empty { display: none; }
    .fav-overlay { position: fixed; inset: 0; z-index: 998; background: var(--colors--dark-gray); opacity: 0; pointer-events: none; transition: opacity .3s; }
    .fav-overlay.is-open { opacity: .5; pointer-events: auto; }
    .fav-panel { position: fixed; top: 0; right: 0; bottom: 0; z-index: 999; display: flex; flex-direction: column; width: min(26rem, 100vw); background: var(--colors--white); color: var(--colors--dark-gray); box-shadow: -8px 0 32px rgba(15, 23, 42, .15); transform: translateX(100%); visibility: hidden; transition: transform .3s ease, visibility 0s .3s; }
    .fav-panel.is-open { transform: none; visibility: visible; transition: transform .3s ease; }
    .fav-panel_head { display: flex; align-items: flex-start; justify-content: space-between; padding: 1.25rem 1.5rem .25rem; }
    .fav-panel_title { margin: 0; font-family: var(--theme--heading-font); font-size: 1.5rem; font-weight: 700; line-height: 1.15; }
    .fav-panel_close { width: 2.5rem; height: 2.5rem; padding: .6rem; border: 0; border-radius: var(--radius--radius-circle); background: var(--colors--light-gray); color: inherit; cursor: pointer; }
    .fav-panel_close:hover { color: var(--colors--pink); }
    .fav-panel_list { flex: 1; overflow-x: hidden; overflow-y: auto; scrollbar-gutter: stable; margin: 0; padding: .5rem 1.5rem; list-style: none; }
    .fav-panel_item { display: flex; align-items: center; gap: 1rem; padding: .75rem 0; border-bottom: 1px solid var(--colors--navy-tint); }
    .fav-panel_link { display: flex; flex: 1; align-items: center; gap: 1rem; min-width: 0; color: inherit; text-decoration: none; }
    .fav-panel_link:hover .fav-panel_name { color: var(--colors--pink); }
    .fav-panel_image { flex: none; width: 4rem; height: 4rem; padding: .25rem; border-radius: var(--radius--radius-input); background: var(--colors--light-gray); object-fit: contain; }
    .fav-panel_brand { font-size: var(--font-size--tiny); text-transform: uppercase; letter-spacing: .05em; opacity: .7; }
    .fav-panel_name { font-weight: 600; line-height: 1.3; transition: color .2s; }
    /* One line each; long names end in an ellipsis and scroll on hover (ellipsisScroll). */
    .fav-panel_text { flex: 1; min-width: 0; }
    .fav-panel_brand, .fav-panel_name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .fav-panel_remove { flex: none; width: 2rem; height: 2rem; padding: .45rem; border: 0; border-radius: var(--radius--radius-circle); background: transparent; color: var(--colors--pink); cursor: pointer; }
    .fav-panel_remove svg { fill: currentColor; }
    .fav-panel_remove:hover { background: var(--colors--pink-tint); }
    .fav-panel_empty { padding: 2.5rem 1.5rem; text-align: center; }
    .fav-panel_empty p { margin: 0 0 1.5rem; }
    /* Three equal buttons across the panel: View on page, Download, Recently viewed (grey). */
    .fav-panel_bar { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: auto; align-items: stretch; gap: .5rem; padding: .875rem 1.5rem 1rem; border-bottom: 1px solid var(--colors--navy-tint); }
    .fav-panel_bar .button, .fav-panel_bar .fav-download > summary { width: 100%; min-height: 0; padding: .6rem .5rem; font-size: .875rem; line-height: 1.2; white-space: nowrap; }
    .fav-panel_bar .fav-download > summary { gap: .4rem; }
    .fav-panel_bar .button.fav-panel_recent { background-color: var(--colors--navy-tint); color: var(--colors--dark-gray); }
    .fav-panel_bar .button.fav-panel_recent:hover { background-color: var(--colors--dark-gray-15); }
    .fav-panel_bar.is-empty { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .fav-panel_note { margin: .2rem 0 0; font-size: .6875rem; opacity: .65; }
    .fav-panel_bar.is-empty .fav-download { display: none; }
    .fav-toast { position: fixed; left: 50%; bottom: 1.5rem; z-index: 1000; display: flex; align-items: center; gap: 1rem; max-width: calc(100vw - 2rem); padding: .75rem .75rem .75rem 1.25rem; border-radius: var(--radius--radius-button); background: var(--colors--dark-gray); color: var(--colors--white); font-size: var(--font-size--small); box-shadow: 0 8px 24px rgba(15, 23, 42, .25); transform: translate(-50%, 150%); opacity: 0; transition: transform .3s ease, opacity .3s; pointer-events: none; }
    .fav-toast.is-open { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
    .fav-toast_undo { padding: .4rem .9rem; border: 0; border-radius: var(--radius--radius-button); background: var(--colors--pink); color: var(--colors--white); font: inherit; font-weight: 700; cursor: pointer; }
    .fav-toast_undo:hover { background: var(--colors--white); color: var(--colors--pink); }
    .fav-page_actions { display: flex; flex-wrap: wrap; gap: .75rem; align-items: center; }
    .recent_track { display: grid; grid-auto-flow: column; grid-template-columns: none; grid-template-rows: auto; grid-auto-columns: calc((100% - 3 * var(--spacing--medium)) / 4); overflow: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
    .recent_track::-webkit-scrollbar { display: none; }
    .recent_track > * { scroll-snap-align: start; }
    .recent_controls { display: flex; align-items: center; gap: .5rem; }
    .recent_controls .link_arrow { margin-left: .75rem; }
    .recent_controls.is-static .recent_arrow { display: none; }
    .recent_arrow { width: 2.5rem; height: 2.5rem; padding: .65rem; border: 1px solid var(--colors--dark-gray-15); border-radius: var(--radius--radius-circle); background: var(--colors--white); color: var(--colors--dark-gray); cursor: pointer; transition: background-color .2s, color .2s, opacity .2s; }
    .recent_arrow:hover:not(:disabled) { background: var(--colors--pink); border-color: var(--colors--pink); color: var(--colors--white); }
    .recent_arrow:disabled { opacity: .35; cursor: default; }
    @media (max-width: 991px) { .recent_track { grid-auto-columns: calc((100% - 2 * var(--spacing--medium)) / 3); } }
    @media (max-width: 767px) { .recent_track { grid-auto-columns: calc((100% - var(--spacing--small)) / 2); } }
    .fav-download { position: relative; }
    .fav-download > summary { list-style: none; cursor: pointer; gap: .6rem; }
    .fav-download > summary::-webkit-details-marker { display: none; }
    .fav-download_chevron { width: .5rem; height: .5rem; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: translateY(-2px) rotate(45deg); transition: transform .2s; }
    .fav-download[open] .fav-download_chevron { transform: translateY(2px) rotate(-135deg); }
    .fav-download_menu { position: absolute; right: 0; top: calc(100% + .2rem); z-index: 20; display: grid; min-width: 11rem; padding: .3rem; border: 1px solid var(--colors--dark-gray-15); border-radius: var(--radius--radius-block); background: var(--colors--white); box-shadow: 0 12px 32px rgba(15, 23, 42, .14); }
    .fav-download_menu button { display: flex; align-items: center; gap: .55rem; padding: .45rem .7rem; border: 0; border-radius: var(--radius--radius-input); background: none; color: var(--colors--dark-gray); font: inherit; font-size: var(--font-size--small); font-weight: 600; white-space: nowrap; text-align: left; cursor: pointer; }
    .fav-download_menu svg { flex: none; width: 1.375rem; height: 1.375rem; }
    .fav-download_menu button:hover, .fav-download_menu button:focus-visible { background: var(--colors--pink-tint); color: var(--colors--pink); }
    @media (max-width: 767px) { .fav-download_menu { left: 0; right: auto; } }
    .fav-page_empty { padding: 2.5rem; border-radius: var(--radius--radius-block); background: var(--colors--light-gray); text-align: center; }
    .fav-page_empty p { margin: 0 0 1.5rem; }
    .fav-page_clear { padding: 0; border: 0; background: none; color: inherit; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
    .fav-page_clear:hover { color: var(--colors--pink); }
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

  // Every add/remove is recorded so Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) can undo and
  // redo it. A removal also shows a toast with an Undo button for touch screens.
  const favHistory = { undo: [], redo: [] };
  function setFavourite(product, on, index = 0) {
    const rest = favourites.filter((p) => p.url !== product.url);
    if (on) rest.splice(Math.min(index, rest.length), 0, product);
    saveFavourites(rest);
  }
  function toggleFavourite(product, button) {
    const on = !isFavourite(product.url);
    const index = on ? 0 : favourites.findIndex((p) => p.url === product.url);
    setFavourite(product, on);
    favHistory.undo.push({ product, on, index });
    favHistory.redo = [];
    if (on && button) {
      button.classList.remove('is-pop');
      void button.offsetWidth;
      button.classList.add('is-pop');
    }
    if (!on) showToast(`Removed ${product.name || 'product'} from favourites`, true);
  }
  function undoFavourite(redo) {
    const step = (redo ? favHistory.redo : favHistory.undo).pop();
    if (!step) return;
    (redo ? favHistory.undo : favHistory.redo).push(step);
    const on = redo ? step.on : !step.on;
    setFavourite(step.product, on, step.index);
    showToast(`${on ? 'Added' : 'Removed'} ${step.product.name || 'product'} ${on ? 'to' : 'from'} favourites`, false);
  }
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key !== 'z' && key !== 'y') return;
    // Leave typing fields alone so Ctrl+Z still undoes text there.
    const t = e.target;
    if (t.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
    const redo = key === 'y' || e.shiftKey;
    if (!(redo ? favHistory.redo : favHistory.undo).length) return;
    e.preventDefault();
    undoFavourite(redo);
  });

  const favToast = document.createElement('div');
  favToast.className = 'fav-toast';
  favToast.setAttribute('role', 'status');
  favToast.innerHTML = '<span class="fav-toast_text"></span><button type="button" class="fav-toast_undo">Undo</button>';
  favToast.querySelector('.fav-toast_undo').addEventListener('click', () => undoFavourite(false));
  let toastTimer;
  function showToast(text, withUndo) {
    if (!favToast.isConnected) document.body.appendChild(favToast);
    favToast.querySelector('.fav-toast_text').textContent = text;
    favToast.querySelector('.fav-toast_undo').style.display = withUndo ? '' : 'none';
    favToast.classList.add('is-open');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => favToast.classList.remove('is-open'), 5000);
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
      brand: card.querySelector('[fs-list-field="brandname"], .product-recent_brand')?.textContent.trim() || '',
      sku: card.querySelector('[fs-list-field="sku"]')?.textContent.trim() || card.dataset.sku || '',
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

  // Nav heart with a count, opening the favourites panel.
  const navRight = document.querySelector('.nav_right-wrapper');
  let navFav = null;
  if (navRight) {
    navFav = document.createElement('button');
    navFav.type = 'button';
    navFav.className = 'nav_icon-link is-fav';
    navFav.style.cssText = 'border:0;background:transparent;padding:0;';
    navFav.innerHTML = `<div class="nav_icon">${heartSvg}<span class="fav-count"></span></div>`;
    navFav.addEventListener('click', () => openPanel());
    const search = navRight.querySelector('[data-search-toggle]');
    navRight.insertBefore(navFav, search ? search.nextSibling : navRight.firstChild);
  }

  // -------------------------------------------------------
  // FAVOURITES DOWNLOADS (panel and /favourites page)
  // -------------------------------------------------------

  // A "Download" menu: each favourite's product page is read for its details (spec
  // table, short summary, main image), then written as PDF, Excel, CSV or text. The
  // Excel and PDF libraries load only when first used.
  // File-type icons: a page with a coloured label (PDF red, Excel green, CSV teal, text grey).
  const fileIcon = (label, colour) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 1.75h7.5l5.25 5.25v13.25a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V3.75a2 2 0 0 1 2-2z" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><path d="M14.5 1.75V7h5.25" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linejoin="round"/><rect x="1" y="11.5" width="16" height="8" rx="1.75" fill="${colour}"/><text x="9" y="17.6" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="6.2" font-weight="700" fill="#fff">${label}</text></svg>`;
  const EXPORT_TYPES = [
    ['pdf', 'PDF', fileIcon('PDF', '#E2312D')],
    ['xlsx', 'Excel', fileIcon('XLS', '#1D6F42')],
    ['csv', 'CSV', fileIcon('CSV', '#0E7C66')],
    ['txt', 'Text', fileIcon('TXT', '#64748B')],
  ];
  function makeDownloadMenu() {
    const download = document.createElement('details');
    download.className = 'fav-download';
    download.innerHTML =
      '<summary class="button is-secondary">Download<span class="fav-download_chevron" aria-hidden="true"></span></summary>' +
      '<div class="fav-download_menu">' +
      EXPORT_TYPES.map(([ext, name, icon]) => `<button type="button" data-export="${ext}">${icon}${name} (.${ext})</button>`)
        .join('') +
      '</div>';
    const summaryEl = download.querySelector('summary');
    document.addEventListener('click', (e) => {
      if (download.open && !download.contains(e.target)) download.open = false;
    });
    download.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && download.open) {
        e.stopPropagation();
        download.open = false;
        summaryEl.focus();
      }
    });
    download.querySelectorAll('[data-export]').forEach((button) =>
      button.addEventListener('click', async () => {
        download.open = false;
        const label = summaryEl.firstChild.textContent;
        summaryEl.firstChild.textContent = 'Preparing…';
        summaryEl.setAttribute('aria-busy', 'true');
        try {
          const items = await favouriteDetails();
          await EXPORTERS[button.dataset.export](items);
        } catch (error) {
          showToast('Sorry, the download failed. Please try again.', false);
        }
        summaryEl.firstChild.textContent = label;
        summaryEl.removeAttribute('aria-busy');
      })
    );
    return download;
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

  const favOverlay = document.createElement('div');
  favOverlay.className = 'fav-overlay';
  const favPanel = document.createElement('aside');
  favPanel.className = 'fav-panel';
  favPanel.setAttribute('role', 'dialog');
  favPanel.setAttribute('aria-modal', 'true');
  favPanel.setAttribute('aria-labelledby', 'fav-panel-title');
  favPanel.setAttribute('data-lenis-prevent', '');
  favPanel.innerHTML = `
    <div class="fav-panel_head">
      <div>
        <h2 class="fav-panel_title" id="fav-panel-title">Favourites</h2>
        <p class="fav-panel_note">Saved on this device only.</p>
      </div>
      <button type="button" class="fav-panel_close" aria-label="Close favourites"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
    <div class="fav-panel_bar">
      <a href="/favourites" class="button w-inline-block"><div>View on page</div></a>
      <a href="/recently-viewed" class="button fav-panel_recent w-inline-block"><div>Recently viewed</div></a>
    </div>
    <ul class="fav-panel_list"></ul>
    <div class="fav-panel_empty">
      <p>No favourites yet. Tap the heart on any product to save it here.</p>
      <div class="button-group" style="justify-content:center"><a href="/products" class="button w-inline-block"><div>Browse products</div></a></div>
    </div>`;
  // Download sits between "View on page" and the Recently viewed link.
  favPanel.querySelector('.fav-panel_recent').before(makeDownloadMenu());
  document.body.append(favOverlay, favPanel);
  favPanel.querySelector('.fav-panel_close').addEventListener('click', () => closePanel());
  favOverlay.addEventListener('click', () => closePanel());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && favPanel.classList.contains('is-open')) closePanel();
  });

  function openPanel() {
    renderPanel();
    favPanel.classList.add('is-open');
    favOverlay.classList.add('is-open');
    navFav?.setAttribute('aria-expanded', 'true');
    favPanel.querySelector('.fav-panel_close').focus();
  }
  function closePanel() {
    favPanel.classList.remove('is-open');
    favOverlay.classList.remove('is-open');
    navFav?.setAttribute('aria-expanded', 'false');
    navFav?.focus();
  }

  function renderPanel() {
    const list = favPanel.querySelector('.fav-panel_list');
    list.replaceChildren(
      ...favourites.map((p) => {
        const li = document.createElement('li');
        li.className = 'fav-panel_item';
        const link = document.createElement('a');
        link.className = 'fav-panel_link';
        link.href = p.url;
        if (p.image) {
          const img = document.createElement('img');
          img.className = 'fav-panel_image';
          img.src = p.image;
          img.alt = '';
          img.loading = 'lazy';
          link.appendChild(img);
        }
        const text = document.createElement('div');
        text.className = 'fav-panel_text';
        text.innerHTML = '<div class="fav-panel_brand"></div><div class="fav-panel_name"></div>';
        text.children[0].textContent = p.brand;
        text.children[1].textContent = p.name;
        ellipsisScroll(text.children[1], li);
        link.appendChild(text);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'fav-panel_remove';
        remove.setAttribute('aria-label', `Remove ${p.name} from favourites`);
        remove.innerHTML = heartSvg;
        remove.addEventListener('click', () => {
          toggleFavourite(p);
          favPanel.querySelector('.fav-panel_close').focus();
        });
        li.append(link, remove);
        return li;
      })
    );
    favPanel.querySelector('.fav-panel_empty').style.display = favourites.length ? 'none' : '';
    favPanel.querySelector('.fav-panel_bar').classList.toggle('is-empty', !favourites.length);
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
    if (favPanel.classList.contains('is-open')) renderPanel();
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
  // Finsweet load-more renders new items later; fix those as they appear.
  new MutationObserver(() => {
    fixItemLinks();
    addOfferBadges();
    addFavouriteButtons();
  }).observe(document.documentElement, { childList: true, subtree: true });

  const SEARCH_FIELD = 'name, brandname, sku';
  const RECENT_KEY = 'chanellePetRecentlyViewed';
  // Up to 24 products are remembered; sliders hold the latest 12.
  const RECENT_MAX = 24;
  const RECENT_STRIP = 12;

  // -------------------------------------------------------
  // PRODUCT FILTERS (Finsweet Attributes v2 List)
  // -------------------------------------------------------

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
    set('.filters_tag > span:first-child', { 'fs-list-element': 'tag-value' });

    // Pet and category checkboxes: the item fields hold "|slug|slug|", so each box
    // filters on "|slug|" (slug from its label) and its tag shows the label.
    const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    document.querySelectorAll('.filters_dropdown[fs-list-field="pet"], .filters_dropdown[fs-list-field="category"]').forEach((dropdown) => {
      dropdown.querySelectorAll('.filters_checkbox').forEach((label) => {
        const input = label.querySelector('input');
        const name = label.textContent.trim();
        if (!input || !name) return;
        input.setAttribute('fs-list-value', `|${slugify(name)}|`);
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
    history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
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
    if (!template) return;
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
    flattenCheckboxes();
    addMissingCategories();
    addFilterAttributes();
    rewriteFilterParams();
    // Default sort: featured first, unless the URL already asks for a sort.
    const sortSelect = document.querySelector('.filters_sort-select');
    if (sortSelect && !/[?&]sort/.test(location.search)) {
      sortSelect.value = 'rank-desc';
      window.addEventListener('load', () => sortSelect.dispatchEvent(new Event('change', { bubbles: true })));
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
    const dropdown = document.createElement('details');
    dropdown.className = 'filters_dropdown';
    dropdown.innerHTML =
      '<summary class="filters_dropdown-toggle">Category<div class="icon_svg" style="width:1rem;height:1rem"><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></div></summary>' +
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

    const empty = document.createElement('p');
    empty.className = 'filters_dropdown-empty';
    empty.textContent = 'No brands match these filters.';
    empty.style.display = 'none';
    supplierList.after(empty);

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
      empty.style.display = shown ? 'none' : '';
      count.textContent = `Showing ${shown} of ${items.length} brands`;
      clearSearch.style.display = term ? '' : 'none';
      // Count badge / active state on the Category toggle.
      const summary = dropdown.querySelector('summary');
      summary.classList.toggle('is-active', cats.length > 0);
      const dClear = dropdown.querySelector('.filters_dropdown-clear');
      if (dClear) dClear.style.display = cats.length ? '' : 'none';
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

  // Placeholders by field name (the Webflow API can't set input placeholders).
  const PLACEHOLDERS = {
    Name: 'Your full name',
    Business: 'Shop, practice or business',
    Email: 'you@business.ie',
    Phone: 'e.g. 087 123 4567',
    Message: 'How can we help?',
  };
  document.querySelectorAll('form input[name], form textarea[name]').forEach((field) => {
    if (PLACEHOLDERS[field.name] && (!field.placeholder || field.placeholder === 'Example text')) {
      field.placeholder = PLACEHOLDERS[field.name];
    }
  });

  // Privacy checkbox: flatten Webflow's nested label into <label><input><span> and
  // drive the pink custom box from the checked state.
  document.querySelectorAll('.form_checkbox-field').forEach((row) => {
    const inner = row.querySelector('label.form_checkbox-icon');
    const input = row.querySelector('input[type="checkbox"]');
    if (!input) return;
    if (inner) {
      row.removeAttribute('for');
      input.removeAttribute('id');
      input.className = 'form_checkbox-input';
      inner.replaceWith(input);
    }
    const sync = () => input.classList.toggle('is-checked', input.checked);
    input.addEventListener('change', sync);
    sync();
  });

  // Filter dropdowns are native <details>: keep one open at a time and close on outside click.
  const dropdowns = () => document.querySelectorAll('.filters_dropdown');
  document.addEventListener(
    'toggle',
    (e) => {
      const opened = e.target;
      if (!opened.matches || !opened.matches('.filters_dropdown') || !opened.open) return;
      dropdowns().forEach((d) => d !== opened && d.removeAttribute('open'));
    },
    true,
  );
  document.addEventListener('click', (e) => {
    if (e.target.closest('.filters_dropdown')) return;
    dropdowns().forEach((d) => d.removeAttribute('open'));
  });

  // Dropdown search and keyboard use. Longer option lists get a search box that is
  // focused as the dropdown opens: typing narrows the options, Enter (or Space once
  // the text no longer continues any option) ticks the top match, Arrow keys or Tab
  // move through the options, Enter/Space tick the focused one, Escape closes.
  // Function declarations (not const arrows) so the Suppliers filter, which runs
  // earlier in this file, can build its dropdown with them.
  const canHover = window.matchMedia('(hover: hover)').matches;
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
      row.style.display = !search || row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
    const empty = dropdown.querySelector('.filters_dropdown-empty');
    if (empty) empty.style.display = shownRows(dropdown).length ? 'none' : '';
    highlightTop(dropdown, Boolean(search));
  }

  function closeDropdown(dropdown) {
    dropdown.removeAttribute('open');
    dropdown.querySelector('summary')?.focus();
  }

  // Each dropdown gets a head row: search box (longer lists) plus a "Clear" button
  // that appears once something in that dropdown is ticked and unticks just those.
  function addDropdownHead(dropdown) {
    const list = dropdown.querySelector('.filters_dropdown-list');
    if (!list || list.querySelector('.filters_dropdown-head')) return;
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
    if (!head || rowsOf(dropdown).length < 7 || list.querySelector('.filters_dropdown-search')) return;
    const name = dropdown.querySelector('summary')?.textContent.trim() || 'options';

    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'filters_dropdown-search';
    search.placeholder = `Search ${name.toLowerCase()}`;
    search.autocomplete = 'off';
    search.setAttribute('aria-label', `Search ${name}`);
    // Keep the box out of the filter form: Finsweet reads form.elements and listens on the form.
    search.setAttribute('form', 'filters-dropdown-search');
    ['input', 'change', 'keydown', 'keyup'].forEach((type) =>
      search.addEventListener(type, (e) => e.stopPropagation()),
    );

    const empty = document.createElement('div');
    empty.className = 'filters_dropdown-empty';
    empty.textContent = 'No matches';
    empty.style.display = 'none';

    head.prepend(search);
    list.append(empty);

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

  document.querySelectorAll('.filters_dropdown').forEach(addDropdownSearch);
  // Short lists (no search box): the Clear button floats at the top right of the
  // list instead of adding a row, so nothing jumps when it appears.
  document.querySelectorAll('.filters_dropdown-head').forEach((head) => {
    if (head.querySelector('.filters_dropdown-search')) return;
    head.style.cssText = 'position:absolute;top:0.5rem;right:0.5rem;margin:0;background:none;box-shadow:none;z-index:2;';
    // In the mobile drawer the list is static; anchor the button to the list itself.
    const list = head.parentElement;
    if (list && getComputedStyle(list).position === 'static') list.style.position = 'relative';
    const clear = head.querySelector('.filters_dropdown-clear');
    if (clear) clear.style.height = '2rem';
  });

  // Lenis smooth scroll swallows wheel events; let the dropdown lists and the
  // mobile drawer scroll natively.
  document.querySelectorAll('.filters_dropdown-list, .filters_bar').forEach((el) => el.setAttribute('data-lenis-prevent', ''));

  document.addEventListener('toggle', (e) => {
    const dropdown = e.target;
    if (!dropdown.matches || !dropdown.matches('.filters_dropdown')) return;
    const search = dropdown.querySelector('.filters_dropdown-search');
    if (!search) return;
    if (dropdown.open) {
      if (canHover) search.focus();
    } else if (search.value) {
      search.value = '';
      filterRows(dropdown, '');
    }
  }, true);

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
  const updateFilterCount = () => {
    if (!drawer) return;
    drawer.querySelectorAll('.filters_dropdown').forEach((dropdown) => {
      const summary = dropdown.querySelector('summary');
      if (!summary) return;
      const n = dropdown.querySelectorAll('input[type="checkbox"]:checked').length;
      // The count sits over the chevron so the toggle never changes width.
      const icon = summary.querySelector('.icon_svg');
      let badge = summary.querySelector('.filters_dropdown-count');
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
      summary.classList.toggle('is-active', n > 0);
      const clear = dropdown.querySelector('.filters_dropdown-clear');
      if (clear) clear.style.display = n ? '' : 'none';
      const head = dropdown.querySelector('.filters_dropdown-head');
      if (head && !head.querySelector('.filters_dropdown-search')) head.style.display = n ? '' : 'none';
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
    [50, 250, 600].forEach((delay) => setTimeout(updateFilterCount, delay));
  });
  // Finsweet applies filters from the URL after load without firing change events.
  window.addEventListener('load', () => {
    updateFilterCount();
    setTimeout(updateFilterCount, 600);
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
        const meta = item.querySelector('.product-card_meta')?.textContent.trim().toLowerCase();
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
  if (navTop || navContainer) {
    let compact = null;
    const onScroll = () => {
      const next = window.scrollY > 40;
      if (next === compact) return;
      compact = next;
      navTop?.classList.toggle('is-collapsed', next);
      navContainer?.classList.toggle('is-compact', next);
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

    // The product being asked about, shown under the enquiry intro (classes styled in Webflow).
    const enquiryText = enquirySection?.querySelector('.cta_text');
    if (enquiryText && !enquirySection.querySelector('.product-enquiry_product')) {
      const chip = document.createElement('div');
      chip.className = 'product-enquiry_product';
      chip.innerHTML = '<img class="product-enquiry_product-image" alt=""><div><div class="product-enquiry_product-name"></div><div class="product-enquiry_product-sku"></div></div>';
      const chipImg = chip.querySelector('img');
      if (product.image) chipImg.src = product.image;
      else chipImg.remove();
      chip.querySelector('.product-enquiry_product-name').textContent = product.name;
      chip.querySelector('.product-enquiry_product-sku').textContent = [product.brand, product.sku && `SKU ${product.sku}`].filter(Boolean).join(' · ');
      enquiryText.after(chip);
    }

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

  // Product card markup matching the CMS cards, in a list item so it gets a heart.
  function productCard(p) {
    const item = document.createElement('div');
    item.className = 'product_item';
    const card = document.createElement('a');
    card.className = 'product-card w-inline-block';
    card.href = p.url;
    if (p.sku) card.dataset.sku = p.sku;
    card.innerHTML =
      '<div class="product-card_image-wrap"><img class="product-card_image" loading="lazy" alt=""></div>' +
      '<div class="product-card_text"><div class="product-card_meta product-recent_brand"></div><div class="product-card_name"></div></div>';
    const img = card.querySelector('img');
    if (p.image) {
      img.src = p.image;
      img.alt = p.name;
    } else img.remove();
    card.querySelector('.product-card_meta').textContent = p.brand;
    card.querySelector('.product-card_name').textContent = p.name;
    item.append(card, makeHeart(p.url));
    return item;
  }
  function fillList(list, items) {
    list.replaceChildren(...items.map(productCard));
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

  // /favourites lists every favourite (with a spreadsheet download) and ends with a
  // Recently viewed strip; /recently-viewed lists everything viewed and ends with a
  // Favourites strip (the only place that strip appears). Product, Home, Products and
  // brand pages get a Recently viewed strip above the closing call to action.
  // Strips are sliders: 4 at a time (3 tablet, 2 mobile), arrows, and "View all".
  const path = location.pathname.replace(/\/$/, '') || '/';
  const isFavPage = path === '/favourites' && !document.querySelector('._404_wrapper');
  const isRecentPage = path === '/recently-viewed' && !document.querySelector('._404_wrapper');
  const CHEVRON = (d) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

  // A strip section whose items come from getItems(); refresh() re-renders it and
  // hides it when empty.
  function makeStrip(section, list, getItems, viewAll) {
    list.classList.add('recent_track');
    const controls = document.createElement('div');
    controls.className = 'recent_controls';
    controls.innerHTML =
      `<button type="button" class="recent_arrow" data-dir="-1" aria-label="Previous products">${CHEVRON('m15 18-6-6 6-6')}</button>` +
      `<button type="button" class="recent_arrow" data-dir="1" aria-label="Next products">${CHEVRON('m9 18 6-6-6-6')}</button>`;
    controls.appendChild(viewAllLink(viewAll, 'View all'));
    section.querySelector('.heading_row')?.appendChild(controls);
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
  // Content goes after the page title (or first in main).
  function placeAfterTitle(...sections) {
    const main = document.querySelector('main') || document.body;
    const title = main.querySelector('.section_page-title');
    if (title) title.after(...sections);
    else main.prepend(...sections);
  }
  const recentOthers = () => readRecent().filter((p) => p.url !== path);
  const refreshers = [];

  if (isFavPage) {
    // The page title names the page, so the list itself has no heading of its own.
    const favSection = productSection('section_favourites', '');
    favSection.querySelector('h2').remove();
    const actions = document.createElement('div');
    actions.className = 'button-group';
    actions.appendChild(makeDownloadMenu());
    favSection.querySelector('.heading_row').appendChild(actions);
    const favList = favSection.querySelector('.product_list');
    const favEmpty = document.createElement('div');
    favEmpty.className = 'fav-page_empty';
    favEmpty.innerHTML =
      '<p>No favourites yet. Tap the heart on any product to save it here.</p><div class="button-group" style="justify-content:center"><a href="/products" class="button w-inline-block"><div>Browse products</div></a></div>';
    favList.after(favEmpty);
    placeAfterTitle(favSection);
    refreshers.push(() => {
      const n = favourites.length;
      fillList(favList, favourites);
      favList.style.display = n ? '' : 'none';
      favEmpty.style.display = n ? 'none' : '';
      actions.style.display = n ? '' : 'none';
      favSection.querySelector('.heading_text p').textContent = n ? `${n} saved product${n === 1 ? '' : 's'}, stored on this device.` : '';
    });
    refreshers.push(stripSection('Recently viewed', recentOthers, '/recently-viewed'));

  } else if (isRecentPage) {
    const recentSection = productSection('section_recent', '');
    recentSection.querySelector('h2').remove();
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'fav-page_clear';
    clear.textContent = 'Clear history';
    recentSection.querySelector('.heading_row').appendChild(clear);
    const recentList = recentSection.querySelector('.product_list');
    const recentEmpty = document.createElement('div');
    recentEmpty.className = 'fav-page_empty';
    recentEmpty.innerHTML =
      "<p>Nothing here yet. Products you look at will show up here.</p><div class=\"button-group\" style=\"justify-content:center\"><a href=\"/products\" class=\"button w-inline-block\"><div>Browse products</div></a></div>";
    recentList.after(recentEmpty);
    placeAfterTitle(recentSection);
    refreshers.push(() => {
      const items = readRecent();
      fillList(recentList, items);
      recentList.style.display = items.length ? '' : 'none';
      recentEmpty.style.display = items.length ? 'none' : '';
      clear.style.display = items.length ? '' : 'none';
      recentSection.querySelector('.heading_text p').textContent = items.length ? `The last ${items.length} product${items.length === 1 ? '' : 's'} you looked at, on this device.` : '';
    });
    refreshers.push(stripSection('Your favourites', () => favourites, '/favourites'));
    clear.addEventListener('click', () => {
      try {
        localStorage.removeItem(RECENT_KEY);
      } catch (error) {
        // Nothing to clear if storage is blocked.
      }
      refreshers.forEach((fn) => fn());
    });
  } else {
    const nativeRecent = document.querySelector('.section_product-recent');
    const list = nativeRecent?.querySelector('.product-recent_list');
    if (nativeRecent && list) refreshers.push(makeStrip(nativeRecent, list, recentOthers, '/recently-viewed'));
    else if (path === '/' || path === '/products' || path.startsWith('/brands/')) {
      refreshers.push(stripSection('Recently viewed', recentOthers, '/recently-viewed'));
    }
  }
  refreshers.forEach((fn) => fn());
  // On the two list pages, hearts toggled here (or in another tab) re-render the lists.
  // Elsewhere the hearts just repaint, so a slider keeps its scroll position.
  if (isFavPage || isRecentPage) onFavouritesChange = () => refreshers.forEach((fn) => fn());
  window.addEventListener('storage', (e) => e.key === RECENT_KEY && refreshers.forEach((fn) => fn()));
})();
