// Last updated: 2026-07-23 11:16:36

function sentenceCaseSidebarLabel(value) {
  const lowerCaseLabel = String(value || '').trim().toLowerCase();
  const sentenceCaseLabel = lowerCaseLabel.charAt(0).toUpperCase() + lowerCaseLabel.slice(1);

  return sentenceCaseLabel.replace(/\b(?:ii|i)\b/g, function (romanNumeral) {
    return romanNumeral.toUpperCase();
  });
}

const WEBFLOW_PAGE_IDS = {
  home: '6a28130a9f765f9bc4698235',
  faq: '6a298df45cd69f1a53c202a7',
  dosingGuide: '6a292541aac8585a2a153456',
  videos: '6a29b82a83695807b19eda76',
  blog: '6a29b80bed0ef116784e6870',
  products: '6a5512935c6e71d87c982ec7',
  learnCpd: '6a292536d120dc8df39722ce',
  retailers: '6a57bce442180c02d24933e7',
  contact: '6a293da118e494568ea9bc54'
};

function isIncludedInUkSchema(element) {
  const countryElement = element.closest('[data-country]');
  const country = countryElement?.getAttribute('data-country')?.toUpperCase();

  return !country || country === 'UK' || country === 'GB' || country === 'BOTH';
}

// Generate UK schema from the complete Webflow DOM before country filtering
// or unrelated interface initialisers can modify the page or stop execution.
generateHomePageSchema();
generateFaqPageSchema();
generateDosingGuideSchema();
generateVideosCollectionSchema();
generateBlogCollectionSchema();
generateProductsCollectionSchema();
generateLearnCpdCollectionSchema();
generateRetailersCollectionSchema();
generateContactPageSchema();

// COUNTRY LOGIC, THEN LOAD FINSWEET
const countryContentReady = (async function () {
  let selectedCountry = 'UK';

  try {
    const searchParams = new URLSearchParams(location.search);
    const queryFlags = location.search
      .slice(1)
      .split('&')
      .map(function (part) {
        return decodeURIComponent(part.split('=')[0] || '').toUpperCase();
      });
    let test = queryFlags.includes('UK')
      ? 'UK'
      : queryFlags.includes('IE')
        ? 'IE'
        : searchParams.get('test-country')?.toUpperCase();

    if (test === 'UK') test = 'GB';

    if (test) {
      const testFlag = test === 'IE' ? 'IE' : 'UK';

      $(document).on('click', 'a[href]', function () {
        const url = new URL(this.href, location.origin);

        if (url.origin === location.origin) {
          url.search = '?' + testFlag;
          this.href = url;
        }
      });
    }

    const country = test || (await $.getJSON('https://ipapi.co/json/')).country_code;
    const isIreland = country === 'IE';
    selectedCountry = isIreland ? 'IE' : 'UK';

    $('[data-country="' + (isIreland ? 'UK' : 'IE') + '"]').remove();
    $('[data-country="' + (isIreland ? 'IE' : 'UK') + '"]').show();
    $('[name="COUNTRY"]').val(isIreland ? 'Ireland' : 'UK');
  } catch (error) {
    console.warn('Country lookup unavailable');
    $('[data-country="IE"]').remove();
    $('[data-country="UK"]').show();
    $('[name="COUNTRY"]').val('UK');
  }

  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js';
  script.setAttribute('fs-list', '');
  document.body.appendChild(script);

  return selectedCountry;
})();

// TESTING IP
document.addEventListener('click', function (event) {
  const trigger = event.target instanceof Element
    ? event.target.closest('[data-test-country]')
    : null;

  if (!trigger) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  const url = new URL(location.href);
  const country = String(trigger.getAttribute('data-test-country') || '').toUpperCase();

  url.search = '?' + (country === 'IE' ? 'IE' : 'UK');
  location.assign(url.href);
}, true);

// SHOW ALTERNATING FOOTER IMAGE DEPENDING ON EVEN/ODD SECOND
$(function () {
  const isEvenSecond = new Date().getSeconds() % 2 === 0;
  $('.footer_img').hide();
  $('.footer_img' + (isEvenSecond ? ':not(.is-alt)' : '.is-alt')).show();
});

// LIMIT CURATOR FEED TO FIVE MEDIA-ONLY POSTS
function initCuratorFeedLayout() {
  let updateFrame = null;
  const observedFeeds = new WeakSet();
  const feedResizeObserver = new ResizeObserver(requestCuratorFeedUpdate);

  if (!document.getElementById('curator-feed-overrides')) {
    const style = document.createElement('style');
    style.id = 'curator-feed-overrides';
    style.textContent =
      '.crt-feed .crt-post {' +
      'cursor: pointer;' +
      'transition: opacity 300ms ease;' +
      '}' +
      '.crt-feed .crt-post:hover {' +
      'opacity: 0.8;' +
      '}';
    document.head.appendChild(style);
  }

  function getCuratorColumnCount(feed) {
    const firstColumn = Array.from(feed.children).find(function (element) {
      return /(^|\s)crt-col-\d+(\s|$)/.test(element.className);
    });

    if (!firstColumn) return 1;

    const widthPercent = parseFloat(firstColumn.style.width);

    if (widthPercent > 0) {
      return Math.max(1, Math.round(100 / widthPercent));
    }

    return Math.max(1, Math.round(feed.clientWidth / firstColumn.getBoundingClientRect().width));
  }

  function getCuratorPostLimit(columnCount) {
    if (columnCount >= 5) return 5;
    if (columnCount === 4) return 8;
    if (columnCount === 3) return 6;
    if (columnCount === 2) return 4;
    return 2;
  }

  function updateCuratorFeeds() {
    updateFrame = null;

    document.querySelectorAll('.crt-feed').forEach(function (feed) {
      if (!observedFeeds.has(feed)) {
        observedFeeds.add(feed);
        feedResizeObserver.observe(feed);
      }

      const posts = Array.from(feed.querySelectorAll('.crt-post')).sort(function (a, b) {
        return Number(a.dataset.position || Infinity) - Number(b.dataset.position || Infinity);
      });
      const curatorColumnCount = getCuratorColumnCount(feed);
      const forceTwoColumns = curatorColumnCount < 2;
      const columns = Array.from(feed.children).filter(function (element) {
        return /(^|\s)crt-col-\d+(\s|$)/.test(element.className);
      });

      feed.style.display = forceTwoColumns ? 'grid' : '';
      feed.style.gridTemplateColumns = forceTwoColumns ? 'repeat(2, minmax(0, 1fr))' : '';

      columns.forEach(function (column) {
        column.style.setProperty('display', forceTwoColumns ? 'contents' : '');
      });

      posts.forEach(function (post) {
        post.style.order = forceTwoColumns ? String(Number(post.dataset.position || 0)) : '';
      });

      const postLimit = getCuratorPostLimit(Math.max(2, curatorColumnCount));
      const visiblePosts = new Set(posts.slice(0, postLimit));

      posts.forEach(function (post) {
        post.style.display = visiblePosts.has(post) ? '' : 'none';

        const postContent = post.querySelector('.crt-post-content');
        const postCard = post.querySelector('.crt-post-c');

        if (postCard) {
          postCard.style.border = '0';
          postCard.style.boxShadow = 'none';
          postCard.style.background = 'transparent';
          postCard.style.borderRadius = '8px';
          postCard.style.overflow = 'hidden';
        }

        if (postContent) {
          postContent.style.borderRadius = '8px';
          postContent.style.overflow = 'hidden';
        }

        post.querySelectorAll(
          '.crt-post-header, .crt-post-text, .crt-post-footer, ' +
          '.crt-post-max-height-read-more, .crt-sr-only'
        ).forEach(function (element) {
          element.style.display = 'none';
        });
      });
    });
  }

  function requestCuratorFeedUpdate() {
    if (updateFrame !== null) return;
    updateFrame = window.requestAnimationFrame(updateCuratorFeeds);
  }

  new MutationObserver(requestCuratorFeedUpdate).observe(document.body, {
    childList: true,
    subtree: true
  });

  window.addEventListener('resize', requestCuratorFeedUpdate);

  updateCuratorFeeds();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCuratorFeedLayout);
} else {
  initCuratorFeedLayout();
}

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
      const isFirstRichTextElement = heading === richText.firstElementChild;
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

      if (isFirstRichTextElement) {
        heading.style.marginTop = '0px';
      }

      const link = template.cloneNode(true);
      link.href = '#' + anchorId;
      const linkText = link.querySelector('.disease_sidebar-link-text');

      if (!linkText) return;

      linkText.textContent = sentenceCaseSidebarLabel(heading.textContent);
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

    if (headings[0] !== richText.firstElementChild) {
      let introId = richText.id || 'blog-intro';
      let introSuffix = 2;

      while (!richText.id && usedIds.has(introId)) {
        introId = 'blog-intro-' + introSuffix;
        introSuffix += 1;
      }

      if (!richText.id) {
        richText.id = introId;
        usedIds.add(introId);
      }

      richText.style.scrollMarginTop = '70px';

      const introLink = template.cloneNode(true);
      const introLinkText = introLink.querySelector('.blog_sidebar-link-text');

      if (introLinkText) {
        introLink.href = '#' + richText.id;
        introLinkText.textContent = 'Intro';
        sidebar.insertBefore(introLink, template);
        sectionLinks.push({ heading: richText, link: introLink });
      }
    }

    headings.forEach(function (heading, index) {
      const isFirstRichTextElement = heading === richText.firstElementChild;
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

      if (isFirstRichTextElement) {
        heading.style.marginTop = '0px';
      }

      const link = template.cloneNode(true);
      const linkText = link.querySelector('.blog_sidebar-link-text');

      if (!linkText) return;

      link.href = '#' + anchorId;
      linkText.textContent = sentenceCaseSidebarLabel(headingLabel);
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

countryContentReady.then(function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlogHeadingLinks, { once: true });
  } else {
    initBlogHeadingLinks();
  }
});

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

    function setArrowDisabledState(arrow, disabled) {
      arrow.classList.toggle('is-disabled', disabled);
      arrow.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      arrow.setAttribute('tabindex', disabled ? '-1' : '0');
      arrow.style.pointerEvents = disabled ? 'none' : '';
      arrow.style.opacity = disabled ? '0.4' : '';
    }

    function updateSliderArrowStates() {
      setArrowDisabledState(prev, swiper.isBeginning || swiper.isLocked);
      setArrowDisabledState(next, swiper.isEnd || swiper.isLocked);
    }

    swiper.on('slideChange', updateSliderArrowStates);
    swiper.on('reachBeginning', updateSliderArrowStates);
    swiper.on('reachEnd', updateSliderArrowStates);
    swiper.on('fromEdge', updateSliderArrowStates);
    swiper.on('lock', updateSliderArrowStates);
    swiper.on('unlock', updateSliderArrowStates);
    swiper.on('update', updateSliderArrowStates);
    updateSliderArrowStates();

    window.addEventListener('resize', function () {
      setup = getSetup();
      swiper.params.spaceBetween = setup.gap;
      swiper.update();
      swiper.navigation.update();
      updateSliderArrowStates();
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentSwipers);
} else {
  initContentSwipers();
}

window.addEventListener('load', initContentSwipers);

// FAQ PAGE SCHEMA
function generateFaqPageSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.faq) return;

  const questions = new Map();

  document.querySelectorAll('.faq_item').forEach(function (item) {
    if (!isIncludedInUkSchema(item)) return;

    const questionElement = item.querySelector('.faq_question-text');
    const answer = item.querySelector('.faq_answer');

    if (!questionElement || !answer) return;

    const question = questionElement.textContent.replace(/\s+/g, ' ').trim();

    if (!question) return;

    if (!questions.has(question)) questions.set(question, new Set());

    const countryAnswer = answer.querySelector(
      '.text-rich-text.is-faq[data-country="UK"]:not(.is-faq-buttons)'
    ) || answer.querySelector(
      '.text-rich-text.is-faq:not([data-country]):not(.is-faq-buttons)'
    );

    if (!countryAnswer) return;

    const answerText = countryAnswer.textContent.replace(/\s+/g, ' ').trim();
    if (answerText) questions.get(question).add(answerText);
  });

  const mainEntity = Array.from(questions, function ([question, answerTexts]) {
    const acceptedAnswers = Array.from(answerTexts, function (answerText) {
      return {
        '@type': 'Answer',
        text: answerText
      };
    });

    if (!acceptedAnswers.length) return null;

    return {
      '@type': 'Question',
      name: question,
      acceptedAnswer: acceptedAnswers.length === 1 ? acceptedAnswers[0] : acceptedAnswers
    };
  }).filter(Boolean);

  if (!mainEntity.length) return;

  const existingSchema = document.getElementById('faq-page-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'faq-page-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: mainEntity
  });
  document.head.appendChild(schema);
}

// DOSING GUIDE SCHEMA
function generateDosingGuideSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.dosingGuide) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const pageHeading = document.querySelector('.section_header .heading-style-h1');
  const steps = [];

  document.querySelectorAll('.dosing_item').forEach(function (item, index) {
    if (!isIncludedInUkSchema(item)) return;

    const title = item.querySelector('.dosing_title');
    const content = item.querySelector(
      '.dosing_content .text-rich-text[data-country="UK"]:not(.is-blog-buttons)'
    ) || item.querySelector(
      '.dosing_content .text-rich-text:not([data-country]):not(.is-blog-buttons)'
    );
    const anchor = item.querySelector('.anchor-link.is-dosing-guide[id]');
    const image = item.querySelector('.dosing_img[src]');

    if (!title || !content) return;

    const name = title.textContent.replace(/\s+/g, ' ').trim();
    const text = content.textContent.replace(/\s+/g, ' ').trim();

    if (!name || !text) return;

    const step = {
      '@type': 'HowToStep',
      position: index + 1,
      name: name,
      text: text
    };

    if (anchor) step.url = pageUrl + '#' + encodeURIComponent(anchor.id);
    if (image) step.image = new URL(image.src, location.href).href;

    steps.push(step);
  });

  if (!steps.length) return;

  const existingSchema = document.getElementById('dosing-guide-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'dosing-guide-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    '@id': pageUrl + '#howto',
    name: pageHeading
      ? pageHeading.textContent.replace(/\s+/g, ' ').trim()
      : document.title,
    url: pageUrl,
    step: steps
  });
  document.head.appendChild(schema);
}

// VIDEOS COLLECTION SCHEMA
function generateVideosCollectionSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.videos) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const itemListElement = [];
  const usedUrls = new Set();

  document.querySelectorAll('.section_video-list .video-list_item.is-wrap').forEach(function (card) {
    if (!isIncludedInUkSchema(card)) return;

    const link = card.querySelector('a.video-list_link[href]');
    const title = card.querySelector('.blog-list_title.is-video-list');

    if (!link || !title) return;

    const url = new URL(link.getAttribute('href'), location.origin).href;
    const name = title.textContent.replace(/\s+/g, ' ').trim();

    if (!name || usedUrls.has(url)) return;

    usedUrls.add(url);

    const listItem = {
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name: name,
      url: url
    };
    const description = card.querySelector('.blog-list_meta');
    const image = card.querySelector('.video-list_img[src]');

    if (description) {
      const descriptionText = description.textContent.replace(/\s+/g, ' ').trim();
      if (descriptionText) listItem.description = descriptionText;
    }

    if (image) listItem.image = new URL(image.src, location.href).href;

    itemListElement.push(listItem);
  });

  if (!itemListElement.length) return;

  const existingSchema = document.getElementById('videos-collection-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'videos-collection-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl + '#collection',
    name: document.title,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement
    }
  });
  document.head.appendChild(schema);
}

// BLOG COLLECTION SCHEMA
function generateBlogCollectionSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.blog) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const itemListElement = [];
  const usedUrls = new Set();

  document.querySelectorAll(
    '.section_blog-list-featured .blog-list_item, .section_blog-list .blog-list_item'
  ).forEach(function (card) {
    if (!isIncludedInUkSchema(card)) return;

    const link = card.querySelector('a.blog-list_link[href]');
    const title = card.querySelector('.blog-list_title');

    if (!link || !title) return;

    const url = new URL(link.getAttribute('href'), location.origin).href;
    const name = title.textContent.replace(/\s+/g, ' ').trim();

    if (!name || usedUrls.has(url)) return;

    usedUrls.add(url);

    const listItem = {
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name: name,
      url: url
    };
    const description = card.querySelector('.blog-list_meta');
    const image = card.querySelector('.blog-list_img[src]');

    if (description) {
      const descriptionText = description.textContent.replace(/\s+/g, ' ').trim();
      if (descriptionText) listItem.description = descriptionText;
    }

    if (image) listItem.image = new URL(image.src, location.href).href;

    itemListElement.push(listItem);
  });

  if (!itemListElement.length) return;

  const existingSchema = document.getElementById('blog-collection-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'blog-collection-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl + '#collection',
    name: document.title,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement
    }
  });
  document.head.appendChild(schema);
}

// PRODUCTS COLLECTION SCHEMA
function generateProductsCollectionSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.products) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const itemListElement = [];
  const usedUrls = new Set();

  document.querySelectorAll('.section_product-list .product-list_item').forEach(function (card) {
    if (!isIncludedInUkSchema(card)) return;

    const link = card.querySelector('a.product-list_link[href]');
    const title = card.querySelector('.product-list_title[data-country="UK"]') ||
      card.querySelector('.product-list_title:not([data-country])');

    if (!link || !title) return;

    const url = new URL(link.getAttribute('href'), location.origin).href;
    const name = title.textContent.replace(/\s+/g, ' ').trim();

    if (!name || name.toLowerCase() === 'n/a' || usedUrls.has(url)) return;

    usedUrls.add(url);

    const listItem = {
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name: name,
      url: url
    };
    const image = card.querySelector('.product-list_img[data-country="UK"][src]') ||
      card.querySelector('.product-list_img:not([data-country])[src]');
    const details = Array.from(card.querySelectorAll('.product-list_detail'))
      .map(function (detail) {
        return detail.textContent.replace(/\s+/g, ' ').trim();
      })
      .filter(Boolean);

    if (details.length) listItem.description = details.join(' — ');
    if (image && image.alt.trim().toLowerCase() !== 'n/a') {
      listItem.image = new URL(image.src, location.href).href;
    }

    itemListElement.push(listItem);
  });

  if (!itemListElement.length) return;

  const existingSchema = document.getElementById('products-collection-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'products-collection-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl + '#collection',
    name: document.title,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement
    }
  });
  document.head.appendChild(schema);
}

// LEARN AND CPD COLLECTION SCHEMA
function generateLearnCpdCollectionSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.learnCpd) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const itemListElement = [];
  const usedUrls = new Set();

  document.querySelectorAll('.section_learn-video .learn-video_card[data-video-url]').forEach(function (card) {
    if (!isIncludedInUkSchema(card)) return;

    const videoUrl = card.getAttribute('data-video-url');
    const title = card.querySelector('.heading-style-h3');

    if (!videoUrl || !title) return;

    const url = new URL(videoUrl, location.origin).href;
    const name = title.textContent.replace(/\s+/g, ' ').trim();

    if (!name || usedUrls.has(url)) return;

    usedUrls.add(url);

    const listItem = {
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name: name,
      url: url
    };
    const content = card.querySelector('.learn-video_card-content-top');
    const image = card.querySelector('.learn-video_image[src]');

    if (content) {
      const contentClone = content.cloneNode(true);
      const removableTitle = contentClone.querySelector('.heading-style-h3');
      const removableTag = contentClone.querySelector('.learn-video_tag');

      if (removableTitle) removableTitle.remove();
      if (removableTag) removableTag.remove();

      const description = contentClone.textContent.replace(/\s+/g, ' ').trim();
      if (description) listItem.description = description;
    }

    if (image) listItem.image = new URL(image.src, location.href).href;

    itemListElement.push(listItem);
  });

  const cpdSection = document.querySelector('.section_cpd');
  const cpdLink = cpdSection?.querySelector('a.button[href^="http"]');

  if (cpdSection && cpdLink && isIncludedInUkSchema(cpdLink)) {
    const url = new URL(cpdLink.href, location.href).href;
    const heading = cpdSection.querySelector('.heading-style-h2');
    const description = cpdSection.querySelector('p');
    const name = heading
      ? heading.textContent.replace(/\s+/g, ' ').trim()
      : cpdLink.textContent.replace(/\s+/g, ' ').trim();

    if (name && !usedUrls.has(url)) {
      const listItem = {
        '@type': 'ListItem',
        position: itemListElement.length + 1,
        name: name,
        url: url
      };

      if (description) {
        const descriptionText = description.textContent.replace(/\s+/g, ' ').trim();
        if (descriptionText) listItem.description = descriptionText;
      }

      usedUrls.add(url);
      itemListElement.push(listItem);
    }
  }

  if (!itemListElement.length) return;

  const existingSchema = document.getElementById('learn-cpd-collection-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'learn-cpd-collection-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl + '#collection',
    name: document.title,
    description:
      document.querySelector('meta[name="description"]')?.content || undefined,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement
    }
  });
  document.head.appendChild(schema);
}

// ONLINE RETAILERS COLLECTION SCHEMA
function generateRetailersCollectionSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.retailers) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const itemListElement = [];
  const usedUrls = new Set();

  document.querySelectorAll('.retailers_list .retailers_item').forEach(function (card) {
    if (!isIncludedInUkSchema(card)) return;

    const link = card.querySelector('a.retailers_link[href]');
    const nameElement = card.querySelector('.retailers_name');

    if (!link || !nameElement) return;

    const url = new URL(link.href, location.href).href;
    const name = nameElement.textContent.replace(/\s+/g, ' ').trim();

    if (!name || usedUrls.has(url)) return;

    const listItem = {
      '@type': 'ListItem',
      position: itemListElement.length + 1,
      name: name,
      url: url
    };
    const logo = card.querySelector('.retailers_logo[src]');

    if (logo) listItem.image = new URL(logo.src, location.href).href;

    usedUrls.add(url);
    itemListElement.push(listItem);
  });

  if (!itemListElement.length) return;

  const existingSchema = document.getElementById('retailers-collection-schema');

  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = 'retailers-collection-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl + '#online-retailers',
    name: document.title,
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Online Retailers',
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement
    }
  });
  document.head.appendChild(schema);
}

// HOME PAGE SCHEMA
function generateHomePageSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.home) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const siteUrl = new URL('/', pageUrl).href;
  const organizationId = siteUrl + '#organization';
  const websiteId = siteUrl + '#website';
  const webpageId = siteUrl + '#webpage';
  const diseasesId = siteUrl + '#disease-guides';
  const articlesId = siteUrl + '#featured-articles';
  const videosId = siteUrl + '#latest-videos';
  const siteName = document.title.split(/\s*\u00b7\s*/)[0].trim();
  const headline = document.querySelector('.section_home-hero h1')
    ?.textContent.replace(/\s+/g, ' ').trim();
  const heroDescription = document.querySelector(
    '.section_home-hero .text-size-medium.is-home-header'
  )?.textContent.replace(/\s+/g, ' ').trim();
  const description = document.querySelector('meta[name="description"]')?.content.trim() ||
    heroDescription;
  const logo = document.querySelector('.footer_logo[src]');
  const primaryImage = document.querySelector('meta[property="og:image"]')?.content;
  const copyrightText = document.querySelector('.footer_copyright')
    ?.textContent.replace(/\s+/g, ' ').trim() || '';
  const legalNameMatch = copyrightText.match(/\u00a9\s*\d{4}\s+(.+?)\s+All Rights/i);
  const servedCountryCodes = Array.from(document.querySelectorAll('[data-test-country]'))
    .map(function (trigger) {
      const country = trigger.getAttribute('data-test-country')?.toUpperCase();
      return country === 'UK' ? 'GB' : country;
    })
    .filter(function (country, index, countries) {
      return country && countries.indexOf(country) === index;
    });
  const socialUrls = Array.from(document.querySelectorAll(
    '.section_socials-cta a[href^="http"], .section_social-feed .social_link[href^="http"]'
  ))
    .map(function (link) {
      const url = new URL(link.href, location.href);
      url.search = '';
      return url.href;
    })
    .filter(function (url, index, urls) {
      return urls.indexOf(url) === index;
    });
  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteName,
    url: siteUrl
  };

  if (legalNameMatch) organization.legalName = legalNameMatch[1].trim();
  if (description) organization.description = description;

  if (logo) {
    organization.logo = {
      '@type': 'ImageObject',
      '@id': siteUrl + '#logo',
      url: new URL(logo.src, location.href).href,
      contentUrl: new URL(logo.src, location.href).href,
      caption: siteName
    };
    organization.image = { '@id': siteUrl + '#logo' };
  }

  if (servedCountryCodes.length) {
    organization.areaServed = servedCountryCodes.map(function (country) {
      return {
        '@type': 'Country',
        identifier: country
      };
    });
  }

  if (socialUrls.length) organization.sameAs = socialUrls;

  function createItemList(selector, listId, name, getItem) {
    const itemListElement = [];
    const usedUrls = new Set();

    document.querySelectorAll(selector).forEach(function (element) {
      if (!isIncludedInUkSchema(element)) return;

      const item = getItem(element);

      if (!item?.url || !item.name || usedUrls.has(item.url)) return;

      usedUrls.add(item.url);
      itemListElement.push({
        '@type': 'ListItem',
        position: itemListElement.length + 1,
        item: item
      });
    });

    if (!itemListElement.length) return null;

    return {
      '@type': 'ItemList',
      '@id': listId,
      name: name,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      numberOfItems: itemListElement.length,
      itemListElement: itemListElement
    };
  }

  const diseaseList = createItemList(
    '.section_diseases-more .disease-list_item',
    diseasesId,
    'Animal disease guides',
    function (item) {
      const link = item.querySelector('a.disease-list_link[href]');
      const category = item.closest('.layout_col')?.querySelector('.heading-style-h3')
        ?.textContent.replace(/\s+/g, ' ').trim();
      const name = link?.textContent.replace(/\s+/g, ' ').trim();

      if (!link || !name) return null;

      const page = {
        '@type': 'WebPage',
        name: name,
        url: new URL(link.getAttribute('href'), pageUrl).href
      };

      if (category) {
        page.about = {
          '@type': 'Thing',
          name: category
        };
      }
      return page;
    }
  );
  const articleList = createItemList(
    '.section_blog-featured .blog-list_item',
    articlesId,
    'Featured animal health articles',
    function (item) {
      const link = item.querySelector('a.blog-list_link[href]');
      const title = item.querySelector('.blog-list_title');
      const image = item.querySelector('.blog-list_img[src]');
      const categories = Array.from(item.querySelectorAll('.category_tag'))
        .map(function (category) {
          return category.textContent.replace(/\s+/g, ' ').trim();
        })
        .filter(Boolean);

      if (!link || !title) return null;

      const article = {
        '@type': 'BlogPosting',
        name: title.textContent.replace(/\s+/g, ' ').trim(),
        headline: title.textContent.replace(/\s+/g, ' ').trim(),
        url: new URL(link.getAttribute('href'), pageUrl).href
      };

      if (image) article.image = new URL(image.src, pageUrl).href;
      if (categories.length) {
        article.about = categories.map(function (category) {
          return {
            '@type': 'Thing',
            name: category
          };
        });
      }
      return article;
    }
  );
  const videoList = createItemList(
    '.section_video-slider .video-list_item.is-slider',
    videosId,
    'Latest animal health videos',
    function (item) {
      const link = item.querySelector('a.video-list_link[href]');
      const title = item.querySelector('.blog-list_title.is-video-list');
      const image = item.querySelector('.video-list_img-wrap img[src]');
      const categories = Array.from(item.querySelectorAll('.category_tag'))
        .map(function (category) {
          return category.textContent.replace(/\s+/g, ' ').trim();
        })
        .filter(Boolean);

      if (!link || !title) return null;

      const videoPage = {
        '@type': 'WebPage',
        name: title.textContent.replace(/\s+/g, ' ').trim(),
        url: new URL(link.getAttribute('href'), pageUrl).href
      };

      if (image) videoPage.image = new URL(image.src, pageUrl).href;
      if (categories.length) {
        videoPage.about = categories.map(function (category) {
          return {
            '@type': 'Thing',
            name: category
          };
        });
      }
      return videoPage;
    }
  );
  const contentLists = [diseaseList, articleList, videoList].filter(Boolean);
  const homePage = {
    '@type': 'WebPage',
    '@id': webpageId,
    url: pageUrl,
    name: document.title,
    headline: headline || document.title,
    isPartOf: { '@id': websiteId },
    about: { '@id': organizationId },
    mainEntity: { '@id': organizationId },
    publisher: { '@id': organizationId },
    inLanguage: document.documentElement.lang || 'en'
  };

  if (description) homePage.description = description;
  if (primaryImage) {
    homePage.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: new URL(primaryImage, pageUrl).href
    };
  }
  if (contentLists.length) {
    homePage.hasPart = contentLists.map(function (list) {
      return { '@id': list['@id'] };
    });
  }

  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
    try {
      const existingSchema = JSON.parse(script.textContent);
      const graph = Array.isArray(existingSchema['@graph'])
        ? existingSchema['@graph']
        : [existingSchema];

      if (graph.some(function (item) {
        return item && item['@id'] === webpageId;
      })) {
        script.remove();
      }
    } catch (error) {
      // Leave unrelated invalid JSON-LD untouched.
    }
  });

  const schema = document.createElement('script');
  schema.id = 'home-page-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteUrl,
        name: siteName,
        description: description || undefined,
        publisher: { '@id': organizationId },
        inLanguage: document.documentElement.lang || 'en'
      },
      homePage
    ].concat(contentLists)
  });
  document.head.appendChild(schema);
}

// CONTACT PAGE SCHEMA
function generateContactPageSchema() {
  if (document.documentElement.dataset.wfPage !== WEBFLOW_PAGE_IDS.contact) return;

  const contactSection = document.querySelector('.section_contact');

  if (!contactSection) return;

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = canonical ? canonical.href : location.href.split('#')[0];
  const siteUrl = new URL('/', pageUrl).href;
  const organizationId = siteUrl + '#organization';
  const websiteId = siteUrl + '#website';
  const pageId = pageUrl + '#webpage';
  const breadcrumbId = pageUrl + '#breadcrumb';
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const headline = contactSection.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim();
  const siteName = document.title.split(/\s*\u00b7\s*/).pop().trim();
  const companyName = contactSection.querySelector('.contact_wrapper .heading-style-h5')
    ?.textContent.replace(/\s+/g, ' ').trim();
  const emailLink = contactSection.querySelector('a[href^="mailto:"]');
  const phoneLink = contactSection.querySelector('a[href^="tel:"]');
  const mapLink = contactSection.querySelector('a.contact_item[href*="google.com/maps"]');
  const companyLink = Array.from(contactSection.querySelectorAll('a.contact_item[href^="http"]'))
    .find(function (link) {
      return !link.href.includes('google.com/maps');
    });
  const logo = document.querySelector('.footer_logo[src]');
  const primaryImage = document.querySelector('meta[property="og:image"]')?.content;
  const copyrightText = document.querySelector('.footer_copyright')
    ?.textContent.replace(/\s+/g, ' ').trim() || '';
  const legalNameMatch = copyrightText.match(/\u00a9\s*\d{4}\s+(.+?)\s+All Rights/i);
  const email = emailLink
    ? decodeURIComponent(emailLink.href.replace(/^mailto:/i, '').split('?')[0])
    : '';
  const telephone = phoneLink
    ? phoneLink.href.replace(/^tel:/i, '').replace(/\s+/g, '')
    : '';
  const addressText = mapLink
    ? mapLink.textContent.replace(/\s+/g, ' ').trim()
    : '';
  const addressParts = addressText
    .split(',')
    .map(function (part) {
      return part.trim();
    })
    .filter(Boolean);
  const socialUrls = Array.from(contactSection.querySelectorAll('.social_link[href^="http"]'))
    .map(function (link) {
      const url = new URL(link.href, location.href);
      url.search = '';
      return url.href;
    })
    .filter(function (url, index, urls) {
      return urls.indexOf(url) === index;
    });
  const servedCountryCodes = Array.from(document.querySelectorAll('[data-test-country]'))
    .map(function (trigger) {
      const country = trigger.getAttribute('data-test-country')?.toUpperCase();
      return country === 'UK' ? 'GB' : country;
    })
    .filter(function (country, index, countries) {
      return country && countries.indexOf(country) === index;
    });
  const language = document.documentElement.lang || 'en';
  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: siteName,
    url: siteUrl
  };

  if (legalNameMatch) organization.legalName = legalNameMatch[1].trim();
  if (description) organization.description = description;
  if (email) organization.email = email;
  if (telephone) organization.telephone = telephone;
  if (logo) {
    organization.logo = {
      '@type': 'ImageObject',
      '@id': siteUrl + '#logo',
      url: new URL(logo.src, location.href).href,
      contentUrl: new URL(logo.src, location.href).href,
      caption: siteName
    };
    organization.image = { '@id': siteUrl + '#logo' };
  }
  if (companyLink || companyName) {
    organization.parentOrganization = {
      '@type': 'Organization',
      name: companyName || companyLink.textContent.replace(/\s+/g, ' ').trim()
    };
    if (companyLink) organization.parentOrganization.url = companyLink.href;
  }
  const organizationLocation = {
    '@type': 'Place',
    name: companyName || siteName
  };

  if (addressParts.length) {
    organizationLocation.address = {
      '@type': 'PostalAddress',
      streetAddress: addressParts.slice(0, 2).join(', '),
      addressLocality: addressParts[2] || undefined,
      addressRegion: addressParts[3] || undefined,
      addressCountry: addressParts.some(function (part) {
        return /ireland/i.test(part);
      }) ? 'IE' : undefined
    };
  }
  if (mapLink) {
    organizationLocation.hasMap = mapLink.href;

    const coordinates = mapLink.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);

    if (coordinates) {
      organizationLocation.geo = {
        '@type': 'GeoCoordinates',
        latitude: Number(coordinates[1]),
        longitude: Number(coordinates[2])
      };
    }
  }
  if (addressParts.length || mapLink) organization.location = organizationLocation;
  if (servedCountryCodes.length) {
    organization.areaServed = servedCountryCodes.map(function (country) {
      return {
        '@type': 'Country',
        identifier: country
      };
    });
  }
  if (email || telephone) {
    organization.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: email || undefined,
      telephone: telephone || undefined,
      areaServed: servedCountryCodes.length ? servedCountryCodes : undefined,
      availableLanguage: [language]
    };
  }
  if (socialUrls.length || companyLink) {
    organization.sameAs = socialUrls.concat(companyLink ? [companyLink.href] : [])
      .filter(function (url, index, urls) {
        return urls.indexOf(url) === index;
      });
  }

  const contactPage = {
    '@type': 'ContactPage',
    '@id': pageId,
    url: pageUrl,
    name: document.title,
    headline: headline || document.title,
    description: description || undefined,
    isPartOf: { '@id': websiteId },
    about: { '@id': organizationId },
    mainEntity: { '@id': organizationId },
    publisher: { '@id': organizationId },
    inLanguage: language,
    breadcrumb: { '@id': breadcrumbId }
  };
  const significantLinks = [
    email ? 'mailto:' + email : '',
    telephone ? 'tel:' + telephone : '',
    companyLink ? companyLink.href : ''
  ].filter(Boolean);
  const potentialActions = [];

  if (primaryImage) {
    contactPage.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: new URL(primaryImage, location.href).href
    };
  }
  if (significantLinks.length) contactPage.significantLink = significantLinks;
  if (document.getElementById('message')) {
    potentialActions.push({
      '@type': 'CommunicateAction',
      name: 'Message Us',
      target: pageUrl + '#message'
    });
  }
  if (email) {
    potentialActions.push({
      '@type': 'CommunicateAction',
      name: 'Email Us',
      target: 'mailto:' + email
    });
  }
  if (telephone) {
    potentialActions.push({
      '@type': 'CommunicateAction',
      name: 'Call Us',
      target: 'tel:' + telephone
    });
  }
  if (potentialActions.length) contactPage.potentialAction = potentialActions;

  document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) {
    try {
      const existingSchema = JSON.parse(script.textContent);
      const graph = Array.isArray(existingSchema['@graph'])
        ? existingSchema['@graph']
        : [existingSchema];

      if (graph.some(function (item) {
        return item && item['@type'] === 'ContactPage';
      })) {
        script.remove();
      }
    } catch (error) {
      // Leave unrelated invalid JSON-LD untouched.
    }
  });

  const schema = document.createElement('script');
  schema.id = 'contact-page-schema';
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      organization,
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteUrl,
        name: siteName,
        description: description || undefined,
        publisher: { '@id': organizationId },
        inLanguage: language
      },
      contactPage,
      {
        '@type': 'BreadcrumbList',
        '@id': breadcrumbId,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: headline || 'Contact',
            item: pageUrl
          }
        ]
      }
    ]
  });
  document.head.appendChild(schema);
}

// CONVERT FAQ LINKS TO BUTTON LIST AFTER COUNTRY CONTENT IS RESOLVED
function initFaqLinkButtons() {
  $('.faq_answer').each(function () {
    const $answer = $(this);
    let $group = $answer.children('.button-group.is-vertical').first();

    if (!$group.length) {
      $group = $('<div class="button-group is-vertical" style="padding-bottom:1.5rem;"></div>');
      $answer.append($group);
    }

    function makeButton(href, text) {
      text = $.trim(text).replace(/\.{2,}$/, '');

      const $button = $('<a>', {
        href: href,
        class: 'button is-tertiary w-inline-block'
      });

      $button.append($('<div>').text(text));
      $button.append(
        '<div class="button_icon w-embed"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="100%" height="100%" fill="none"><path d="M534.9 278.6l22.6-22.6-22.6-22.6-160-160-22.6-22.6-45.3 45.3c1.3 1.3 44 44 128 128l-402.7 0 0 64 402.7 0c-84 84-126.7 126.7-128 128l45.3 45.3 22.6-22.6 160-160z" fill="currentColor" stroke="currentColor"></path></svg></div>'
      );

      return $button;
    }

    const mainButtons = [];
    const extraButtons = [];

    $answer.find('.text-rich-text.is-faq:not(.is-faq-buttons)').each(function () {
      const $lastP = $(this).children('p').last();

      while ($lastP.length) {
        let node = $lastP.contents().last()[0];

        while (
          node &&
          ((node.nodeType === 3 && !$.trim(node.nodeValue)) ||
            (node.nodeType === 1 && node.tagName === 'BR'))
        ) {
          $(node).remove();
          node = $lastP.contents().last()[0];
        }

        if (!node || node.nodeType !== 1 || node.tagName.toLowerCase() !== 'a') break;

        const $link = $(node);
        mainButtons.unshift(makeButton($link.attr('href'), $link.text()));
        $link.remove();
      }
    });

    $answer.find('.text-rich-text.is-faq-buttons').each(function () {
      $(this).find('a').each(function () {
        extraButtons.push(makeButton($(this).attr('href'), $(this).text()));
      });

      $(this).remove();
    });

    $group.empty().append(mainButtons).append(extraButtons);
  });
}

countryContentReady.then(initFaqLinkButtons);

// SET SLIDER MASK HEIGHT
$(function () {
  function setMaskHeights() {
    $('.w-slider').each(function () {
      const $slider = $(this);
      const height = $slider.find('.w-slider-mask').outerHeight();

      if (height) {
        $slider.find('.w-slide').height(height);
      }
    });
  }

  let timeout;

  function runSetMaskHeights() {
    clearTimeout(timeout);
    timeout = setTimeout(setMaskHeights, 50);
  }

  setMaskHeights();
  $(window).on('resize', runSetMaskHeights);

  new MutationObserver(runSetMaskHeights).observe(document.body, {
    childList: true,
    subtree: true
  });
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
