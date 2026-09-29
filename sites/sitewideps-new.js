// Last updated: 2026-09-29 08:59:28

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

    // Only large areas count: small things (a button, a card image, a tag)
    // passing behind are skipped and the section around them decides. An area
    // must be at least 240px wide and cover the item from 32px above (or the
    // top of the screen) to 64px below its centre. Full-width bands (90% of the
    // viewport or more, e.g. the nav spacer on a dark page) always count, even
    // when they are short.
    const large = (hit, y) => {
      const b = hit.getBoundingClientRect();
      if (b.width >= window.innerWidth * 0.9 && b.top <= y && b.bottom >= y) return true;
      return b.width >= 240 && b.top <= Math.max(0, y - 32) && b.bottom >= y + 64;
    };

    const behind = (el) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      for (const hit of document.elementsFromPoint(x, y)) {
        if (nav.contains(hit) || hit === document.documentElement || hit.closest(".preloader_component")) continue;
        if (!large(hit, y)) continue;
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
  // the dropdown list; the panel opens and its links drop into place one after
  // another on a short, hard-stopping ease. Desktop: the floating panel wipes
  // down from the top. Mobile menu (below 992px): the list sits in the page
  // flow, so it slides open by height and the links below move down with it
  // instead of jumping. Closing is left to Webflow (instant). Web Animations
  // only: no styles are left behind.
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
        if (window.innerWidth < 992) {
          list.animate(
            [
              { height: "0px", overflow: "hidden" },
              { height: `${list.scrollHeight}px`, overflow: "hidden" },
            ],
            { duration: 360, easing: EASE }
          );
        } else {
          list.animate(
            [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)" }],
            { duration: 260, easing: EASE }
          );
        }
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

(() => {
  // News articles and categories.
  // 0. Article byline fallback (see below).
  // 1. Article pages: the header category ([data-news-category="link"], bound to
  //    News Category > Name) becomes a link to the News page with that filter set
  //    (/about/news?category_equal=<name>, the query Finsweet List v2 writes and reads).
  // 2. News page: each filter pill's radio (.news_filter-input) gets its category
  //    name as fs-list-value. The MCP cannot bind an attribute to a CMS field, so
  //    the name is copied from the pill text here, and Finsweet Attributes (List:
  //    filter, URL query, load more) is loaded afterwards so it reads the values.
  const NEWS_PATH = "/about/news";

  const init = () => {
    // Article byline: the name is bound to Author > Name; with no author set the
    // element renders empty, so show its data-article-author fallback ("Sitewide").
    document.querySelectorAll("[data-article-author]").forEach((el) => {
      if (!el.textContent.trim()) el.textContent = el.getAttribute("data-article-author");
    });

    document.querySelectorAll('[data-news-category="link"]').forEach((el) => {
      const name = el.textContent.trim();
      if (!name || el.querySelector("a")) return;
      const a = document.createElement("a");
      a.href = `${NEWS_PATH}?category_equal=${encodeURIComponent(name)}`;
      a.textContent = name;
      a.style.color = "inherit";
      a.style.textDecoration = "none";
      el.textContent = "";
      el.appendChild(a);
    });

    if (!document.querySelector('[fs-list-element="list"]')) return;
    document.querySelectorAll(".news_filter-input").forEach((input) => {
      const name = input.parentElement.textContent.trim();
      input.setAttribute("fs-list-value", name);
      input.value = name;
    });
    if (document.querySelector("script[src*='@finsweet/attributes']")) return;
    const s = document.createElement("script");
    s.type = "module";
    s.async = true;
    s.src = "https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js";
    s.setAttribute("fs-list", "");
    document.head.appendChild(s);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // Case Studies list: the sticky number in the left column (.cases_number,
  // position: sticky natively) follows the case study at the middle of the
  // screen: 01, 02, 03... The old digits roll out and the new ones roll in on
  // the same mechanical ease as the nav dropdowns (up when scrolling down,
  // down when scrolling back). Mobile has no sticky number; the cards stack
  // natively there (cases_item position: sticky).
  const EASE = "cubic-bezier(0.7, 0, 0.2, 1)";
  const init = () => {
    const num = document.querySelector(".cases_number");
    const items = [...document.querySelectorAll(".cases_list .cases_item")];
    if (!num || !items.length) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const label = (i) => String(i).padStart(2, "0");
    let current = 1;
    let busy = null;

    const show = (i) => {
      if (i === current) return;
      const dir = i > current ? 1 : -1;
      current = i;
      if (reduce) {
        num.textContent = label(i);
        return;
      }
      if (busy) busy.cancel();
      busy = num.animate(
        [
          { transform: "translateY(0)", opacity: 1 },
          { transform: `translateY(${-dir * 0.35}em)`, opacity: 0 },
        ],
        { duration: 140, easing: EASE }
      );
      busy.onfinish = () => {
        busy = null;
        num.textContent = label(current);
        num.animate(
          [
            { transform: `translateY(${dir * 0.35}em)`, opacity: 0 },
            { transform: "translateY(0)", opacity: 1 },
          ],
          { duration: 200, easing: EASE }
        );
      };
    };

    // A thin line across the middle of the viewport: whichever card crosses it
    // is the current one.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) show(items.indexOf(e.target) + 1);
        });
      },
      { rootMargin: "-50% 0px -50% 0px" }
    );
    items.forEach((el) => io.observe(el));
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
