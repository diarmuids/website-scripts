// Last updated: 2026-07-17 17:45:37

// alert("TEST")

// // HIDE NAV ON FILLOUT FORM VALIDATION
// var position1 = $(window).scrollTop(); // Initial scroll position
// $(window).scroll(function () {
//   var scroll1 = $(window).scrollTop();
//   var div = $('.form_fillout-embed');
//   var divTop = div.offset().top;
//   var divBottom = div.offset().top + div.outerHeight();
//   // IF SCROLLED ABOVE FORM
//   if ($(window).scrollTop() < divTop - 120) {
//     $(".nav_component").removeClass("nav-hidden");
//   }
//   // IF FORM BUTTON IN VIEW
//   else if (divBottom - 125 <= $(window).scrollTop() + $(window).height()) {
//     $(".nav_component").addClass("nav-hidden");
//   }
//   // IF SCROLLED UP WHEN FORM BUTTON IN VIEW
//   else if (position1 - scroll1 > 0 && divBottom - 120 <= $(window).scrollTop() + $(window)
//     .height()) {
//     $(".nav_component").addClass("nav-hidden");
//   }
//   // IF SCROLLED DOWNWARDS
//   else if (position1 - scroll1 < -20) {
//     $(".nav_component").removeClass("nav-hidden");
//   }
//   position1 = scroll1;
// });
