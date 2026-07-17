// console.log("TEST")

$(document).on('click', '[data-node-type="commerce-add-to-cart-option-select"]', function () {
  $(this).find('option:disabled').each(function () {
    const text = $(this).text().trim();
    if (!text.includes('(Sold out)')) {
      $(this).text(text + ' (Sold out)');
    }
  });
});

// $(document).on('click', '.commerce-add-to-cart-option-select', function () {
//   $(this).find('option:disabled').each(function () {
//     const text = $(this).text().trim();
//     if (!text.includes('(Sold out)')) {
//       $(this).text(text + ' (Sold out)');
//     }
//   });
// });

// // GET USERS COUNTRY BASED ON IP
// async function getCountryCode() {
//   try {
//     let response = await fetch(
//       'https://api.ipgeolocation.io/ipgeo?apiKey=9232a2673f724b0bb341bda520e66261');
//     let data = await response.json();
//     if (data.country_code2) {
//       return data.country_code2; // Returns the two-letter country code
//     } else {
//       return null;
//     }
//   } catch (error) {
//     console.error("Error retrieving country information:", error);
//     return "Error retrieving country information.";
//   }
// }

// // FUNCTION TO HIDE GIFTBOXES TO UK CUSTOMERS
// function hideCupProducts() {
//   let productItems = document.querySelectorAll('.product-item');
//   productItems.forEach(item => {
//     if (item.textContent.includes("Cup")) {
//       item.style.display = 'none';
//     }
//   });
// }

// // RUN FUNCTION
// getCountryCode().then(countryCode => {
//   // console.log("The user is browsing from country code:", countryCode);
//   if (countryCode !== "IE") { // Not equal to IE
//     hideCupProducts();
//   }
// });

// // DISABLE CHECKOUT BUTTON AND SHOW WARNING TO CUSTOMERS TRYING TO ORDER GIFT BOXES WITH CUPS OUTSIDE IE
// $(document).ready(function () {
//   function updateCheckout() {
//     const country = $('.w-commerce-commercecheckoutshippingcountryselector').val();
//     const containsCup = $('.checkout-block .cart-name').filter(function () {
//       return $(this).text().toLowerCase().includes('cup');
//     }).length > 0;
//     if (containsCup && country !== 'IE') { // Not equal to IE
//       $('.w-commerce-commercecheckoutplaceorderbutton').addClass('is-disabled')
//       $('.checkout_uk-warning').show();
//     } else {
//       $('.w-commerce-commercecheckoutplaceorderbutton').removeClass('is-disabled')
//       $('.checkout_uk-warning').hide();
//     }
//   }
//   $('.w-commerce-commercecheckoutshippingcountryselector').on('change', updateCheckout);
//   setInterval(updateCheckout, 400);
// });

// // RUN FUNCTION
// getCountryCode().then(countryCode => {
//   // console.log("The user is browsing from country code:", countryCode);
//   if (countryCode === "GB") { // GB or IE
//     hideCupProducts();
//   }
// });

// // DISABLE CHECKOUT BUTTON AND SHOW WARNING TO CUSTOMERS TRYING TO ORDER GIFT BOXES WITH CUPS TO THE UK
// $(document).ready(function () {
//   function updateCheckout() {
//     const country = $('.w-commerce-commercecheckoutshippingcountryselector').val();
//     const containsCup = $('.checkout-block .cart-name').filter(function () {
//       return $(this).text().toLowerCase().includes('cup');
//     }).length > 0;
//     if (containsCup && country === 'GB') {
//       $('.w-commerce-commercecheckoutplaceorderbutton').addClass('is-disabled')
//       $('.checkout_uk-warning').show();
//     } else {
//       $('.w-commerce-commercecheckoutplaceorderbutton').removeClass('is-disabled')
//       $('.checkout_uk-warning').hide();
//     }
//   }
//   $('.w-commerce-commercecheckoutshippingcountryselector').on('change', updateCheckout);
//   setInterval(updateCheckout, 400);
// });
