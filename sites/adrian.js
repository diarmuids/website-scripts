// Last updated: 2026-07-17 17:45:37

// $(document).ready(function () {

//   // -------------------------------
//   // SHOWREEL
//   // -------------------------------

//   $("[data-showreel]").each(function (index) {
//     const dataShowreel = $(this).attr("data-showreel");
//     $(this).attr({
//       "data-fancybox": "work",
//       "data-src": dataShowreel,
//       "data-caption": "",
//       "data-thumb": ""
//     });
//   });

//   let currentTimeMap = {};

//   $("[data-showreel]").on("click", function (e) {
//     const video = $(this).closest(".showreel_inner").find("video")[0];
//     if (!video) return;
//     const currentTime = Math.floor(video.currentTime);
//     const videoSrc = $(this).attr("data-showreel");
//     currentTimeMap[videoSrc] = currentTime;
//     $(this).attr("data-src", videoSrc);
//   });

//   // -------------------------------
//   // COMBINE WORK ITEMS
//   // -------------------------------

//   if ($('.work_random').text().includes("random")) {
//     $('.work_list-wrapper.is-multiple-list .work_item').appendTo(
//       '.work_list.is-one-list');

//     var items = $('.work_list.is-one-list .work_item');
//     items.sort(function () {
//       return Math.random() - 0.5;
//     });
//     $('.work_list.is-one-list').empty().append(items);
//   } else {
//     $('.work_list-wrapper.is-multiple-list .work_item').appendTo(
//       '.work_list.is-one-list');
//     $('.work_list-wrapper.is-multiple-list').remove();
//   }

//   if ($('.heading-style-h1.is-work').length) {
//     const headingText = $('.heading-style-h1.is-work').text();
//     $('.work_type.is-images').text(headingText);
//   }

//   $('.work_image.is-images').each(function () {
//     const altText = $(this).attr('alt');
//     console.log(altText)
//     const workTitle = $(this).closest('.work_inner').find('.work_title.is-images');

//     if (altText) {
//       workTitle.text(altText);
//     } else {
//       workTitle.remove();
//     }
//   });

//   // -------------------------------
//   // FANCBOX
//   // -------------------------------

//   var scrollWidth = window.innerWidth - $(window).width();
//   $(".work_wrapper").each(
//     function () {
//       if ($(this).attr("data-order") === "99") {
//         return;
//       }
//       let workSrc = $(this).find("[data-work]").attr("data-work");
//       if (!workSrc) {
//         workSrc = $(this).find(".work_image").attr("src");
//         if (workSrc) {
//           $(this).find("[data-work]").attr("data-work", workSrc);
//         }
//       }
//       // if (workSrc) {
//       //   workSrc += "?autoplay=1";
//       // }
//       const workTitle = $(this).find(".work_overlay:not(.is-what-i-do) .work_title").text()
//         .trim();
//       const workType = $(this).find(".work_overlay:not(.is-what-i-do) .work_type").text()
//         .trim();
//       const workRole = $(this).find(".work_overlay:not(.is-what-i-do) .work_role").text()
//         .trim();

//       const workPageLink = $(this).find(".work_page-link");
//       const pageLinkText = workPageLink.text().trim();
//       const pageLinkUrl = workPageLink.attr("href");

//       const titleSeparator = workTitle ? ` // ${workTitle}` : '';
//       const pageLinkHtml = pageLinkText ?
//         `See more <a href="${pageLinkUrl}">${pageLinkText}</a> work` : '';
//       console.log(pageLinkHtml)
//       const caption =
//         `<span style="font-weight: 400;">${workType}</span>${titleSeparator}<br>${pageLinkHtml}`;

//       $(this).attr({
//         "data-fancybox": "work",
//         "data-src": workSrc,
//         "data-caption": caption,
//         "data-thumb": ""
//       });
//     });

//   // INITIATE & CONFIGURE
//   $("[data-fancybox]").fancybox({
//     loop: false,
//     arrows: true,
//     infobar: false,
//     thumbs: {
//       autoStart: false
//     },
//     slideShow: {
//       autoStart: false,
//       speed: 3000
//     },
//     mobile: {
//       arrows: true,
//       thumbs: {
//         autoStart: false
//       }
//     },
//     buttons: [
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
//       $(".nav-bar").css("padding-right", scrollWidth);
//     },
//     afterShow: function (instance, current) {
//       const fancyboxVideo = $(".fancybox-slide--video video")[
//         0]; // Get Fancybox video element
//       if (fancyboxVideo) {
//         const storedTime = currentTimeMap[current.src] ||
//           0; // Retrieve stored timestamp
//         fancyboxVideo.currentTime = storedTime; // Set timestamp
//         fancyboxVideo.play(); // Ensure it plays from that time
//       }
//     },

//     afterClose: function (instance, slide) {
//       $(".nav-bar").css("padding-right", "0px");
//     }

//   });

//   // -------------------------------
//   // MASONRY GRID
//   // -------------------------------

//   $('.work_list').each(function () {
//     var $grid = $(this).masonry({
//       itemSelector: '.work_item',
//       columnWidth: '.work_item',
//       percentPosition: true,
//       gutter: 0, // Adjust as needed
//     });

//     $grid.masonry('layout');

//     var intervalTime = 500;

//     setInterval(function () {
//       $grid.masonry('layout');
//       $('.work_list').css('opacity', 1);
//     }, intervalTime);

//     $(window).on('resize', function () {
//       $grid.masonry('layout');
//     });
//   });

//   $('.work_item, .work_list').css('min-height', '0');

// });
