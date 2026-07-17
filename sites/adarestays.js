(function () {
  const PRICE_MAX = 100000;
  const DISTANCE_MAX = 200;
  const INFINITY_VALUE = 1000000000;

  const TAG_LABELS = {
    'price|greater-equal': 'Min Price',
    'price|less-equal': 'Max Price',
    'distance|greater-equal': 'Min Dist',
    'distance|less-equal': 'Max Dist',
    'sleeps|greater-equal': 'Sleeps',
  };

  const fmt = (n) => Math.round(n).toLocaleString('en-IE');

  function formatPrice(n) {
    n = Math.round(n);
    if (n >= 1000000) {
      const m = n / 1000000;
      return (m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)) + 'M';
    }
    if (n >= 1000) {
      const k = n / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)) + 'k';
    }
    return n.toString();
  }

  function reserveTagValueWidth(valueEl, text) {
    const width = `calc(${text.length}ch + 6px)`;
    valueEl.style.display = 'inline-block';
    valueEl.style.minWidth = width;
  }

  let observer = null;
  const openedDefaultFilterTitles = new Set();
  const FILTER_STATE_STORAGE_KEY = 'ryderCupFilterBlockStates';
  const FILTER_STATE_TTL_MS = 60 * 60 * 1000;

  function getSavedFilterStates() {
    try {
      const saved = JSON.parse(localStorage.getItem(FILTER_STATE_STORAGE_KEY));
      if (!saved || saved.expiresAt <= Date.now() || !saved.states) {
        localStorage.removeItem(FILTER_STATE_STORAGE_KEY);
        return {};
      }
      return saved.states;
    } catch (error) {
      return {};
    }
  }

  function saveFilterState(title, isOpen) {
    const states = getSavedFilterStates();
    states[title] = isOpen;
    try {
      localStorage.setItem(FILTER_STATE_STORAGE_KEY, JSON.stringify({
        expiresAt: Date.now() + FILTER_STATE_TTL_MS,
        states
      }));
    } catch (error) {
      // Ignore storage failures so filtering keeps working in restricted browsers.
    }
  }

  function formatSliderDisplays() {
    document.querySelectorAll('[fs-rangeslider-element="wrapper"]').forEach((wrapper) => {
      const max = parseFloat(wrapper.getAttribute('fs-rangeslider-max'));
      wrapper.querySelectorAll('[fs-rangeslider-element="display-value"]').forEach((el) => {
        const raw = parseFloat(el.textContent.replace(/[^\d.-]/g, ''));
        if (isNaN(raw)) return;
        const formatted = raw >= max ? fmt(max) + '+' : fmt(raw);
        if (el.textContent !== formatted) el.textContent = formatted;
      });
    });
  }

  function getOperatorFromTag(tag) {
    const opEl = tag.querySelector('[fs-list-element="tag-operator"]');
    if (!opEl) return null;
    const op = opEl.textContent.trim();
    if (op === '\u2265' || op === '>=') return 'greater-equal';
    if (op === '\u2264' || op === '<=') return 'less-equal';
    if (op === '>') return 'greater';
    if (op === '<') return 'less';
    if (op === '=') return 'equal';
    return null;
  }

  // Find the true numeric value by matching the tag to a hidden input
  function getTrueValueForTag(field, operator) {
    const inputs = document.querySelectorAll(
      `input[fs-list-field="${field}"][fs-list-operator="${operator}"]`
    );
    for (const input of inputs) {
      const v = parseFloat(input.value);
      if (!isNaN(v)) return v;
    }
    return null;
  }

  function formatTagValues() {
    document.querySelectorAll('[fs-list-element="tag"]').forEach((tag) => {
      const fieldEl = tag.querySelector('[fs-list-element="tag-field"]');
      const valueEl = tag.querySelector('[fs-list-element="tag-value"]');
      if (!fieldEl || !valueEl) return;

      // Stash original field name once
      let field = tag.dataset.originalField;
      if (!field) {
        const rawField = fieldEl.textContent.trim().toLowerCase();
        if (rawField === 'price' || rawField === 'distance' || rawField === 'sleeps') {
          tag.dataset.originalField = rawField;
        }
        field = rawField;
      }

      const operator = getOperatorFromTag(tag);

      // Get the TRUE value from the hidden input, not from the (possibly formatted) tag text
      let raw = null;
      if (operator && (field === 'price' || field === 'distance' || field === 'sleeps')) {
        raw = getTrueValueForTag(field, operator);
      }
      // Fallback: parse from text if we couldn't find the input
      if (raw === null) {
        raw = parseFloat(valueEl.textContent.replace(/[^\d.-]/g, ''));
      }
      if (isNaN(raw) || raw === null) return;

      // Relabel the field
      if (operator) {
        const newLabel = TAG_LABELS[`${field}|${operator}`];
        if (newLabel && fieldEl.textContent !== newLabel) {
          fieldEl.textContent = newLabel;
        }
      }

      // Format the value
      let formatted;
      if (field === 'price') {
        if (raw >= INFINITY_VALUE || raw >= PRICE_MAX) {
          formatted = '\u20ac' + formatPrice(PRICE_MAX) + '+';
        } else {
          formatted = '\u20ac' + formatPrice(raw);
        }
      } else if (field === 'distance') {
        if (raw >= INFINITY_VALUE || raw >= DISTANCE_MAX) {
          formatted = fmt(DISTANCE_MAX) + 'km+';
        } else {
          formatted = fmt(raw) + 'km';
        }
      } else if (field === 'sleeps') {
        formatted = fmt(raw) + (operator === 'greater-equal' ? '+' : '');
      } else {
        formatted = fmt(raw);
      }

      reserveTagValueWidth(valueEl, formatted);
      if (valueEl.textContent !== formatted) valueEl.textContent = formatted;
    });
  }

  function patchMaxInputs() {
    // Disabled: changing Finsweet filter inputs during init can stop filters reading correctly.
  }

  function formatListPrices() {
    // Disabled: Finsweet must collect the raw price field before any display formatting.
  }

  function isFilterListOpen(list) {
    if (!list) return false;
    const inlineHeight = list.style.height;
    if (inlineHeight && inlineHeight !== '0px') return true;
    return list.offsetHeight > 1;
  }

  function getFilterBlockParts(block) {
    const title = block.querySelector('.filter_block_title');
    const header = block.querySelector('.filter_block_header');
    const list = block.querySelector('.filter_list');
    if (!title || !header || !list) return null;

    return {
      titleText: title.textContent.trim().toLowerCase(),
      header,
      list
    };
  }

  function clickFilterHeader(header) {
    header.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    if (document.activeElement && header.contains(document.activeElement)) {
      document.activeElement.blur();
    }
  }

  function initFilterBlockStatePersistence() {
    document.querySelectorAll('.filter_block').forEach((block) => {
      const parts = getFilterBlockParts(block);
      if (!parts || block.dataset.filterStateReady === 'true') return;

      block.dataset.filterStateReady = 'true';
      parts.header.addEventListener('click', () => {
        [100, 300, 600].forEach((delay) => {
          setTimeout(() => saveFilterState(parts.titleText, isFilterListOpen(parts
            .list)), delay);
        });
      });
    });
  }

  function restoreFilterBlockStates() {
    const states = getSavedFilterStates();
    document.querySelectorAll('.filter_block').forEach((block) => {
      const parts = getFilterBlockParts(block);
      if (!parts || !(parts.titleText in states)) return;
      if (isFilterListOpen(parts.list) === Boolean(states[parts.titleText])) return;

      clickFilterHeader(parts.header);
    });
  }

  function openDefaultFilterBlocks() {
    const savedStates = getSavedFilterStates();
    const defaultTitles = ['price', 'distance'];
    document.querySelectorAll('.filter_block').forEach((block) => {
      const parts = getFilterBlockParts(block);
      if (!parts) return;
      const { titleText, header, list } = parts;
      if (!defaultTitles.includes(titleText)) return;
      if (titleText in savedStates) return;
      if (openedDefaultFilterTitles.has(titleText)) return;
      if (isFilterListOpen(list)) {
        openedDefaultFilterTitles.add(titleText);
        return;
      }

      clickFilterHeader(header);
      setTimeout(() => {
        if (isFilterListOpen(list)) openedDefaultFilterTitles.add(titleText);
      }, 100);
      setTimeout(() => {
        if (isFilterListOpen(list)) openedDefaultFilterTitles.add(titleText);
      }, 300);
    });
  }

  function getNumberButtonInput(button) {
    const wrapper = button.parentElement;
    if (!wrapper) return null;
    return wrapper.querySelector('input[type="number"]');
  }

  function getInputNumberStep(input) {
    const step = parseFloat(input.getAttribute('step'));
    return isNaN(step) || step <= 0 ? 1 : step;
  }

  function updateNumberInput(input, direction) {
    const step = getInputNumberStep(input);
    const min = parseFloat(input.getAttribute('min'));
    const max = parseFloat(input.getAttribute('max'));
    const current = parseFloat(input.value);
    let next = (isNaN(current) ? 0 : current) + (direction * step);

    if (!isNaN(min)) next = Math.max(next, min);
    if (!isNaN(max)) next = Math.min(next, max);

    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function initInputNumberButtons() {
    document.querySelectorAll('[input-number-button]').forEach((button) => {
      if (button.dataset.inputNumberReady === 'true') return;

      const type = (button.getAttribute('input-number-button') || '').toLowerCase();
      const direction = type === 'plus' ? 1 : type === 'minus' ? -1 : 0;
      const input = getNumberButtonInput(button);
      if (!direction || !input) return;

      button.dataset.inputNumberReady = 'true';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', button.getAttribute('tabindex') || '0');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        updateNumberInput(input, direction);
      });
      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        updateNumberInput(input, direction);
      });
    });
  }

  function runAll() {
    if (observer) observer.disconnect();
    formatSliderDisplays();
    formatTagValues();
    patchMaxInputs();
    formatListPrices();
    if (observer) {
      observer.observe(
        document.querySelector('.filter_form') || document.body, {
        childList: true,
        characterData: true,
        subtree: true
      }
      );
    }
  }

  const target = document.querySelector('.filter_form') || document.body;
  observer = new MutationObserver(runAll);
  observer.observe(target, { childList: true, characterData: true, subtree: true });

  runAll();
  setTimeout(runAll, 300);
  setTimeout(runAll, 1000);

  initFilterBlockStatePersistence();
  initInputNumberButtons();
  restoreFilterBlockStates();
  openDefaultFilterBlocks();
  [300, 1000, 2000].forEach((delay) => {
    setTimeout(initFilterBlockStatePersistence, delay);
    setTimeout(initInputNumberButtons, delay);
    setTimeout(restoreFilterBlockStates, delay);
    setTimeout(openDefaultFilterBlocks, delay);
  });

  // ----- Sort dropdown label -----
  function initSortDropdown() {
    const dropdown = document.querySelector('[fs-list-element="sort-trigger"]');
    if (!dropdown || dropdown.dataset.defaultSortReady === 'true') return Boolean(dropdown);

    const label = dropdown.querySelector('[fs-list-element="dropdown-label"]');
    const sortLinks = dropdown.querySelectorAll('[fs-list-field]');
    const defaultSortLink = dropdown.querySelector('[fs-list-field="date-added-desc"]');
    if (!label || !sortLinks.length || !defaultSortLink) return false;

    dropdown.dataset.defaultSortReady = 'true';

    const defaultText = defaultSortLink.textContent.trim() || 'Date Added Desc';
    const searchParams = new URLSearchParams(window.location.search);
    const sortFromUrl = Array.from(searchParams.entries()).reduce((match, entry) => {
      if (match) return match;

      const key = entry[0].toLowerCase();
      const value = entry[1].toLowerCase();
      const field = key.replace(/^sort[_-]/, '');
      if (field === key || !field || !value) return null;

      const direction = value === 'desc' || value === 'descending' ? 'desc' : 'asc';
      return `${field}-${direction}`;
    }, null);
    const sortFromUrlLink = sortFromUrl ? dropdown.querySelector(
      `[fs-list-field="${sortFromUrl}"]`) : null;
    const hasSortInUrl = Boolean(sortFromUrl);
    if (sortFromUrlLink) {
      const text = sortFromUrlLink.textContent.trim();
      if (text) label.textContent = text;
    }
    let applyingDefault = false;
    let userSelectedSort = hasSortInUrl;

    const blurDropdown = () => {
      const active = document.activeElement;
      if (active && dropdown.contains(active) && typeof active.blur === 'function') {
        active.blur();
      }
    };

    const dispatchSortClick = () => {
      defaultSortLink.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      blurDropdown();
      requestAnimationFrame(blurDropdown);
      setTimeout(blurDropdown, 50);
    };

    const applyDefaultSort = () => {
      applyingDefault = true;
      label.textContent = defaultText;
      dispatchSortClick();
      applyingDefault = false;
    };

    sortLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (!applyingDefault) userSelectedSort = true;
        const text = link.textContent.trim();
        if (text) label.textContent = text;
      });
    });

    document.querySelectorAll('[fs-list-element="clear"]').forEach((clearBtn) => {
      clearBtn.addEventListener('click', () => {
        userSelectedSort = false;
        setTimeout(applyDefaultSort, 100);
      });
    });

    if (!hasSortInUrl) {
      [0, 300, 1000, 2000].forEach((delay) => {
        setTimeout(() => {
          if (!userSelectedSort) {
            applyDefaultSort();
          }
        }, delay);
      });
    }

    return true;
  }

  initSortDropdown();
  [300, 1000, 2000].forEach((delay) => setTimeout(initSortDropdown, delay));
})();
