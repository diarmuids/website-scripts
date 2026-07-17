// function createMarquee(container, wrapper, slide, speed) {
//   const containerEl = document.querySelector(container);
//   const wrapperEl = document.querySelector(wrapper);
//   const slides = document.querySelectorAll(slide);
//   if (!containerEl || !wrapperEl || slides.length === 0) return;
//   wrapperEl.innerHTML += wrapperEl.innerHTML;
//   let position = 0;

//   function animate() {
//     position -= speed;
//     if (Math.abs(position) >= wrapperEl.scrollWidth / 2) position = 0;
//     wrapperEl.style.transform = `translateX(${position}px)`;
//     requestAnimationFrame(animate);
//   }
//   Object.assign(containerEl.style, { overflow: 'hidden', position: 'relative' });
//   Object.assign(wrapperEl.style, { display: 'flex', width: 'max-content', transition: 'none' });

//   animate();
// }
// createMarquee('.logo_list-wrapper', '.logo_list', '.logo_image', 1.5); // Adjust speed as needed

// var logoSwiper = new Swiper('.logo_list-wrapper', {
//   wrapperClass: 'logo_list',
//   slideClass: 'logo_image',
//   speed: 500,
//   loop: true,
//   slidesPerView: "auto",
//   allowTouchMove: false,
//   // a11y: false,
//   // grabCursor: true,
//   // freeMode: true,
//   autoplay: {
//     delay: 0,
//     disableOnInteraction: false,
//   },
//   breakpoints: {
//     0: {
//       spaceBetween: 40,
//       speed: 4000
//     },
//     480: {
//       spaceBetween: 48,
//       speed: 4000
//     },
//     767: {
//       spaceBetween: 64,
//       speed: 5000
//     },
//     992: {
//       spaceBetween: 64
//     }
//   }
// });

// HIDE NAV ON FILLOUT FORM VALIDATION
// var position1 = $(window).scrollTop(); // Initial scroll position
// $(window).scroll(function () {
//   var scroll1 = $(window).scrollTop();
//   var div = $('.form_fillout-embed');
//   if (div.length > 0) {
//     var divTop = div.offset().top;
//     var divBottom = div.offset().top + div.outerHeight();
//     //IF SCROLLED ABOVE FORM
//     if ($(window).scrollTop() < divTop - 120) {
//       $(".nav_component").removeClass("nav-hidden");
//     }
//     //IF FORM BUTTON IN VIEW
//     else if (divBottom - 125 <= $(window).scrollTop() + $(window).height()) {
//       $(".nav_component").addClass("nav-hidden");
//     }
//     //IF SCROLLED UP WHEN FORM BUTTON IN VIEW
//     else if (position1 - scroll1 > 0 && divBottom - 120 <= $(window).scrollTop() + $(window)
//       .height()) {
//       $(".nav_component").addClass("nav-hidden");
//     }
//     //IF SCROLLED DOWNWARDS
//     else if (position1 - scroll1 < -20) {
//       $(".nav_component").removeClass("nav-hidden");
//     }
//     position1 = scroll1;
//   }
// });

// PREFILL PAYMENT FORM DETAILS - https://www.terenureorthodontics.ie/URL
// $('#url-name, #url-amount').on('input', function () {
//   var name = $('#url-name').val().replace(/ /g, '+');
//   var amount = $('#url-amount').val();
//   $('#url-link').val("https://www.terenureorthodontics.ie/patients/online-payments?name=" +
//     name + "&amount=" + amount);
// });

// $('#url-link').on('click', function () {
//   $(this).select();
// });

// $('#url-copy').on('click', function () {
//   var $this = $(this);
//   var $input = $('#url-link');
//   if ($input.val() !== '') {
//     $input.select();
//     document.execCommand('copy');
//     $this.text('Copied!');
//     setTimeout(function () {
//       $this.text('Copy Link');
//     }, 600);
//   }
// });

// $('#url-test').on('click', function () {
//   var url = $('#url-link').val();
//   if (url !== '') {
//     window.open(url, '_blank');
//   }
// });

// SET FORM WRAPPER HEIGHT
// var formWrapperHeight = $(".form_wrapper").outerHeight();
// $(".form_wrapper").css("height", formWrapperHeight);

// SHOW REMOTE CONSULTATION BOOKING
// if (window.location.href.indexOf("online") > -1) {
//   setTimeout(function () {
//     $(".w-tab-link:nth-child(1)").removeClass("w--current");
//     $(".w-tab-pane:nth-child(1)").removeClass("w--tab-active");
//     $(".w-tab-link:nth-child(2)").addClass("w--current");
//     $(".w-tab-pane:nth-child(2)").addClass("w--tab-active");
//   }, 1);
// }

// // CALCULATE RECURRING AMOUNT
// $(".form_section.is-treatment input").on('keyup', function () {
//   console.log("TESTING")
//   var totalCost = parseFloat($("#Total-Cost").val());
//   var depositAmount = parseFloat($("#Deposit-Amount").val());
//   var recurringCount = parseFloat($("#Recurring-Count").val());
//   var result = (totalCost - depositAmount) / recurringCount;
//   if (isNaN(result) || result < 0) {
//     // console.log("Invalid result");
//   } else {
//     //result = result.toFixed(2);
//     result = result % 1 !== 0 ? result.toFixed(2) : Math.floor(result);
//     $(".is-recurring-amount").text("€" + result);
//     $("#Recurring-Amount").val(result);
//   }
// });

// // SHOW OTHER INPUT
// $('.is-other').hide();
// $('.is-other input').attr('required', false);
// $('.form_other-wrapper input[type="radio"], .form_other-wrapper input[type="checkbox"]')
//   .change(
//     function () {
//       var parentWrapper = $(this).closest('.form_other-wrapper');
//       if ($(this).parent().is('[show-input]') && $(this).is(':checked')) {
//         $(parentWrapper).find('.is-other').show();
//         $(parentWrapper).find('.is-other input').attr('required', true);
//       } else {
//         $(parentWrapper).find('.is-other').hide();
//         $(parentWrapper).find('.is-other input').removeAttr('required');
//       }
//     });

// $('.form_other-wrapper select').change(function () {
//   var parentWrapper = $(this).closest('.form_other-wrapper');
//   if ($(this).val() == 'Other') {
//     $(parentWrapper).find('.is-other').show();
//     $(parentWrapper).find('.is-other input').attr('required', true);
//   } else {
//     $(parentWrapper).find('.is-other').hide();
//     $(parentWrapper).find('.is-other input').removeAttr('required');
//   }
// });

// // SET RADIO VALUE TO LABEL TEXT
// $('input[type="radio"]').each(function () {
//   var spanText = $(this).next('span').text();
//   $(this).val(spanText);
// });

// // SCROLL TO TOP OF FORM ON SUCCESSFUL SUBMISSION
// $("form:not([data-scroll])").submit(function (event) {
//   event.preventDefault();
//   wrapper = $(this).parent();
//   setTimeout(function () {
//     $('html, body').animate({
//       scrollTop: $(wrapper).offset().top - 150
//     }, 600);
//   }, 500);
// });

// // SIMULATE CLICK ON FIRST IMAGE
// // $('.zoom_caption').click(function () {
// //   $('.condition-image_item:first img').click();
// // });

// // REMOVE EMPTY SECTIONS
// // $('.section_treatment-faqs:has(.w-dyn-empty)').remove();
// ['.section_condition-faqs', '.section_treatment-faqs'].forEach(selector => {
//   if ($(selector).has('.w-dyn-empty').length) {
//     $(selector).remove();
//   }
// });

// // REMOVE EMPTY TREAMENT NAV LINKS
// function removeIfNotVisible(anchor) {
//   if (!$(`[data-anchor='${anchor}']`).is(":visible")) {
//     $(`[data-link='${anchor}']`).remove();
//   }
// }
// ['what', 'how', 'cost', 'faqs'].forEach(anchor => removeIfNotVisible(anchor));

// // SERVICES SLIDER SWIPER.JS
// var treatmentSwiper = new Swiper('.treatment-list_list-wrapper', {
//   wrapperClass: 'treatment-list_list',
//   slideClass: 'treatment-list_item',
//   slidesPerGroup: 1,
//   a11y: true, // accessibility
//   loop: true,
//   speed: 300,
//   // autoHeight: true,
//   grabCursor: true,
//   allowTouchMove: true,
//   simulateTouch: true,
//   // touchEventsTarget: 'container',
//   navigation: {
//     nextEl: '[treatment-next]',
//     prevEl: '[treatment-prev]',
//   },
//   breakpoints: {
//     992: {
//       slidesPerView: 4,
//       spaceBetween: 32
//     },
//     768: {
//       slidesPerView: 3.2,
//       spaceBetween: 32
//     },
//     480: {
//       slidesPerView: 2.15,
//       spaceBetween: 24
//     },
//     0: {
//       slidesPerView: 1.2,
//       spaceBetween: 24
//     }
//   },
// });

// var testimonialSwiper = new Swiper('.testimonial_list-wrapper', {
//   wrapperClass: 'testimonial_list',
//   slideClass: 'testimonial_item',
//   slidesPerGroup: 1,
//   a11y: true, // accessibility
//   loop: true,
//   autoHeight: true,
//   speed: 300,
//   grabCursor: true,
//   allowTouchMove: true,
//   simulateTouch: true,
//   touchEventsTarget: 'container',
//   navigation: {
//     nextEl: '[testimonial-next]',
//     prevEl: '[testimonial-prev]',
//   },
//   breakpoints: {
//     992: {
//       slidesPerView: 2,
//       spaceBetween: 32
//     },
//     768: {
//       slidesPerView: 2,
//       spaceBetween: 32
//     },
//     480: {
//       slidesPerView: 1.125,
//       spaceBetween: 24
//     },
//     0: {
//       slidesPerView: 1.125,
//       spaceBetween: 24
//     }
//   },
// });

// var logoSwiper = new Swiper('.logo_list-wrapper', {
//   wrapperClass: 'logo_list',
//   slideClass: 'logo_image',
//   speed: 7500,
//   loop: true,
//   slidesPerView: "auto",
//   allowTouchMove: false,
//   // a11y: false,
//   // grabCursor: true,
//   // freeMode: true,
//   autoplay: {
//     delay: 0,
//     disableOnInteraction: false,
//   },
//   breakpoints: {
//     0: {
//       /* when window >=0px - webflow mobile landscape/portriat */
//       spaceBetween: 40,
//       speed: 4000
//     },
//     480: {
//       /* when window >=0px - webflow mobile landscape/portriat */
//       spaceBetween: 48,
//       speed: 4000
//     },
//     767: {
//       /* when window >= 767px - webflow tablet */
//       spaceBetween: 64,
//       speed: 5000
//     },
//     992: {
//       /* when window >= 988px - webflow desktop */
//       spaceBetween: 64
//     }
//   }
// });
