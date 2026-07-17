// Last updated: 2026-07-17 17:45:37 +01:00

// // INSERT TABLE SCROLL WRAPPER
// $('.table_component').each(function () {
//   const scrollElement = $('.global_table-scroll').first().clone();
//   $(this).after(scrollElement);
// });

// // SET ALL PROCESS BLOCKS TO SAME HEIGHT
// let tallest = 0;
// $('.process_content-item').each(function () {
//   const height = $(this).outerHeight(); // includes padding and border
//   if (height > tallest) {
//     tallest = height;
//   }
// });
// $('.process_content-item').each(function () {
//   $(this).outerHeight(tallest); // this sets the total height correctly
// });

// // PAGE LOAD ANIMATION
// $(document).ready(function () {
//   const hasVisited = localStorage.getItem('hasVisited');
//   const expiry = localStorage.getItem('hasVisitedExpiry');
//   const now = Date.now();

//   if (!hasVisited || now > parseInt(expiry)) {
//     localStorage.setItem('hasVisited', 'true');
//     localStorage.setItem('hasVisitedExpiry', now + 2 * 24 * 60 * 60 * 1000); // 30 minutes

//     $(".global_animation").css("display", "flex");
//     const fullText = "Mindwave";
//     const $target = $(".global_animation-text");
//     $target.empty();
//     const tl = gsap.timeline({ repeat: 0 });
//     tl.to({}, { duration: 0.3 }); // Wait 300ms before starting
//     fullText.split("").forEach((char, i) => {
//       tl.call(() => {
//         const $span = $("<span>").text(char);
//         if (i >= 4) {
//           if (i === 4) {
//             const $wrapper = $("<span>").addClass("text-color-gradient");
//             $target.append($wrapper);
//             $wrapper.append($span);
//           } else {
//             $target.find(".text-color-gradient").append($span);
//           }
//         } else {
//           $target.append($span);
//         }
//       }, null, "+=0.13");
//     });
//     tl.to({}, { duration: 0.2 })
//       .to(".global_animation-text-wrapper", { opacity: 0, duration: 0.3 })
//       .to(".global_animation-door", { width: "0%", duration: 1 })
//       .set(".global_animation", { display: "none" });
//   } else {
//     $(".global_animation").css("display", "none");
//   }
// });

// NAV WAVE ANIMATION
// $(".nav_link.is-test, .nav_logo-text").each(function () {
//   const text = $(this).text();
//   const wrapped = text
//     .split("")
//     .map((char) => (char === " " ? `<span>&nbsp;</span>` : `<span>${char}</span>`))
//     .join("");
//   $(this).html(wrapped);
// });

// $(".nav_link.is-test, .nav_logo-text").on("mouseenter", function () {
//   gsap.to($(this).find("span"), {
//     y: -12,
//     stagger: {
//       each: 0.04,
//       from: "start",
//       yoyo: true,
//       repeat: 1,
//     },
//     ease: "power2.out",
//     duration: 0.2,
//   });
// });
