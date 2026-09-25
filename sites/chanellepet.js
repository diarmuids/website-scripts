// Last updated: 2026-09-25 15:23:42

// Chanelle Pet site script. Loaded in the site footer before Finsweet Attributes,
// so anything that must exist before the List solution starts runs at top level.

(function () {
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

  fixItemLinks();
  addOfferBadges();
  // Finsweet load-more renders new items later; fix those as they appear.
  new MutationObserver(() => {
    fixItemLinks();
    addOfferBadges();
  }).observe(document.documentElement, { childList: true, subtree: true });

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

  if (document.querySelector('[fs-list-element="list"]')) {
    flattenCheckboxes();
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
  const SEARCH_MIN_OPTIONS = 7;
  const rowsOf = (dropdown) => [...dropdown.querySelectorAll('.filters_checkbox')];
  const shownRows = (dropdown) => rowsOf(dropdown).filter((row) => row.style.display !== 'none');
  const canHover = window.matchMedia('(hover: hover)').matches;

  const highlightTop = (dropdown, on) => {
    rowsOf(dropdown).forEach((row) => row.classList.remove('is-active'));
    if (on) shownRows(dropdown)[0]?.classList.add('is-active');
  };

  const filterRows = (dropdown, term) => {
    const search = term.trim().toLowerCase();
    rowsOf(dropdown).forEach((row) => {
      row.style.display = !search || row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
    const empty = dropdown.querySelector('.filters_dropdown-empty');
    if (empty) empty.style.display = shownRows(dropdown).length ? 'none' : '';
    highlightTop(dropdown, Boolean(search));
  };

  const closeDropdown = (dropdown) => {
    dropdown.removeAttribute('open');
    dropdown.querySelector('summary')?.focus();
  };

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
    if (!head || rowsOf(dropdown).length < SEARCH_MIN_OPTIONS || list.querySelector('.filters_dropdown-search')) return;
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
