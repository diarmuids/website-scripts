// Last updated: 2026-07-17 17:45:37

$(document).ready(function () {

  $('.retreat_main-image').each(function () {
    if ($(this).hasClass('w-dyn-bind-empty')) {
      $(this).remove();
    }
  });

  var scrollWidth = window.innerWidth - $(window).width();
  $("[data-watch]").each(function (index) {
    $(this).attr({
      "data-fancybox": "watch",
      "data-src": $(this).attr("data-watch"),
      "data-caption": "",
      "data-thumb": ""
    });
  });

  $(".retreat_main-image, .gallery_image").each(function (index) {
    $(this).attr({
      "data-fancybox": "gallery",
      "data-src": $(this).attr("src"),
      "data-caption": "",
      "data-thumb": ""
    });
  });

  // INITIATE & CONFIGURE FANCYBOX OPTIONS
  $("[data-fancybox]").fancybox({
    loop: false,
    arrows: true,
    infobar: false,
    thumbs: {
      autoStart: false
    },
    slideShow: {
      autoStart: true,
      speed: 3600
    },
    mobile: {
      arrows: false,
      thumbs: {
        autoStart: false
      }
    },
    buttons: [
      // "zoom",
      "slideShow",
      // "download",
      // "thumbs",
      "fullScreen",
      "close"
    ],
    video: {
      tpl: '<video class="fancybox-video" preload="none" loop controlsList="nodownload">' +
        '<source src="{{src}}" type="{{format}}" />' +
        "Your browser doesn't support HTML5 video" +
        "</video>",
      format: "",
      autoStart: true
    },
    animationEffect: "zoom",
    animationDuration: 500,
    transitionEffect: "fade",
    transitionDuration: 500,
    clickContent: function (current, event) {
      return current.type === "image" ? "next" : false;
    },

    beforeShow: function (instance, slide) {
      $(".nav-bar").css("padding-right", scrollWidth);
    },

    afterClose: function (instance, slide) {
      $(".nav-bar").css("padding-right", "0px");
    }

  });
});

// SET URL PARAMS OF BOOK NOW BUTTON ON RETREAT PAGE
$('.booking-list_row.w-condition-invisible').remove();
const button = $('.button[url-book-now]');
if (button.length) {
  const params = {
    event: $("[url-event]").text(),
    date: $("[url-date]").text(),
    location: $("[url-location]").text(),
    cost: $("[url-cost]").text(),
    deposit: $("[url-deposit]").text(),
    discount: $("[url-discount]").text(),
    discountdate: $("[url-discountdate]").text()
  };
  const cost = parseFloat(params.cost) || 0;
  const discount = parseFloat(params.discount) || 0;
  $("[url-discountfull]").text(cost - discount);
  const queryString = $.param(params);
  const currentUrl = button.attr("href");
  button.attr("href", currentUrl + (currentUrl.includes("?") ? "&" : "?") + queryString);
}

// GET URL PARAMS AND PASS TO FORM & TEXT ELEMENTS
const bookEvent = $('[book-event]');
if (bookEvent.length) {
  const urlParams = new URLSearchParams(window.location.search);
  const params = {
    event: urlParams.get('event'),
    date: urlParams.get('date'),
    location: urlParams.get('location'),
    cost: urlParams.get('cost'),
    deposit: urlParams.get('deposit'),
    discount: urlParams.get('discount'),
    discountdate: urlParams.get('discountdate')
  };
  const cost = parseFloat(params.cost) || 0;
  const discount = parseFloat(params.discount) || 0;
  console.log(discount)
  if (discount <= 0) {
    $('.is-discount').remove();
  } else {
    $("[book-discountfull]").text(cost - discount);
  }
  $("[book-event]").text(params.event);
  $("[book-date]").text(params.date);
  $("[book-location]").text(params.location);
  $("[book-cost]").text(params.cost);
  $("[book-deposit]").text(params.deposit);
  $("[book-discount]").text(params.discount);
  $("[book-discountdate]").text(params.discountdate);
}
