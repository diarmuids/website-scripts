// Last updated: 2026-09-28 13:34:11

// Sitewide PS: new-build site script (sites/sitewideps-new.js).
// Loaded by the new Webflow build's footer loader: dev.wsitefiles.com/sites/sitewideps-new.js,
// falling back to wsitefiles.com/sites/sitewideps-new.js. The live site keeps its own script.
(() => {
  // Mobile menu open state. Webflow marks only the menu button (w--open), so
  // mirror it onto the native combo classes styled in the Designer:
  //   nav_bg.is-open        grey top bar behind the logo while the menu is open
  //   nav_logo-img.is-open  drops the dark-hero variant's white filter
  //   body.overflow-hidden  stops the page scrolling behind the menu
  // Lenis (global `lenis`, set in the footer code) ignores overflow, so pause it too.
  const init = () => {
    const nav = document.querySelector(".nav_component");
    const button = nav && nav.querySelector(".w-nav-button");
    if (!button) return;
    const targets = nav.querySelectorAll(".nav_bg, .nav_logo-img");

    const sync = () => {
      const open = button.classList.contains("w--open");
      targets.forEach((el) => el.classList.toggle("is-open", open));
      document.body.classList.toggle("overflow-hidden", open);
      if (typeof lenis !== "undefined" && lenis) open ? lenis.stop() : lenis.start();
    };

    new MutationObserver(sync).observe(button, { attributes: true, attributeFilter: ["class"] });
    sync();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
