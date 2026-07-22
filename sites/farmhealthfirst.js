// Last updated: 2026-07-22 10:21:02

// DOSING LINKS
$(function () {
  const dosingSections = [];

  $('.dosing_link-num').each(function () {
    const $num = $(this);
    const slug = $.trim($num.attr('link-slug') || '');

    if (!slug) return;

    // $num.text(String($num.text()).padStart(2, '0'));
    const $link = $num.closest('a');
    const target = document.getElementById(slug);

    $link.attr('href', '#' + slug);

    if ($link.length && target) {
      dosingSections.push({ link: $link[0], target: target });
    }
  });

  let scrollFrame = null;

  function updateCurrentDosingLink() {
    scrollFrame = null;

    const marker = window.innerHeight * 0.3;
    let currentIndex = -1;

    dosingSections.forEach(function (section, index) {
      if (section.target.getBoundingClientRect().top <= marker) {
        currentIndex = index;
      }
    });

    dosingSections.forEach(function (section, index) {
      section.link.classList.toggle('is-current', index === currentIndex);
    });
  }

  function requestCurrentDosingLinkUpdate() {
    if (scrollFrame !== null) return;
    scrollFrame = window.requestAnimationFrame(updateCurrentDosingLink);
  }

  window.addEventListener('scroll', requestCurrentDosingLinkUpdate, { passive: true });
  window.addEventListener('resize', requestCurrentDosingLinkUpdate);
  updateCurrentDosingLink();
});

// DISEASE PAGE HEADING LINKS
function initDiseaseHeadingLinks() {
  document.querySelectorAll('.disease_row').forEach(function (row) {
    if (row.dataset.diseaseHeadingLinksReady === 'true') return;

    const sidebar = row.querySelector('.disease_sidebar-inner');
    const richText = row.querySelector('.disease_rich-text');
    const template = sidebar && Array.from(sidebar.querySelectorAll('.disease_sidebar-link'))
      .find(function (link) {
        return link.getAttribute('href') === '#';
      });

    if (!sidebar || !richText || !template) return;

    let headings = [];

    for (let level = 1; level <= 6; level += 1) {
      headings = Array.from(richText.querySelectorAll('h' + level));
      if (headings.length) break;
    }

    if (!headings.length) return;

    const usedIds = new Set(Array.from(document.querySelectorAll('[id]')).map(function (element) {
      return element.id;
    }));
    const sectionLinks = [];

    headings.forEach(function (heading, index) {
      const baseId = heading.textContent.trim().toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section-' + (index + 1);
      let anchorId = baseId;
      let suffix = 2;

      while (usedIds.has(anchorId)) {
        anchorId = baseId + '-' + suffix;
        suffix += 1;
      }

      usedIds.add(anchorId);

      const anchor = document.createElement('div');
      anchor.id = anchorId;
      anchor.className = 'anchor-link is-disease-heading';
      anchor.style.marginTop = '-70px';
      heading.before(anchor);

      const link = template.cloneNode(true);
      link.href = '#' + anchorId;
      const headingText = heading.textContent.trim().toLowerCase();
      const linkText = link.querySelector('.disease_sidebar-link-text');

      if (!linkText) return;

      linkText.textContent = headingText.charAt(0).toUpperCase() + headingText.slice(1);
      sidebar.insertBefore(link, template);
      sectionLinks.push({ heading: heading, link: link });
    });

    template.remove();

    let scrollFrame = null;

    function updateCurrentDiseaseLink() {
      scrollFrame = null;

      const marker = window.innerHeight * 0.3;
      const rowBounds = row.getBoundingClientRect();
      let currentIndex = -1;

      if (rowBounds.top <= marker && rowBounds.bottom > marker) {
        sectionLinks.forEach(function (section, index) {
          if (section.heading.getBoundingClientRect().top <= marker) {
            currentIndex = index;
          }
        });
      }

      sectionLinks.forEach(function (section, index) {
        section.link.classList.toggle('is-current', index === currentIndex);
      });
    }

    function requestCurrentDiseaseLinkUpdate() {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(updateCurrentDiseaseLink);
    }

    window.addEventListener('scroll', requestCurrentDiseaseLinkUpdate, { passive: true });
    window.addEventListener('resize', requestCurrentDiseaseLinkUpdate);
    updateCurrentDiseaseLink();
    row.dataset.diseaseHeadingLinksReady = 'true';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDiseaseHeadingLinks);
} else {
  initDiseaseHeadingLinks();
}

// BLOG POST HEADING LINKS
function initBlogHeadingLinks() {
  document.querySelectorAll('.blog_row').forEach(function (row) {
    if (row.dataset.blogHeadingLinksReady === 'true') return;

    const sidebar = row.querySelector('.blog_sidebar-inner');
    const richText = row.querySelector('.blog_text-rich-text');
    const template = sidebar && Array.from(sidebar.querySelectorAll('.blog_sidebar-link'))
      .find(function (link) {
        return link.getAttribute('href') === '#';
      });

    if (!sidebar || !richText || !template) return;

    let headings = [];

    for (let level = 1; level <= 6; level += 1) {
      headings = Array.from(richText.querySelectorAll('h' + level));
      if (headings.length) break;
    }

    if (!headings.length) return;

    const usedIds = new Set(Array.from(document.querySelectorAll('[id]')).map(function (element) {
      return element.id;
    }));
    const sectionLinks = [];

    headings.forEach(function (heading, index) {
      const headingLabel = heading.textContent.trim();
      const baseId = headingLabel.toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'blog-section-' + (index + 1);
      let anchorId = baseId;
      let suffix = 2;

      while (usedIds.has(anchorId)) {
        anchorId = baseId + '-' + suffix;
        suffix += 1;
      }

      usedIds.add(anchorId);

      const anchor = document.createElement('div');
      anchor.id = anchorId;
      anchor.className = 'anchor-link is-blog-heading';
      anchor.style.marginTop = '-70px';
      heading.before(anchor);

      const link = template.cloneNode(true);
      const sentenceCaseLabel = headingLabel.toLowerCase();
      const linkText = link.querySelector('.blog_sidebar-link-text');

      if (!linkText) return;

      link.href = '#' + anchorId;
      linkText.textContent = sentenceCaseLabel.charAt(0).toUpperCase() + sentenceCaseLabel.slice(1);
      sidebar.insertBefore(link, template);
      sectionLinks.push({ heading: heading, link: link });
    });

    template.remove();

    let scrollFrame = null;

    function updateCurrentBlogLink() {
      scrollFrame = null;

      const marker = window.innerHeight * 0.3;
      const rowBounds = row.getBoundingClientRect();
      let currentIndex = -1;

      if (rowBounds.top <= marker && rowBounds.bottom > marker) {
        sectionLinks.forEach(function (section, index) {
          if (section.heading.getBoundingClientRect().top <= marker) {
            currentIndex = index;
          }
        });
      }

      sectionLinks.forEach(function (section, index) {
        section.link.classList.toggle('is-current', index === currentIndex);
      });
    }

    function requestCurrentBlogLinkUpdate() {
      if (scrollFrame !== null) return;
      scrollFrame = window.requestAnimationFrame(updateCurrentBlogLink);
    }

    window.addEventListener('scroll', requestCurrentBlogLinkUpdate, { passive: true });
    window.addEventListener('resize', requestCurrentBlogLinkUpdate);
    updateCurrentBlogLink();
    row.dataset.blogHeadingLinksReady = 'true';
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBlogHeadingLinks);
} else {
  initBlogHeadingLinks();
}

// RELATED SECTION SIDEBAR LINKS
function initRelatedSectionSidebarLinks() {
  if (document.documentElement.dataset.relatedSectionLinksReady === 'true') return;

  const sections = [
    {
      href: '#related-products',
      section: '.section_related-products',
      item: '.product-slider_item'
    },
    {
      href: '#related-videos',
      section: '.section_related-videos',
      item: '.video-list_item'
    },
    {
      href: '#related-blogs',
      section: '.section_related-blogs',
      item: '.blog-list_item.is-slider'
    }
  ];

  function updateRelatedSectionSidebarLinks() {
    sections.forEach(function (config) {
      const link = document.querySelector(
        '.disease_sidebar-link-section[href="' + config.href + '"]'
      );
      const section = document.querySelector(config.section);

      if (!link) return;

      const hasItems = !!(section && section.querySelector(config.item));

      link.hidden = !hasItems;
      link.style.display = hasItems ? '' : 'none';
    });
  }

  sections.forEach(function (config) {
    const section = document.querySelector(config.section);

    if (section) {
      new MutationObserver(updateRelatedSectionSidebarLinks).observe(section, {
        childList: true,
        subtree: true
      });
    }
  });

  document.documentElement.dataset.relatedSectionLinksReady = 'true';
  updateRelatedSectionSidebarLinks();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRelatedSectionSidebarLinks);
} else {
  initRelatedSectionSidebarLinks();
}

window.addEventListener('load', initRelatedSectionSidebarLinks);

// RICH TEXT IMAGE LIGHTBOXES
$(function () {
  $('.w-richtext').each(function (richTextIndex) {
    const galleryName = 'rich-text-images-' + richTextIndex;
    const $images = $(this).find('figure.w-richtext-figure-type-image img');

    $images.each(function () {
      const $image = $(this);
      const caption = $.trim($image.closest('figure').find('figcaption').first().text());

      $image.attr({
        'data-fancybox': galleryName,
        'data-src': $image.attr('src'),
        'data-caption': caption
      });
    });

    $images.fancybox({
      loop: false,
      arrows: true,
      infobar: false,
      buttons: ['close'],
      animationEffect: 'zoom',
      animationDuration: 500,
      transitionEffect: 'fade',
      transitionDuration: 500,
      clickContent: function (current) {
        return current.type === 'image' ? 'next' : false;
      }
    });
  });
});

// SET FILTER VALUES, OPERATORS, NAMES AND UNIQUE IDS
$('.button.is-filter').each(function (index) {
  const $input = $(this).find('input[type="checkbox"]');
  const field = $input.attr('fs-list-field');
  const value = $.trim($(this).find('.w-form-label').text());
  const id = `${field}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  if (!field) return;

  $input.attr({
    'fs-list-value': value,
    'fs-list-operator': 'contain',
    name: field,
    id: id
  });

  $(this).find('.w-form-label').attr('for', id);
});

// ONLY ALLOW ONE SPECIES AT A TIME
$(document).on(
  'change',
  'input[type="checkbox"][fs-list-field="animal"], input[type="checkbox"][fs-list-field="region"]',
  function () {
    if (!this.checked) return;

    const field = $(this).attr('fs-list-field');

    $(`input[type="checkbox"][fs-list-field="${field}"]`)
      .not(this)
      .filter(':checked')
      .each(function () {
        this.click();
      });
  }
);

// BLOG RELATED LOGIC
document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  const related = document.querySelector(
    '.blog-list_list-wrapper.is-related .blog-list_list');
  const main = document.querySelector(
    '.blog-list_list-wrapper:not(.is-related) .blog-list_list');
  const loadMore = main?.closest('.blog-list_list-wrapper')?.querySelector(
    '.w-pagination-next');

  if (!related || !main) return;

  const pins = [...related.children];
  let visible = Math.max(0, 6 - pins.length);

  pins.forEach(item => {
    item.dataset.pinned = '';
    main.append(item);
  });

  main.prepend(...pins);

  function update() {
    const used = new Set();

    [...main.children].forEach(item => {
      const link = item.querySelector('.blog-list_link');
      const url = link && new URL(link.href, location.origin).pathname;

      if (!url || used.has(url)) item.remove();
      else used.add(url);
    });

    [...main.children]
      .filter(item => !item.hasAttribute('data-pinned'))
      .forEach((item, i) => {
        item.style.display = i < visible ? '' : 'none';
      });
  }

  loadMore?.addEventListener('click', () => {
    visible += 6;
    setTimeout(update, 50);
  });

  new MutationObserver(update).observe(main, { childList: true });
  update();
}, 300));

// VIDEO, PRODUCT AND BLOG SWIPER JS
function initContentSwipers() {
  if (typeof Swiper === 'undefined') return;

  document.querySelectorAll(
    '.video-list_list-wrapper.is-slider, .product-slider_list-wrapper, .blog-list_list-wrapper'
  ).forEach(function (wrapper) {
    if (wrapper.dataset.swiperReady === 'true') return;

    var isProductSlider = wrapper.classList.contains('product-slider_list-wrapper');
    var isBlogSlider = wrapper.classList.contains('blog-list_list-wrapper');
    var listSelector = isProductSlider
      ? '.product-slider_list'
      : isBlogSlider
        ? '.blog-list_list.is-slider'
        : '.video-list_list';
    var itemSelector = isProductSlider
      ? '.product-slider_item'
      : isBlogSlider
        ? '.blog-list_item.is-slider'
        : '.video-list_item';
    var list = wrapper.querySelector(listSelector);
    var items = wrapper.querySelectorAll(itemSelector);
    var section = wrapper.closest('.container-large');
    var prev = section && section.querySelector('[slider-arrow="prev"]');
    var next = section && section.querySelector('[slider-arrow="next"]');

    if (!list || !items.length || !section || !prev || !next) return;

    wrapper.dataset.swiperReady = 'true';

    function getSetup() {
      list.style.gap = '';

      items.forEach(function (item) {
        item.style.width = '';
      });

      var styles = getComputedStyle(list);
      var gap = parseFloat(styles.columnGap || styles.gap) || 0;
      var width = items[0].getBoundingClientRect().width;

      list.style.gap = '0px';

      items.forEach(function (item) {
        item.style.width = width + 'px';
      });

      return {
        gap: gap,
        width: width
      };
    }

    wrapper.classList.add('swiper');
    list.classList.add('swiper-wrapper');

    items.forEach(function (item) {
      item.classList.add('swiper-slide');
      item.style.flex = 'none';
    });

    var setup = getSetup();

    var swiper = new Swiper(wrapper, {
      slidesPerView: 'auto',
      spaceBetween: setup.gap,
      loop: false,
      speed: 500,
      watchOverflow: true,
      navigation: {
        prevEl: prev,
        nextEl: next,
        disabledClass: 'is-disabled'
      },
      observer: true,
      observeParents: true
    });

    window.addEventListener('resize', function () {
      setup = getSetup();
      swiper.params.spaceBetween = setup.gap;
      swiper.update();
      swiper.navigation.update();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentSwipers);
} else {
  initContentSwipers();
}

window.addEventListener('load', initContentSwipers);

// BLOG LEARN MORE BUTTONS
$('.text-rich-text.is-blog-buttons').each(function () {
  const $rich = $(this);
  const $group = $(
    '<div class="button-group is-vertical"></div>');
  $rich.find('a').each(function () {
    const $a = $(this);
    $group.append('<a href="' + $a.attr('href') +
      '" class="button is-tertiary w-inline-block"><div>' + $a.text() +
      '</div><div class="button_icon w-embed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="100%" height="100%" fill="none"><path d="M534.9 278.6l22.6-22.6-22.6-22.6-160-160-22.6-22.6-45.3 45.3c1.3 1.3 44 44 128 128l-402.7 0 0 64 402.7 0c-84 84-126.7 126.7-128 128l45.3 45.3 22.6-22.6 160-160z" fill="currentColor" stroke="currentColor"></path></svg></div></a>'
    )
  });
  $rich.replaceWith($group)
});

// LEARN VIDEO STICKY CARDS
function initLearnVideoStickyCards() {
  const cards = Array.from(document.querySelectorAll('.learn-video_card'));
  const stickyTop = 90;
  const animationLead = 230;
  const overlays = [];
  let ticking = false;

  if (!cards.length) return;

  function update() {
    cards.forEach(function (card, index) {
      if (index === cards.length - 1) {
        card.style.transform = 'scale(1)';
        return;
      }

      const nextCardTop = cards[index + 1].getBoundingClientRect().top;
      const animationStart = stickyTop + animationLead;
      const progress = Math.min(1, Math.max(0,
        (animationStart - nextCardTop) / (animationStart - stickyTop)
      ));
      const easedProgress = progress * progress * (3 - 2 * progress);

      card.style.transform = 'scale(' + (1 - easedProgress * 0.2) + ')';
      overlays[index].style.opacity = String(easedProgress);
    });

    ticking = false;
  }

  cards.slice(0, -1).forEach(function (card) {
    const overlay = document.createElement('div');

    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText =
      'position:absolute;inset:0;z-index:999;pointer-events:none;' +
      'border-radius:inherit;background:rgba(17,17,17,0.25);opacity:0;';
    card.appendChild(overlay);
    overlays.push(overlay);

    card.style.transformOrigin = 'center top';
    card.style.willChange = 'transform';
  });

  window.addEventListener('scroll', function () {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLearnVideoStickyCards);
} else {
  initLearnVideoStickyCards();
}

// LEARN VIDEO EMAIL GATE
(function () {
  const storageKey = 'fhfLearnVideoEmail';
  const pendingVideoKey = 'fhfPendingLearnVideoUrl';
  const pendingVideoIndexKey = 'fhfPendingLearnVideoIndex';
  const cardSelector = '.learn-video_card[data-video-url]';
  const triggerSelector =
    `${cardSelector} .button, ${cardSelector} .learn-video_image-wrapper`;
  const formSelector = '.learn_email-gate-popup form, .learn-video_email-gate-popup form';
  const emailSelector = 'input[type="email"], input[name="EMAIL"]';
  const successSelector = '.w-form-done';
  const failSelector = '.w-form-fail';
  const popupSelector = '.learn_email-gate-popup, .learn-video_email-gate-popup';
  const videoPositionPrefix = 'fhfVideoPosition:';
  const videoPositionTtl = 12 * 60 * 60 * 1000;
  let openedAfterSuccess = false;
  let videoTrackingTimer = null;
  const lastSavedPositions = {};

  function debug(message, data) {
    if (data === undefined) {
      console.log('[FHF video gate]', message);
      return;
    }

    console.log('[FHF video gate]', message, data);
  }

  function getStoredEmail() {
    try {
      return localStorage.getItem(storageKey) || '';
    } catch (error) {
      const match = document.cookie.match(
        new RegExp('(?:^|; )' + storageKey + '=([^;]*)')
      );

      return match ? decodeURIComponent(match[1]) : '';
    }
  }

  function storeEmail(email) {
    try {
      localStorage.setItem(storageKey, email);
    } catch (error) {
      document.cookie = storageKey + '=' + encodeURIComponent(email) +
        '; max-age=315360000; path=/; SameSite=Lax';
    }
  }

  function getPendingVideoUrl() {
    try {
      return sessionStorage.getItem(pendingVideoKey) || '';
    } catch (error) {
      return window[pendingVideoKey] || '';
    }
  }

  function setPendingVideoUrl(url, index) {
    try {
      sessionStorage.setItem(pendingVideoKey, url);
      sessionStorage.setItem(pendingVideoIndexKey, String(index));
    } catch (error) {
      window[pendingVideoKey] = url;
      window[pendingVideoIndexKey] = index;
    }

    debug('pending video set', url);
  }

  function clearPendingVideoUrl() {
    try {
      sessionStorage.removeItem(pendingVideoKey);
      sessionStorage.removeItem(pendingVideoIndexKey);
    } catch (error) {
      window[pendingVideoKey] = '';
      window[pendingVideoIndexKey] = '';
    }

    debug('pending video cleared');
  }

  function getVideoItems() {
    return Array.from(document.querySelectorAll(cardSelector)).map(function (card) {
      const title = card.querySelector('.heading-style-h3, h3');

      return {
        src: toVideoEmbedUrl(card.getAttribute('data-video-url')),
        type: 'iframe',
        opts: {
          caption: title ? title.textContent.trim() : ''
        }
      };
    }).filter(function (item) {
      return !!item.src;
    });
  }

  function hideEmailPopup(form) {
    const popup = (form && form.closest(popupSelector)) ||
      document.querySelector(popupSelector);

    if (!popup) return;

    if (window.jQuery) jQuery(popup).stop(true, true).hide();

    popup.style.setProperty('display', 'none', 'important');
    popup.style.opacity = '0';
    popup.setAttribute('aria-hidden', 'true');
    debug('email popup hidden');
  }

  function getPendingVideoIndex() {
    try {
      const value = sessionStorage.getItem(pendingVideoIndexKey);
      return value === null ? -1 : Number(value);
    } catch (error) {
      return Number(window[pendingVideoIndexKey] ?? -1);
    }
  }

  function getYouTubeVideoId(url) {
    try {
      const parsed = new URL(url, window.location.href);
      const host = parsed.hostname.replace(/^www\./, '');

      if (host === 'youtu.be') return parsed.pathname.slice(1).split('/')[0] || '';
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v') || '';
      if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] || '';
      }
    } catch (error) {
      return '';
    }

    return '';
  }

  function getSavedVideoPosition(videoId) {
    if (!videoId) return 0;

    try {
      const key = videoPositionPrefix + videoId;
      const saved = JSON.parse(localStorage.getItem(key) || 'null');

      if (!saved || !Number.isFinite(saved.position) ||
        !Number.isFinite(saved.savedAt) || Date.now() - saved.savedAt >= videoPositionTtl) {
        localStorage.removeItem(key);
        return 0;
      }

      return Math.max(0, saved.position);
    } catch (error) {
      return 0;
    }
  }

  function saveVideoPosition(videoId, seconds, duration) {
    if (!videoId || !Number.isFinite(seconds)) return;

    const position = duration && duration - seconds <= 5 ? 0 : Math.max(0, Math.floor(seconds));
    if (lastSavedPositions[videoId] === position) return;

    lastSavedPositions[videoId] = position;

    try {
      localStorage.setItem(videoPositionPrefix + videoId, JSON.stringify({
        position: position,
        savedAt: Date.now()
      }));
    } catch (error) {
      debug('video position could not be stored', error);
    }
  }

  function requestVideoPosition() {
    const iframe = document.querySelector('.fancybox-slide--current iframe');

    if (!iframe || !iframe.contentWindow) return;

    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'listening',
      id: 'fhf-video-gate'
    }), 'https://www.youtube.com');
    iframe.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'getCurrentTime',
      args: []
    }), 'https://www.youtube.com');
  }

  function startVideoTracking() {
    clearInterval(videoTrackingTimer);
    requestVideoPosition();
    videoTrackingTimer = setInterval(requestVideoPosition, 1000);
  }

  function stopVideoTracking() {
    requestVideoPosition();
    clearInterval(videoTrackingTimer);
    videoTrackingTimer = null;
  }

  function openVideo(url, requestedIndex) {
    if (!url) {
      debug('open skipped because URL is empty');
      return;
    }

    const embedUrl = toVideoEmbedUrl(url);
    const items = getVideoItems();
    let startIndex = Number.isInteger(requestedIndex) &&
      requestedIndex >= 0 && requestedIndex < items.length
      ? requestedIndex
      : items.findIndex(function (item) {
        return item.src === embedUrl;
      });

    if (startIndex < 0) {
      items.push({ src: embedUrl, type: 'iframe' });
      startIndex = items.length - 1;
    }

    if (window.jQuery && jQuery.fancybox) {
      debug('opening Fancybox gallery', {
        url: embedUrl,
        startIndex: startIndex,
        itemCount: items.length
      });
      jQuery.fancybox.open(items, {
        loop: false,
        arrows: true,
        infobar: true,
        buttons: ['close'],
        iframe: {
          preload: false
        },
        afterShow: startVideoTracking,
        beforeClose: stopVideoTracking,
        afterClose: stopVideoTracking
      }, startIndex);
    } else {
      debug('Fancybox unavailable, opening new tab', embedUrl);
      window.open(embedUrl, '_blank', 'noopener');
    }
  }

  function toVideoEmbedUrl(url) {
    try {
      const parsed = new URL(url, window.location.href);
      const host = parsed.hostname.replace(/^www\./, '');
      let videoId = '';

      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (parsed.pathname === '/watch') {
          videoId = parsed.searchParams.get('v') || '';
        } else if (parsed.pathname.startsWith('/embed/')) {
          return parsed.href;
        } else if (parsed.pathname.startsWith('/shorts/')) {
          videoId = parsed.pathname.split('/')[2] || '';
        }
      } else if (host === 'youtu.be') {
        videoId = parsed.pathname.slice(1).split('/')[0] || '';
      }

      if (!videoId) return url;

      const embed = new URL('https://www.youtube.com/embed/' + videoId);
      const list = parsed.searchParams.get('list');
      const index = parsed.searchParams.get('index');
      const savedPosition = getSavedVideoPosition(videoId);

      embed.searchParams.set('autoplay', '1');
      embed.searchParams.set('enablejsapi', '1');
      embed.searchParams.set('origin', window.location.origin);
      embed.searchParams.set('playsinline', '1');
      embed.searchParams.set('rel', '0');

      if (list) embed.searchParams.set('list', list);
      if (index) embed.searchParams.set('index', index);
      if (savedPosition > 0) embed.searchParams.set('start', String(savedPosition));

      return embed.href;
    } catch (error) {
      return url;
    }
  }

  function isVisible(element) {
    return !!(
      element &&
      getComputedStyle(element).display !== 'none' &&
      getComputedStyle(element).visibility !== 'hidden'
    );
  }

  window.addEventListener('message', function (event) {
    if (!/^https:\/\/(?:www\.)?youtube\.com$/.test(event.origin)) return;

    let message = event.data;

    try {
      if (typeof message === 'string') message = JSON.parse(message);
    } catch (error) {
      return;
    }

    const info = message && message.info;
    if (!info || !Number.isFinite(info.currentTime)) return;

    const iframe = Array.from(document.querySelectorAll('.fancybox-iframe, .fancybox-slide iframe'))
      .find(function (candidate) {
        return candidate.contentWindow === event.source;
      });
    const videoId = iframe ? getYouTubeVideoId(iframe.src) : '';

    saveVideoPosition(videoId, info.currentTime, info.duration);
  });

  function completeGate(form) {
    const videoUrl = getPendingVideoUrl();
    const videoIndex = getPendingVideoIndex();

    debug('completeGate called', {
      hasForm: !!form,
      videoUrl: videoUrl,
      openedAfterSuccess: openedAfterSuccess
    });

    if (!form || !videoUrl || openedAfterSuccess) return;

    const emailInput = form.querySelector(emailSelector);
    const email = emailInput && emailInput.value.trim();

    if (email) {
      storeEmail(email);
      debug('email stored');
    } else {
      debug('email missing at completion');
    }

    openedAfterSuccess = true;
    clearPendingVideoUrl();
    hideEmailPopup(form);

    setTimeout(function () {
      openVideo(videoUrl, videoIndex);
      openedAfterSuccess = false;
    }, 100);
  }

  function successIsVisibleForForm(form) {
    const formWrap = form && form.closest('.w-form');
    const success = formWrap && formWrap.querySelector(successSelector);

    return isVisible(success);
  }

  function failureIsVisibleForForm(form) {
    const formWrap = form && form.closest('.w-form');
    const failure = formWrap && formWrap.querySelector(failSelector);

    return isVisible(failure);
  }

  function watchForSuccess(form) {
    const formWrap = form && form.closest('.w-form');
    const success = formWrap && formWrap.querySelector(successSelector);

    debug('watchForSuccess called', {
      hasFormWrap: !!formWrap,
      hasSuccess: !!success,
      successVisible: successIsVisibleForForm(form)
    });

    if (!formWrap || !success) return;

    if (successIsVisibleForForm(form)) {
      debug('success already visible');
      completeGate(form);
      return;
    }

    const observer = new MutationObserver(function () {
      debug('form mutation observed', {
        successVisible: successIsVisibleForForm(form),
        failureVisible: failureIsVisibleForForm(form)
      });

      if (!successIsVisibleForForm(form)) return;

      observer.disconnect();
      debug('success became visible');
      completeGate(form);
    });

    observer.observe(formWrap, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'style', 'hidden']
    });
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest(triggerSelector);

    if (!trigger) return;

    const card = trigger.closest(cardSelector);
    const videoUrl = card && card.getAttribute('data-video-url');
    const cards = Array.from(document.querySelectorAll(cardSelector));
    const videoIndex = cards.indexOf(card);

    debug('video trigger clicked', {
      trigger: trigger.matches('.learn-video_image-wrapper') ? 'image' : 'button',
      hasCard: !!card,
      videoUrl: videoUrl,
      hasStoredEmail: !!getStoredEmail()
    });

    if (!videoUrl) return;

    setPendingVideoUrl(videoUrl, videoIndex);

    if (!getStoredEmail()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openVideo(videoUrl, videoIndex);
  }, true);

  document.addEventListener('submit', function (event) {
    const form = event.target;

    if (!form.matches(formSelector)) return;

    const emailInput = form.querySelector(emailSelector);
    const email = emailInput && emailInput.value.trim();
    const videoUrl = getPendingVideoUrl();

    debug('form submit captured', {
      emailPresent: !!email,
      videoUrl: videoUrl,
      valid: form.checkValidity()
    });

    if (!email || !videoUrl || !form.checkValidity()) return;

    watchForSuccess(form);

    setTimeout(function () {
      debug('500ms success check', {
        successVisible: successIsVisibleForForm(form),
        failureVisible: failureIsVisibleForForm(form)
      });

      if (successIsVisibleForForm(form)) completeGate(form);
    }, 500);

    setTimeout(function () {
      debug('2500ms fallback check', {
        successVisible: successIsVisibleForForm(form),
        failureVisible: failureIsVisibleForForm(form)
      });

      if (successIsVisibleForForm(form) || failureIsVisibleForForm(form)) return;

      debug('no success or failure visible, using fallback completion');
      completeGate(form);
    }, 2500);
  }, true);

  document.addEventListener('DOMContentLoaded', function () {
    debug('DOMContentLoaded setup', {
      formCount: document.querySelectorAll(formSelector).length,
      cardCount: document.querySelectorAll(cardSelector).length,
      fancyboxAvailable: !!(window.jQuery && jQuery.fancybox),
      storedEmailPresent: !!getStoredEmail()
    });

    document.querySelectorAll(formSelector).forEach(watchForSuccess);
  });
})();

// CLEAR SEARCH INPUT
$(function () {
  const $search = $('#field');

  if (!$search.parent().hasClass('search-wrap')) {
    $search.wrap('<div class="search-wrap"></div>');
    $search.after(
      '<button type="button" class="search-clear" aria-label="Clear search">&times;</button>'
    );
  }

  $('<style>').text(`
    .search-wrap{
      position:relative;
      width:100%;
    }

    .search-clear{
      position:absolute;
      right:0.9rem;
      top:50%;
      transform:translateY(-50%);
      border:0;
      background:transparent;
      color:rgba(0,0,0,0.5);
      font-size:1.4rem;
      line-height:1;
      cursor:pointer;
      display:none;
      z-index:2;
      padding:0;
    }

    .search-clear:hover{
      color:rgba(0,0,0,0.75);
    }

    .search-clear.is-visible{
      display:block;
    }

    #field{
      padding-right:2.5rem!important;
    }
  `).appendTo('head');

  function toggleClear() {
    $('.search-clear').toggleClass('is-visible', $.trim($search.val()).length > 0);
  }

  $search.on('input keyup change paste cut search', function () {
    setTimeout(toggleClear, 0);
  });

  $('.search-clear').on('click', function () {
    const input = $search[0];

    input.value = '';

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Backspace' }));

    $search.focus();

    setTimeout(toggleClear, 0);
  });

  toggleClear();
});

// FAQ SEARCH
$(function () {
  const $search = $('#Search');
  const $items = $('.faq_item');
  const $columns = $('.faq_col');
  const markClass = 'faq-search-highlight';

  $('<style>').text(`
    .${markClass}{
      background:yellow!important;
      color:#000!important;
    }

    .is-no-search-results{
      display:none;
    }

    .faq-search-wrap{
      position:relative;
      width:100%;
    }

    .faq-search-clear{
      position:absolute;
      right:.9rem;
      top:50%;
      transform:translateY(-50%);
      border:0;
      background:transparent;
      color:inherit;
      font-size:1.4rem;
      line-height:1;
      cursor:pointer;
      display:none;
      z-index:2;
      padding:0;
    }

    .faq-search-clear.is-visible{
      display:block;
    }

    #Search{
      padding-right:2.5rem!important;
    }

    .is-faq-searching .faq_icon-wrapper,
    .is-faq-searching .faq_heading-icon,
    .is-faq-searching .faq_list-img{
      display:none!important;
    }
  `).appendTo('head');

  $search.attr({
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'off',
    spellcheck: 'false'
  });

  if (!$search.parent().hasClass('faq-search-wrap')) {
    $search
      .wrap('<div class="faq-search-wrap"></div>')
      .after(
        '<button type="button" class="faq-search-clear" aria-label="Clear search">&times;</button>'
      );
  }

  const $clear = $('.faq-search-clear');

  $('.faq_question-text, .faq_answer').each(function () {
    $(this).data('original-html', this.innerHTML);
  });

  function highlight(html, term) {
    const regex = new RegExp(
      `(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
      'gi'
    );

    const $html = $('<div>').html(html);

    $html
      .find('*')
      .addBack()
      .contents()
      .filter(function () {
        return (
          this.nodeType === 3 &&
          this.nodeValue.toLowerCase().includes(term.toLowerCase())
        );
      })
      .each(function () {
        $(this).replaceWith(
          this.nodeValue.replace(
            regex,
            `<mark class="${markClass}">$1</mark>`
          )
        );
      });

    return $html.html();
  }

  function setOpen($item, open) {
    $item
      .toggleClass('is-open', open)
      .find('.faq_answer')
      .first()
      .css({
        width: '100%',
        height: open ? 'auto' : '0px'
      });
  }

  function resetItem($item) {
    const $question = $item.find('.faq_question-text').first();
    const $answer = $item.find('.faq_answer').first();

    $question.html($question.data('original-html'));
    $answer.html($answer.data('original-html'));
  }

  function searchFaqs() {
    const term = $.trim($search.val());
    const query = term.toLowerCase();
    const searching = query.length > 0;

    $('body').toggleClass('is-faq-searching', searching);
    $clear.toggleClass('is-visible', searching);

    if (!searching) {
      $columns.show();

      $items.each(function () {
        const $item = $(this);

        resetItem($item);
        $item.show();
        setOpen($item, false);
      });

      $('.is-no-search-results').hide();
      return;
    }

    $items.each(function () {
      const $item = $(this);
      const $question = $item.find('.faq_question-text').first();
      const $answer = $item.find('.faq_answer').first();

      resetItem($item);

      const questionMatch = $question
        .text()
        .toLowerCase()
        .includes(query);

      const answerMatch = $answer
        .text()
        .toLowerCase()
        .includes(query);

      const match = questionMatch || answerMatch;

      $item.toggle(match);
      setOpen($item, answerMatch);

      if (match) {
        $question.html(
          highlight($question.data('original-html'), term)
        );

        $answer.html(
          highlight($answer.data('original-html'), term)
        );
      }
    });

    $columns.each(function () {
      const hasResults = $(this)
        .find('.faq_item')
        .filter(function () {
          return $(this).css('display') !== 'none';
        })
        .length > 0;

      $(this).toggle(hasResults);
    });

    const hasAnyResults = $items.filter(function () {
      return $(this).css('display') !== 'none';
    }).length > 0;

    $('.is-no-search-results').toggle(!hasAnyResults);
  }

  $search.on('input search', searchFaqs);

  $clear.on('click', function () {
    $search.val('').trigger('input').focus();
  });

  searchFaqs();
});
// $(function () {
//   const markClass = 'faq-search-highlight';

//   $('<style>')
//     .text(`
//       .${markClass}{
//         background:yellow!important;
//         color:#000!important;
//       }
//       .is-no-search-results{
//         display:none;
//       }
//     `)
//     .appendTo('head');

//   $('#Search').attr({
//     autocomplete: 'off',
//     autocorrect: 'off',
//     autocapitalize: 'off',
//     spellcheck: 'false'
//   });

//   $('.faq_question-text, .faq_answer').each(function () {
//     $(this).data('original-html', $(this).html());
//   });

//   function escapeRegExp(str) {
//     return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
//   }

//   function highlightHtml(html, term) {
//     if (!term) return html;

//     const regex = new RegExp('(' + escapeRegExp(term) + ')', 'gi');
//     const $wrapper = $('<div>').html(html);

//     $wrapper.find('*').addBack().contents().each(function () {
//       if (this.nodeType === 3) {
//         const text = this.nodeValue;

//         if (text.toLowerCase().includes(term.toLowerCase())) {
//           $(this).replaceWith(text.replace(regex, `<mark class="${markClass}">$1</mark>`));
//         }
//       }
//     });

//     return $wrapper.html();
//   }

//   function openFaq($item) {
//     $item.addClass('is-open');
//     $item.find('.faq_answer').first().css({ width: '100%', height: 'auto' });
//   }

//   function closeFaq($item) {
//     $item.removeClass('is-open');
//     $item.find('.faq_answer').first().css({ width: '100%', height: '0px' });
//   }

//   function resetItem($item) {
//     const $question = $item.find('.faq_question-text').first();
//     const $answer = $item.find('.faq_answer').first();

//     $question.html($question.data('original-html'));
//     $answer.html($answer.data('original-html'));
//   }

//   function showAllFaqs() {
//     $('.faq_item').each(function () {
//       const $item = $(this);
//       resetItem($item);
//       $item.css('display', '');
//       closeFaq($item);
//     });

//     $('.faq_col').css('display', '');
//     $('.is-no-search-results').hide();
//   }

//   function runFaqSearch() {
//     const term = $.trim($('#Search').val());
//     const cleanTerm = term.toLowerCase();

//     if (!cleanTerm) {
//       showAllFaqs();
//       return;
//     }

//     $('.faq_item').each(function () {
//       const $item = $(this);
//       resetItem($item);

//       const $question = $item.find('.faq_question-text').first();
//       const $answer = $item.find('.faq_answer').first();

//       const questionText = $question.text().toLowerCase();
//       const answerText = $answer.text().toLowerCase();

//       const questionMatch = questionText.includes(cleanTerm);
//       const answerMatch = answerText.includes(cleanTerm);
//       const isMatch = questionMatch || answerMatch;

//       $item.css('display', isMatch ? '' : 'none');

//       if (isMatch) {
//         $question.html(highlightHtml($question.data('original-html'), term));
//         $answer.html(highlightHtml($answer.data('original-html'), term));

//         answerMatch ? openFaq($item) : closeFaq($item);
//       } else {
//         closeFaq($item);
//       }
//     });

//     $('.faq_col').each(function () {
//       $(this).css(
//         'display',
//         $(this).find('.faq_item').filter(function () {
//           return $(this).css('display') !== 'none';
//         }).length ? '' : 'none'
//       );
//     });

//     const hasResults = $('.faq_item').filter(function () {
//       return $(this).css('display') !== 'none';
//     }).length > 0;

//     $('.is-no-search-results').toggle(!hasResults);
//   }

//   $('#Search').on('input keyup change paste cut search', function () {
//     setTimeout(runFaqSearch, 0);
//   });

//   showAllFaqs();
// });
