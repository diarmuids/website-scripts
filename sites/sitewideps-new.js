// Last updated: 2026-09-28 19:11:05

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
  // transition animates it. nav_link.is-scrolled puts the regular grey/navy pills
  // back over the home page's white nav variant; the CTAs are skipped so they
  // keep their own navy combos.
  const init = () => {
    const targets = document.querySelectorAll(
      ".nav_container, .nav_logo-img, .nav_component .nav_link:not(.is-cta):not(.is-cta-light)"
    );
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
  // Nav items follow what is behind them. At an item's centre, look down the
  // stack of page elements under the nav: the first image/video (or url()
  // background) or opaque background colour decides.
  //   Logo: dark or image -> nav_logo-img.is-on-dark (white logo); light ->
  //         nav_logo-img.is-on-light (original colours, overriding the dark-hero
  //         variant's white filter). While the mobile menu is open,
  //         nav_logo-img.is-open wins, so neither is set.
  //   CTA:  dark or image -> nav_link.is-cta.is-on-dark / .is-cta-light.is-on-dark
  //         (white button, navy text); light keeps the navy button.
  // The preloader curtain (head code) is ignored so it cannot flip anything.
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
    const ctas = [...nav.querySelectorAll(".nav_link.is-cta, .nav_link.is-cta-light")];

    const behind = (el) => {
      const r = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      for (const hit of stack) {
        if (nav.contains(hit) || hit === document.documentElement || hit.closest(".preloader_component")) continue;
        const t = tone(hit);
        if (t) return t;
      }
      return "light";
    };

    let queued = false;
    const sync = () => {
      queued = false;
      const logo = logos.find((el) => el.offsetParent) || logos[0];
      const logoTone = logo.classList.contains("is-open") ? null : behind(logo);
      logos.forEach((el) => {
        el.classList.toggle("is-on-dark", logoTone === "dark");
        el.classList.toggle("is-on-light", logoTone === "light");
      });
      ctas.forEach((el) => {
        el.classList.toggle("is-on-dark", !!el.offsetParent && behind(el) === "dark");
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

(() => {
  // Nav dropdown open animation: a mechanical "stack". Webflow adds w--open to
  // the dropdown list; the panel then wipes down from the top and its links
  // drop into place one after another on a short, hard-stopping ease. Closing
  // is left to Webflow (instant). Web Animations only: no styles are left behind.
  const EASE = "cubic-bezier(0.7, 0, 0.2, 1)";
  const init = () => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.querySelectorAll(".nav_component .w-dropdown-list").forEach((list) => {
      let wasOpen = list.classList.contains("w--open");
      new MutationObserver(() => {
        const open = list.classList.contains("w--open");
        if (open === wasOpen) return;
        wasOpen = open;
        if (!open) return;
        list.animate(
          [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
          { duration: 260, easing: EASE }
        );
        const links = [...list.querySelectorAll(".nav_dropdown-link")].filter((el) => el.offsetParent);
        links.forEach((el, i) => {
          el.animate(
            [
              { opacity: 0, transform: "translateY(-0.5rem)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 200, delay: 60 + i * 40, easing: EASE, fill: "backwards" }
          );
        });
      }).observe(list, { attributes: true, attributeFilter: ["class"] });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
