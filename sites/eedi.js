// Last updated: 2026-07-17 17:45:37 +01:00

// // ADD BREADCRUMB CATEGORY LINK TO BREADCRUMB WRAPPER
// $('.bread-cat_link').each(function () {
//   $('.breadcrumb_wrapper').append($(this));
// });
// $('.breadcrumb_wrapper .bread-cat_list-wrapper').hide();

// // ADD BREADCRUMB CATEGORY LINK TO BREADCRUMB WRAPPER
// $('.bread-cat_list-wrapper .breadcrumb_inner').each(function () {
//   $(this).insertBefore('.bread-cat_list-wrapper');
// });
// $('.breadcrumb_wrapper .bread-cat_list-wrapper').hide();

// // SHOW CORRECT CATEGORY BREADCRUMB (I.E. LONGEST)
// var breadcrumbItems = $('.breadcrumb_item');
// if (breadcrumbItems.length > 1) {
//   var itemToKeep = breadcrumbItems.toArray().reduce(function (prev, current) {
//     return $(prev).find('.w-condition-invisible').length < $(current).find(
//       '.w-condition-invisible').length ? prev : current;
//   });
//   breadcrumbItems.not(itemToKeep).remove();
// }

// // ADD BREADCRUMB LINKS TO BREADCRUMB WRAPPER
// $('.breadcrumb_item .breadcrumb_inner').each(function () {
//   $(this).insertBefore('.breadcrumb_list-wrapper');
// });
// $('.breadcrumb_wrapper .breadcrumb_list-wrapper').hide();

// // //-------------------------------------------------//
// // //------------------NAV----------------------------//
// // //-------------------------------------------------//

// $('.nav_dd-link.w-condition-invisible').each(function () {
//   $(this).remove();
// });

// // ADD ATTRIBUTES TO NAV DD SHOP LINKS
// $('.nav_dd-link').each(function () {
//   const mainText = $(this).siblings('.nav_cat-main').text().trim().toLowerCase();
//   const firstText = $(this).siblings('.nav_cat-first').text().trim().toLowerCase();
//   if (mainText) {
//     $(this).attr('data-text-main', mainText);
//   }
//   if (firstText) {
//     $(this).attr('data-text-first', firstText);
//   }
//   $(this).siblings('.nav_cat-main, .nav_cat-first').remove();
// });

// // ADD LINKS TO CORRECT COLUMN
// $('.is-main [data-text-first]').each(function () {
//   $('.nav_shop-dd_col.is-second').append($(this));
//   $(this).hide()
// });

// $('.is-main [data-text-main]').each(function () {
//   $('.nav_shop-dd_col.is-first').append($(this));
//   $(this).hide()
// });

// // ADD VIEW ALL BUTTON
// const uniqueFirstTexts = new Set();
// $('[data-text-first]').each(function () {
//   const linkText = $(this).attr('data-text-first').trim().toLowerCase();
//   if (linkText) {
//     uniqueFirstTexts.add(linkText);
//   }
// });
// uniqueFirstTexts.forEach(linkText => {
//   const link = $('<a>').attr('href', '/category/' + linkText).attr("data-text-first", linkText)
//     .addClass('nav_dd-link is-shop').text(
//       `View All ${linkText}`);
//   $('.nav_shop-dd_col.is-second').prepend(link);
//   link.hide()
// });
// const uniqueMainTexts = new Set();
// $('[data-text-main]').each(function () {
//   const linkText = $(this).attr('data-text-main').trim().toLowerCase();
//   if (linkText) {
//     uniqueMainTexts.add(linkText);
//   }
// });
// uniqueMainTexts.forEach(linkText => {
//   const link = $('<a>').attr('href', '/category/' + linkText).attr("data-text-main", linkText)
//     .addClass('nav_dd-link is-shop').text(
//       `View All ${linkText}`);
//   $('.nav_shop-dd_col.is-first').prepend(link);
//   link.hide()
// });

// // SHOW FIRST MENU WHEN LINK IS CLICKED
// $('.is-main .nav_dd-link').on('click', function () {
//   const mainlinkText = $(this).text().trim().toLowerCase();
//   const targetElement = $(`.is-first [data-text-main="${mainlinkText}"]`);
//   if (targetElement.length) {
//     $("[data-text-main], [data-text-first]").hide()
//     targetElement.show();
//   }
// });

// // SHOW SECOND MENU WHEN LINK IS CLICKED
// $('.is-first .nav_dd-link').on('click', function () {
//   const secondlinkText = $(this).text().trim().toLowerCase();
//   const targetElement = $(`.is-second [data-text-first="${secondlinkText}"]`);
//   if (targetElement.length) {
//     $("[data-text-first]").hide()
//     targetElement.show();
//   }
// });

// // // ---------------------------------------------------------------//
// // // ---------------------------------------------------------------//

// // UPDATE SALE TAG TEXT TO "30% OFF"
// setInterval(() => {
//   $('.prod-list_link, .cr-product').each(function () {
//     const comparePrice = parseFloat($(this).find('.prod-list_compare-text').text()
//       .replace(
//         /[^0-9.]/g, ''));
//     const currentPrice = parseFloat($(this).find('.prod-list_price-text').text()
//       .replace(
//         /[^0-9.]/g, ''));

//     if (comparePrice > currentPrice) {
//       const percentageOff = ((comparePrice - currentPrice) / comparePrice) * 100;
//       $(this).find('.prod-list_sale-tag-text').text(
//         `${percentageOff.toFixed(0)}% off`);
//     }
//   });
// }, 500);

// // CHECK IF NAV MENU IS OPEN / CLOSED
// setInterval(function () {
//   if (window.innerWidth > 767) {
//     if ($(".w-nav-button.w--open").length || $(".w-dropdown-toggle.w--open").length) {
//       $(".nav_component").addClass("is-open");
//     } else {
//       $(".nav_component").removeClass("is-open");
//     }
//   }
// }, );

// setInterval(function () {
//   if (window.innerWidth < 767) {
//     if ($(".w-nav-button.w--open").length) {
//       $(".nav_component").addClass("is-open");
//     } else {
//       $(".nav_component").removeClass("is-open");
//     }
//   }
// }, );

// // STOP MENU FROM CLOSING WHEN NAV LINK CLICKED ON MOBILE
// $('.nav_menu a').on('click', function (event) {
//   event.stopPropagation();
// });
