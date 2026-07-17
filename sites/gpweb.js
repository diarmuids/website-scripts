// Last updated: 2026-07-17 17:45:37

$(document).on("click",
  ".client_button, .client_nav_link:not(.is-dd-outer):not(.is-link), .client_nav_dd-link, .client_nav_top-link, .client_contact_item, .client_footer_link, .client_fixed-button",
  function () {
    plausible('Client Page Click', { props: { ClientButtonText: $(this).text() } });
  });
// $(document).ready(function () {
//   $('[href="#link"]').on('click', function (event) {
//     event.preventDefault();
//     $('.client_nav_link.is-link')[0].dispatchEvent(new MouseEvent('click', {
//       bubbles: true,
//       cancelable: true
//     }));
//   });
// });

// $(document).ready(function () {
//   var currentUrl = window.location.href;
//   if (currentUrl.includes('/client/') && !currentUrl.includes('data-path=')) {
//     var path = window.location.pathname;
//     var newUrl = currentUrl.split('?')[0] + '?data-path=' + encodeURIComponent(path);
//     window.location.href = newUrl;
//   }
// });

// $('.client_fixed-button.is-comp').click(function () {
//   $('.client_iframe-comparison').toggle();
//   //$('body').toggleClass('overflow-hidden');
//   $('.is-comp .client_comp-button-text').text(function (i, text) {
//     return text === 'Compare Old' ? 'Compare New' :
//       'Compare Old';
//   });
//   $('.client_fixed-button.is-comp').toggleClass('is-toggle');
//   $('.is-comp .client_comp-icon').toggleClass('is-toggle');
// });

// $(document).ready(function () {
//   var scrollWidth = window.innerWidth - $(window).width();
//   $("[data-fancy]").each(function (index) {
//     $(this).attr({
//       "data-fancybox": "watch-" + index,
//       "data-src": $(this).attr("data-fancy"),
//       "data-caption": "",
//       "data-thumb": ""
//     });
//   });

//   // INITIATE & CONFIGURE FANCYBOX OPTIONS
//   $("[data-fancybox]").fancybox({
//     loop: false,
//     arrows: false,
//     infobar: false,
//     thumbs: {
//       autoStart: false
//     },
//     slideShow: {
//       autoStart: true,
//       speed: 3600
//     },
//     mobile: {
//       arrows: false,
//       thumbs: {
//         autoStart: false
//       }
//     },
//     buttons: [
//       // "zoom",
//       "slideShow",
//       // "download",
//       // "thumbs",
//       "fullScreen",
//       "close"
//     ],
//     video: {
//       tpl: '<video class="fancybox-video" preload="none" loop controlsList="nodownload">' +
//         '<source src="{{src}}" type="{{format}}" />' +
//         "Your browser doesn't support HTML5 video" +
//         "</video>",
//       format: "",
//       autoStart: true
//     },
//     animationEffect: "zoom",
//     animationDuration: 500,
//     transitionEffect: "fade",
//     transitionDuration: 500,
//     clickContent: function (current, event) {
//       return current.type === "image" ? "next" : false;
//     },
//     beforeShow: function (instance, slide) {
//       $(".nav_component").css("padding-right", scrollWidth);
//     },
//     afterClose: function (instance, slide) {
//       $(".nav_component").css("padding-right", "0px");
//     }
//   });
// });

// $(document).on('click', '.nav_component.nav-is-open a', function () {
//   if ($(window).width() <= 991) {
//     $('.nav_menu-button').trigger('click');
//   }
// });

// $(document).on("click", ".nav_link", function (event) {
//   const text = $(this).text();
//   plausible('Nav Link Click', { props: { NavLink: text } })
// });

// $(document).on("click", ".nav_logo-link", function (event) {
//   plausible('Nav Link Click', { props: { NavLink: "Logo" } })
// });

// $(document).on("click", ".nav_cta-wrap .button", function (event) {
//   plausible('Nav Link Click', { props: { NavLink: "Get Started" } })
// });

// const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

// // DISABLE SCROLLING WHEN POPUP VISIBLE
// setInterval(() => {
//   const $popup = $('.global_popup-component');
//   if ($popup.is(':visible')) {
//     $('body').css({ 'overflow': 'hidden' });
//   } else {
//     $('body').css({ 'overflow': '' });
//   }
// }, 50);

// // ADD PADDING RIGHT TO STOP PAGE MOVEMENT WHEN SCROLLING DISABLED
// const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
// const observer = new MutationObserver(() => {
//   const bodyOverflow = $('body').css('overflow');

//   if (bodyOverflow === 'hidden') {
//     $('body').css({
//       'padding-right': `${scrollbarWidth}px`
//     });
//     $('.nav_component').css({
//       'padding-right': `${scrollbarWidth}px`
//     });
//   } else {
//     $('body').css({
//       'padding-right': ''
//     });
//     $('.nav_component').css({
//       'padding-right': ''
//     });
//   }
// });
// observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
