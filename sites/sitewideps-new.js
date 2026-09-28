// Last updated: 2026-09-28 15:22:59

// Sitewide PS: new-build site script (sites/sitewideps-new.js).
// Loaded by the new Webflow build's footer loader: dev.wsitefiles.com/sites/sitewideps-new.js,
// falling back to wsitefiles.com/sites/sitewideps-new.js. The live site keeps its own script.
(() => {
  // Mobile menu open state. Webflow marks only the menu button (w--open), so
  // mirror it onto the native combo classes styled in the Designer:
  //   nav_component.is-open grey top bar behind the logo while the menu is open
  //                         (not nav_bg: its scroll interaction sets opacity inline)
  //   nav_logo-img.is-open  drops the dark-hero variant's white filter
  //   body.overflow-hidden  stops the page scrolling behind the menu
  // Lenis (global `lenis`, set in the footer code) ignores overflow, so pause it too.
  const init = () => {
    const nav = document.querySelector(".nav_component");
    const button = nav && nav.querySelector(".w-nav-button");
    if (!button) return;
    const targets = [nav, ...nav.querySelectorAll(".nav_logo-img")];

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

(() => {
  // Shrink the nav bar once the page scrolls. nav_container's height comes from
  // Nav/height; the native combos nav_container.is-scrolled (Nav/height-scrolled)
  // and nav_logo-img.is-scrolled (smaller logo) take over, and each class's own
  // transition animates it.
  const init = () => {
    const targets = document.querySelectorAll(".nav_container, .nav_logo-img");
    if (!targets.length) return;
    let scrolled = null;
    const sync = () => {
      const now = window.scrollY > 20;
      if (now === scrolled) return;
      scrolled = now;
      targets.forEach((el) => el.classList.toggle("is-scrolled", now));
    };
    window.addEventListener("scroll", sync, { passive: true });
    sync();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // Logo colour follows what is behind it. At the logo's centre, look down the
  // stack of page elements under the nav: the first image/video (or url()
  // background) or opaque background colour decides. Dark or image: the native
  // combo nav_logo-img.is-on-dark (white logo); light: nav_logo-img.is-on-light
  // (original colours, overriding the dark-hero variant's white filter).
  // While the mobile menu is open, nav_logo-img.is-open wins, so neither is set.
  const MEDIA = ["IMG", "VIDEO", "CANVAS", "PICTURE", "IFRAME"];
  const tone = (el) => {
    if (MEDIA.includes(el.tagName)) return "dark";
    const cs = getComputedStyle(el);
    if (cs.backgroundImage.includes("url(")) return "dark";
    const m = cs.backgroundColor.match(/[\d.]+/g);
    if (!m) return null;
    const [r, g, b, a = 1] = m.map(Number);
    if (a < 0.5) return null;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140 ? "dark" : "light";
  };

  const init = () => {
    const nav = document.querySelector(".nav_component");
    const logos = nav ? [...nav.querySelectorAll(".nav_logo-img")] : [];
    if (!logos.length) return;
    let queued = false;
    const sync = () => {
      queued = false;
      const logo = logos.find((el) => el.offsetParent) || logos[0];
      const open = logo.classList.contains("is-open");
      let result = "light";
      if (!open) {
        const r = logo.getBoundingClientRect();
        const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        for (const el of stack) {
          if (nav.contains(el) || el === document.documentElement) continue;
          const t = tone(el);
          if (t) { result = t; break; }
        }
      }
      logos.forEach((el) => {
        el.classList.toggle("is-on-dark", !open && result === "dark");
        el.classList.toggle("is-on-light", !open && result === "light");
      });
    };
    const queue = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.addEventListener("load", queue);
    new MutationObserver(queue).observe(logos[0], { attributes: true, attributeFilter: ["class"] });
    queue();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
