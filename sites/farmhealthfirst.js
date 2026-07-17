// Last updated: 2026-07-17 17:45:37
ss
// DOSING LINKS
$(function () {
  $('.dosing_link-num').each(function () {
    const $num = $(this);
    const slug = $.trim($num.attr('link-slug') || '');

    if (!slug) return;

    // $num.text(String($num.text()).padStart(2, '0'));
    $num.closest('a').attr('href', '#' + slug);
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

// VIDEO SWIPER JS
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.video-list_list-wrapper.is-slider').forEach(function (wrapper) {
    var list = wrapper.querySelector('.video-list_list');
    var items = wrapper.querySelectorAll('.video-list_item');
    var section = wrapper.closest('.container-large');
    var prev = section.querySelector('[slider-arrow="prev"]');
    var next = section.querySelector('[slider-arrow="next"]');

    if (!list || !items.length || !section || !prev || !next) return;

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
});

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

// LEARN VIDEO EMAIL GATE
(function () {
  const storageKey = 'fhfLearnVideoEmail';
  const pendingVideoKey = 'fhfPendingLearnVideoUrl';
  const cardSelector = '.learn-video_card[data-video-url]';
  const buttonSelector = `${cardSelector} .button`;
  const formSelector = '.learn_email-gate-popup form, .learn-video_email-gate-popup form';
  const emailSelector = 'input[type="email"], input[name="EMAIL"]';
  const successSelector = '.w-form-done';
  const failSelector = '.w-form-fail';
  let openedAfterSuccess = false;

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

  function setPendingVideoUrl(url) {
    try {
      sessionStorage.setItem(pendingVideoKey, url);
    } catch (error) {
      window[pendingVideoKey] = url;
    }

    debug('pending video set', url);
  }

  function clearPendingVideoUrl() {
    try {
      sessionStorage.removeItem(pendingVideoKey);
    } catch (error) {
      window[pendingVideoKey] = '';
    }

    debug('pending video cleared');
  }

  function openVideo(url) {
    if (!url) {
      debug('open skipped because URL is empty');
      return;
    }

    const embedUrl = toVideoEmbedUrl(url);

    if (window.jQuery && jQuery.fancybox) {
      debug('opening with Fancybox', embedUrl);
      jQuery.fancybox.open({
        src: embedUrl,
        type: 'iframe'
      });
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

      embed.searchParams.set('autoplay', '1');
      embed.searchParams.set('rel', '0');

      if (list) embed.searchParams.set('list', list);
      if (index) embed.searchParams.set('index', index);

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

  function completeGate(form) {
    const videoUrl = getPendingVideoUrl();

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

    setTimeout(function () {
      openVideo(videoUrl);
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
    const button = event.target.closest(buttonSelector);

    if (!button) return;

    const card = button.closest(cardSelector);
    const videoUrl = card && card.getAttribute('data-video-url');

    debug('watch button clicked', {
      hasCard: !!card,
      videoUrl: videoUrl,
      hasStoredEmail: !!getStoredEmail()
    });

    if (!videoUrl) return;

    setPendingVideoUrl(videoUrl);

    if (!getStoredEmail()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    openVideo(videoUrl);
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
