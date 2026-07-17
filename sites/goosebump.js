// Last updated: 2026-07-17 17:45:37

// HOME SHOWREEL LINK
$('.home_showreel-link').on('click', function () {
  $('.video_overlay').trigger('click');
});

// SET SLIDER HEIGHT
const sliderHeight = $('.home-slider_slider').height();
$('.home-slider_slider').height(sliderHeight);

// PLAY ABOUT VIDEO
$('.video_overlay').on('click', function () {
  const videoWrapper = $(this).closest('.video_wrapper');
  const video = videoWrapper.find('video');
  if (video.length) {
    video[0].play();
    video.attr('controls', 'controls');
    $(this).css({
      'opacity': '0',
      'pointer-events': 'none'
    });

    video.on('pause', () => {
      $(this).css({
        'opacity': '1',
        'pointer-events': 'auto'
      });
      video.removeAttr('controls');
    });
  }
});

// CLOSES NAV MENU AFTER NAV LINK IS CLICKED
$('body').on('click', '.nav-is-open a', function (event) {
  var link = $(this).attr('href');
  var linkPath = new URL(link, window.location.origin).pathname;
  var currentPath = window.location.pathname;
  if (linkPath === currentPath) {
    $('.w-nav-button').triggerHandler('tap');
  }
});

// PAUSE VIDEO ON SCROLL OUT OF VIEW
$(window).on('scroll', function () {
  $('.video_embed video').each(function () {
    if (!$(this).visible(true) && !this.paused) {
      this.pause();
    }
  });
});

// PLAY / PAUSE VIDEO ON HOVER
$(".project-list_item").on("mouseover", function () {
  $(this).find("video").trigger('play');
  $(this).find(".project-list_content").css("background-color", "rgba(0, 0, 0, 0.28)");
});

$(".project-list_item").on("mouseout", function () {
  $(this).find("video").trigger('pause');
  $(this).find(".project-list_content").css("background-color", "rgba(0, 0, 0, 0.68)");
});

// HIDE SHOW HEADER MAIN SECTION ON SCROLL
$(".section_main").css("opacity", 0);
$(window).on("scroll", function () {
  if ($(".landing_logo").length) {
    if ($(".landing_logo").visible(true)) {
      $(".section_landing").css("opacity", 1);
      $(".section_main").css("opacity", 0);
    } else {
      $(".section_landing").css("opacity", 0);
      $(".section_main").css("opacity", 1);
    }
  }
});
