// Last updated: 2026-09-29 18:06:04

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
  // position: sticky natively) shows which case study is at the top. It moves
  // on only when a case study's top edge comes within 20px of the bottom of
  // the nav (just before it slides under it), and only the digits that change
  // slide: up when scrolling down, down when scrolling back (01 -> 02 moves just
  // the "2"). Each digit sits in an overflow-hidden slot built here, so there is
  // no fade or flicker. Tablet works like desktop. From landscape down the
  // number sticks under the nav (top 5.25rem) and the cards stack natively
  // beneath it (cases_item position: sticky, top 9rem).
  const EASE = "cubic-bezier(0.7, 0, 0.2, 1)";
  const OFFSET = 20;
  const init = () => {
    const num = document.querySelector(".cases_number");
    const items = [...document.querySelectorAll(".cases_list .cases_item")];
    if (!num || !items.length) return;
    const nav = document.querySelector(".nav_container");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const label = (i) => String(i).padStart(2, "0");

    const slot = (ch) => {
      const s = document.createElement("span");
      s.style.cssText = "display:inline-block;position:relative;overflow:hidden;vertical-align:top;";
      const d = document.createElement("span");
      d.style.cssText = "display:inline-block;";
      d.textContent = ch;
      s.appendChild(d);
      return s;
    };
    num.textContent = "";
    const slots = label(1).split("").map((ch) => num.appendChild(slot(ch)));
    let current = 1;

    const roll = (s, ch, dir) => {
      // Settle any roll still in flight: keep the newest digit, drop the rest.
      const kids = [...s.children];
      kids.forEach((k) => k.getAnimations().forEach((a) => a.cancel()));
      kids.slice(0, -1).forEach((k) => k.remove());
      const old = kids[kids.length - 1];
      old.style.position = "";
      if (old.textContent === ch) return;
      if (reduce) {
        old.textContent = ch;
        return;
      }
      const next = document.createElement("span");
      next.style.cssText = "display:inline-block;position:absolute;left:0;top:0;";
      next.textContent = ch;
      s.appendChild(next);
      const opts = { duration: 420, easing: EASE, fill: "forwards" };
      old.animate([{ transform: "translateY(0)" }, { transform: `translateY(${-dir * 100}%)` }], opts);
      next.animate([{ transform: `translateY(${dir * 100}%)` }, { transform: "translateY(0)" }], opts).onfinish = () => {
        next.style.position = "";
        next.getAnimations().forEach((a) => a.cancel());
        old.remove();
      };
    };

    const show = (i) => {
      if (i === current) return;
      const dir = i > current ? 1 : -1;
      current = i;
      label(i).split("").forEach((ch, k) => roll(slots[k], ch, dir));
    };

    let queued = false;
    const sync = () => {
      queued = false;
      const line = (nav ? nav.getBoundingClientRect().bottom : 0) + OFFSET;
      let i = 1;
      items.forEach((el, k) => {
        // Sticky cards (landscape and below) stop under the number, so they
        // count once they are within OFFSET of their stuck position.
        const cs = getComputedStyle(el);
        const at = cs.position === "sticky" ? parseFloat(cs.top) + OFFSET : line;
        if (el.getBoundingClientRect().top <= at) i = k + 1;
      });
      show(i);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(sync);
      },
      { passive: true }
    );
    sync();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // CMS links to an item's own page. The API cannot set a "current item" link
  // inside Collection Lists on template pages (it renders "#"), so a hidden
  // Text Block (.link-slug) bound to the item's Slug carries the path prefix in
  // data-link-prefix (e.g. "/case-studies/"). The link it sits in, or the first
  // link beside it, gets prefix + slug. Used by the More case studies rows, the
  // Industries case study rows and the Industries service "Learn more" buttons.
  const init = () => {
    document.querySelectorAll("[data-link-prefix]").forEach((el) => {
      const slug = el.textContent.trim();
      const link = el.closest("a") || (el.parentElement && el.parentElement.querySelector("a"));
      if (slug && link) link.setAttribute("href", el.getAttribute("data-link-prefix") + slug);
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // Testimonial cards: the "Read case study" button (the site button component,
  // inside div.testimonial-card_cta[data-case-study-link]) links to the
  // referenced Case Study. The MCP cannot bind a link to a referenced item's
  // page, so a hidden element bound to Case Study > Slug
  // ([data-case-study-slug]) sits in the card; the button gets
  // /case-studies/<slug>, or its wrapper is hidden when no case study is set.
  const init = () => {
    document.querySelectorAll("[data-case-study-link]").forEach((wrap) => {
      const link = wrap.tagName === "A" ? wrap : wrap.querySelector("a");
      const card = wrap.closest(".testimonial-card") || wrap.parentElement;
      const slugEl = card && card.querySelector("[data-case-study-slug]");
      const slug = slugEl ? slugEl.textContent.trim() : "";
      if (slug && link) link.href = `/case-studies/${slug}`;
      else wrap.style.display = "none";
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // Testimonial stats: the two stats sit side by side (flex-wrap) and a card
  // with longer labels wraps sooner than the others. When any card's stats
  // wrap, every card gets .is-stacked (each stat takes a full line; CSS in
  // global_site-styles) so they all fold together. Rechecked on resize.
  const init = () => {
    const rows = [...document.querySelectorAll(".testimonial-card_stats")];
    if (!rows.length) return;
    const wraps = (row) => {
      const tops = [...row.querySelectorAll(".testimonial-card_stat")]
        .filter((s) => s.offsetParent)
        .map((s) => Math.round(s.getBoundingClientRect().top));
      return tops.length > 1 && tops.some((t) => t !== tops[0]);
    };
    const sync = () => {
      rows.forEach((r) => r.classList.remove("is-stacked"));
      const fold = rows.some(wraps);
      rows.forEach((r) => r.classList.toggle("is-stacked", fold));
    };
    let queued = false;
    window.addEventListener("resize", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        sync();
      });
    });
    if (document.fonts) document.fonts.ready.then(sync);
    sync();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // Horizontal sliders ([data-slider] on the scrolling Collection List Wrapper,
  // e.g. the home services and case studies rows). Adds, on top of the native
  // scroll and the arrow buttons:
  //   - mouse click and drag (snaps to the nearest card on release; a drag does
  //     not trigger the card's link)
  //   - Shift + mouse wheel, and sideways trackpad swipes, scroll sideways
  //     (the event stops here so Lenis does not also scroll the page)
  //   - Left / Right arrow keys move one card while the pointer is over the
  //     slider or after it has been clicked / focused (it has tabindex="0")
  const init = () => {
    const sliders = [...document.querySelectorAll("[data-slider]")];
    if (!sliders.length) return;
    let hovered = null;
    let active = null;

    const step = (el) => {
      const item = el.querySelector(".w-dyn-item") || el.firstElementChild;
      if (!item) return el.clientWidth * 0.8;
      const list = item.parentElement;
      const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
      return item.getBoundingClientRect().width + gap;
    };

    sliders.forEach((el) => {
      el.addEventListener("pointerenter", () => (hovered = el));
      el.addEventListener("pointerleave", () => { if (hovered === el) hovered = null; });
      el.addEventListener("focus", () => (active = el));

      el.addEventListener("wheel", (e) => {
        const sideways = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (!e.shiftKey && !sideways) return;
        const delta = sideways ? e.deltaX : e.deltaY;
        const max = el.scrollWidth - el.clientWidth;
        if ((delta < 0 && el.scrollLeft <= 0) || (delta > 0 && el.scrollLeft >= max - 1)) return;
        e.preventDefault();
        e.stopPropagation();
        el.scrollBy({ left: delta, behavior: "auto" });
      }, { passive: false });

      let down = false, dragged = false, startX = 0, startLeft = 0;
      el.style.cursor = "grab";
      el.addEventListener("dragstart", (e) => e.preventDefault());
      el.addEventListener("pointerdown", (e) => {
        active = el;
        if (e.pointerType !== "mouse" || e.button !== 0) return;
        down = true; dragged = false; startX = e.clientX; startLeft = el.scrollLeft;
      });
      window.addEventListener("pointermove", (e) => {
        if (!down) return;
        const dx = e.clientX - startX;
        if (!dragged && Math.abs(dx) < 5) return;
        if (!dragged) {
          dragged = true;
          el.style.scrollSnapType = "none";
          el.style.scrollBehavior = "auto";
          el.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
        }
        el.scrollLeft = startLeft - dx;
      });
      window.addEventListener("pointerup", () => {
        if (!down) return;
        down = false;
        el.style.cursor = "grab";
        document.body.style.userSelect = "";
        if (!dragged) return;
        const s = step(el);
        const target = Math.round(el.scrollLeft / s) * s;
        el.scrollTo({ left: target, behavior: "smooth" });
        setTimeout(() => { el.style.scrollSnapType = ""; el.style.scrollBehavior = ""; }, 450);
      });
      // Swallow the click that ends a drag so links inside the cards stay put.
      el.addEventListener("click", (e) => {
        if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; }
      }, true);
    });

    document.addEventListener("pointerdown", (e) => { if (!e.target.closest("[data-slider]")) active = null; });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.target.closest("input, textarea, select, [contenteditable]")) return;
      const el = hovered || active;
      if (!el) return;
      e.preventDefault();
      el.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * step(el), behavior: "smooth" });
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

(() => {
  // Slider arrows outside the home page (e.g. the Testimonial Slider component):
  // a [data-slider-group] holds the [data-slider] track and [data-slider="prev"] /
  // [data-slider="next"] buttons. Each click moves one card; the buttons get
  // .is-disabled at either end. (Home's own groups have no data-slider-group and
  // keep their page script.)
  const init = () => {
    document.querySelectorAll("[data-slider-group]").forEach((group) => {
      const track = group.querySelector("[data-slider='true']");
      const prev = group.querySelector("[data-slider='prev']");
      const next = group.querySelector("[data-slider='next']");
      if (!track || !prev || !next) return;
      const step = () => {
        const item = track.querySelector(".w-dyn-item");
        if (!item) return track.clientWidth;
        const gap = parseFloat(getComputedStyle(item.parentElement).columnGap) || 0;
        return item.getBoundingClientRect().width + gap;
      };
      const setState = (btn, off) => {
        btn.classList.toggle("is-disabled", off);
        btn.setAttribute("aria-disabled", off ? "true" : "false");
      };
      const update = () => {
        const max = track.scrollWidth - track.clientWidth;
        setState(prev, track.scrollLeft <= 1);
        setState(next, max <= 1 || track.scrollLeft >= max - 1);
      };
      [[prev, -1], [next, 1]].forEach(([btn, dir]) => {
        btn.addEventListener("click", () => {
          if (btn.classList.contains("is-disabled")) return;
          track.scrollBy({ left: dir * step(), behavior: "smooth" });
        });
      });
      track.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      window.addEventListener("load", update);
      update();
    });
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
