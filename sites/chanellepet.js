// Last updated: 2026-09-25 11:32:48

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

  // Product template exposes the current product on [data-product-current].
  const current = document.querySelector('[data-product-current]');
  if (current) {
    const product = {
      url: location.pathname,
      name: current.getAttribute('data-name') || document.title,
      brand: current.getAttribute('data-brand') || '',
      sku: current.getAttribute('data-sku') || '',
      image: current.getAttribute('data-image') || '',
    };
    const list = readRecent().filter((p) => p.url !== product.url);
    const recentWrap = document.querySelector('[data-recent-list]');
    if (recentWrap) renderRecent(recentWrap, list.slice(0, RECENT_MAX));
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify([product, ...list].slice(0, RECENT_MAX + 1)));
    } catch (error) {
      // Storage can be blocked; the section simply stays hidden.
    }
  }

  // Clones the first card in [data-recent-list] as a template for each stored product.
  function renderRecent(wrap, items) {
    const section = wrap.closest('[data-recent-section]');
    const template = wrap.querySelector('[data-recent-item]');
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
      set('[data-recent-name]', p.name);
      set('[data-recent-brand]', p.brand);
      set('[data-recent-sku]', p.sku);
      wrap.appendChild(card);
    });
  }
})();
