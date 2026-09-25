// Last updated: 2026-09-25 12:21:41

// Chanelle Pet site script. Loaded in the site footer before Finsweet Attributes,
// so anything that must exist before the List solution starts runs at top level.

(function () {
  const SEARCH_FIELD = 'name, brandname, sku';
  const RECENT_KEY = 'chanellePetRecentlyViewed';
  const RECENT_MAX = 6;

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
    set('.filters_search-input', {
      'fs-list-field': SEARCH_FIELD,
      'fs-list-debounce': '200',
      'fs-list-tagfield': 'Search',
    });
    set('.filters_tag', { 'fs-list-element': 'tag' });
    set('.filters_tag > span:first-child', { 'fs-list-element': 'tag-value' });

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
      featured: (v) => (v === 'true' ? ['featured_equal', 'true'] : null),
      search: (v) => [`${SEARCH_FIELD}_contain`, v],
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

  if (document.querySelector('[fs-list-element="list"]')) {
    addFilterAttributes();
    rewriteFilterParams();
  }

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

    // "Ask about this product" links to #product-enquiry (the API could not set this id).
    const enquirySection = document.querySelector('.section_product-enquiry');
    if (enquirySection && !enquirySection.id) enquirySection.id = 'product-enquiry';

    // Pre-fill the enquiry form with the product being viewed.
    const message = document.querySelector('.product-enquiry_card textarea');
    if (message && !message.value) {
      message.value = `I'd like to ask about ${product.name}${product.sku ? ` (${product.sku})` : ''}.`;
    }
    const skuInput = document.querySelector('.product-enquiry_card input[name="SKU"]');
    if (skuInput) skuInput.value = product.sku;

    const list = readRecent().filter((p) => p.url !== product.url);
    const recentWrap = document.querySelector('.product-recent_list');
    if (recentWrap) renderRecent(recentWrap, list.slice(0, RECENT_MAX));
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([product, ...list].slice(0, RECENT_MAX + 1)));
    } catch (error) {
      // Storage can be blocked; the section simply stays hidden.
    }
  }

  // Clones the first card in .product-recent_list as a template for each stored product.
  function renderRecent(wrap, items) {
    const section = wrap.closest('.section_product-recent');
    const template = wrap.querySelector('.product-recent_item');
    if (!items.length || !template) {
      if (section) section.style.display = 'none';
      return;
    }
    template.remove();
    items.forEach((p) => {
      const card = template.cloneNode(true);
      const link = card.matches('a') ? card : card.querySelector('a');
      if (link) link.href = p.url;
      const img = card.querySelector('img');
      if (img) {
        img.src = p.image;
        img.removeAttribute('srcset');
        img.alt = p.name;
      }
      const set = (sel, text) => card.querySelectorAll(sel).forEach((el) => (el.textContent = text));
      set('.product-recent_name', p.name);
      set('.product-recent_brand', p.brand);
      wrap.appendChild(card);
    });
  }
})();
