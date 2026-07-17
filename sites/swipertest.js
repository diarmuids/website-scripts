// Last updated: 2026-07-17 17:45:37 +01:00

/* START: Swiper 1 - Swiper Simple Starter 1 */
document.querySelectorAll('[swiper="projects"]').forEach((sliderComponent) => {
  const sliderEl = sliderComponent.querySelector('[swiper="slider"]');
  const buttonNextEl = sliderComponent.querySelector('[swiper="next-button"]');
  const buttonPrevEl = sliderComponent.querySelector('[swiper="prev-button"]');
  const paginationEl = sliderComponent.querySelector('[swiper="pagination"]');

  new Swiper(sliderEl, {
    slidesPerView: 1,
    slidesPerGroup: 1,
    a11y: true,
    spaceBetween: 16,
    direction: "horizontal",
    loop: true,
    initialSlide: 1,
    grabCursor: true,
    loopedSlides: 2,
    speed: 500,
    autoHeight: false,
    allowTouchMove: true,
    simulateTouch: true,
    touchEventsTarget: 'container',
    preventInteractionOnTransition: false,
    autoplay: {
      delay: 4000,
      disableOnInteraction: true
    },
    effect: "creative",
    creativeEffect: {
      prev: {
        shadow: true,
        translate: ["-90%", 0, -500]
      },
      next: {
        shadow: true,
        translate: ["90%", 0, -500]
      }
    },
    navigation: {
      nextEl: buttonNextEl,
      prevEl: buttonPrevEl,
    },
    pagination: {
      el: paginationEl,
      clickable: false,
      bulletClass: "new-swiper-pagination-bullet",
      /*renderBullet: function (i, n) {
        return '<div class="' + n +
          '"><div class="custom-header-pagination-bullet-inner"></div><div class="custom-header-pagination-bullet-circle"><svg viewBox="0 0 200 200"><circle class="circle" cx="100" cy="100" r="75"/></svg></div></div>'
      }*/
    },
    breakpoints: {
      // when window width is >= 768px
      768: {
        spaceBetween: 32,
      },
    },
  });
});
/* END: Swiper 1 - Swiper Simple Starter 1 */

const swiper = document.querySelector('.swiper').swiper;

$('.swiper').on('click', '.swiper-slide-next', function () {
  swiper.slideNext();
});

$('.swiper').on('click', '.swiper-slide-prev', function () {
  swiper.slidePrev();
});



const initFsComponents = async e => {
  const s = window?.finsweetComponentsConfigLoading,
    i = document?.querySelector("script[fs-components-src]"); if (void 0 !== import.meta && !
      i && !s) {
    document?.querySelector(
      'script[finsweet="components"][async][type="module"]'); const s = await import(import.meta
        .url),
        i = Object.keys(s) || []; return new Promise(((s, t) => {
          const n = document
            .createElement("script");
          n.src = e, n.type = "module", n.async = !0, n.setAttribute("fs-components-src",
            import.meta.url), n.setAttribute("fs-components-installed", i?.join(",")), n
              .onload = () => s(), n.onerror = () => t(new Error("Failed to load script")),
            document.head.appendChild(n)
        }))
  }
};
initFsComponents("https://slater.app/8685/19163.js");
export const slider = {
  "fs-slider-instance='fs-slider'": {
    slideActiveClass: "is-slide-active",
    slideNextClass: "is-slide-next", slidePrevClass: "is-slide-previous", direction: "horizontal",
    loop: !0, autoHeight: !0, allowTouchMove: !0, centeredSlides: !0, slideToClickedSlide: !0,
    initialSlide: 0, speed: 300, followFinger: !0, keyboard: !0, mousewheel: !0, effect: "slide",
    pagination: {
      el: "[fs-slider-instance='fs-slider'] [fs-slider-element='pagination']",
      type: "bullets", bulletElement: "div", bulletActiveClass: "is-bullet-active", clickable: !
        0
    },
    navigation: {
      prevEl: "[fs-slider-instance='fs-slider'] [fs-slider-element='previous']",
      nextEl: "[fs-slider-instance='fs-slider'] [fs-slider-element='next']", hideOnClick: !1,
      disabledClass: "is-nav-disabled"
    }, autoplay: {
      delay: 3050, disableOnInteraction: !0,
      stopOnLastSlide: !1, reverseDirection: !1, pauseOnMouseEnter: !1
    },
    scrollbar: {
      el: "[fs-slider-instance='fs-slider'] [fs-slider-element='scrollbar']",
      draggable: !0, hide: !1, snapOnRelease: !1
    }, breakpoints: {
      320: {
        slidesPerView: 1,
        slidesPerGroup: 1, spaceBetween: 16
      }, 991: {
        slidesPerView: 3, slidesPerGroup: 1,
        spaceBetween: 16
      }
    }
  }
};


//


import { a as d } from "./dist/chunk-J7NTLVPZ.js";
import { y as f } from "./dist/chunk-KU7Q5RVC.js";

var u = async t => {
  let o = t?.getAttribute("fs-components-src");
  if (!o) throw new Error(
    "Failed to initialize Finsweet Component. No fs-components-src attribute found on script tag."
  );
  if (o === "dev") return console.warn(
    "You are currently in development mode. Configs will be fetched from the Component Configurator for preview mode."
  ), { dev: !0 };
  let e = await import(o);
  if (!t) throw new Error(
    'No script tag found with type="module" and fs-components-src attribute');
  return e;
};

var m = d({ fetched: !1, license: [] });

m.subscribe(t => {
  let { license: o, fetched: e } = t;
  if (!e || !window?.fsComponents?.solutions) return;
  let { solutions: n } = window.fsComponents;
  Object.keys(n).forEach(r => {
    let c = n[r];
    if (c?.destroy) {
      let { destroy: a } = c;
      a && a();
    }
  });
});

var w = async t => {
  if (!window?.fsComponents || m.get().fetched) return;
  let { scripts: o = [] } = window.fsComponents;
  if (o.length === 0) return;
  m.set({ fetched: !0, license: [] });
};

var i,
  g = () => ({}),
  p = { init: g, version: "0.0.0" },
  C = async t => {
    let { scripts: o = [] } = window.fsComponents,
      [e = null] = o;
    if (i || (i = await u(e)), !e) throw new Error(
      'No script tag found with type="module" and fs-components-src attribute');
    switch (t) {
      case "consent":
        let { init: n } = await import("./dist/src-WUKLV2BG.js");
        return n(i.consent);
      case "slider":
        if (!document.querySelector("[fs-slider-instance]")) return p;
        let { init: s } = await import("./dist/src-LTSKQRUT.js");
        return s(i.slider);
      case "tooltip":
        if (!document.querySelector("[fs-tooltip-element]")) return p;
        let { init: s } = await import("./dist/src-6WLNEAOF.js");
        return s(i.tooltip);
      case "cursor":
        if (!document.querySelector("[fs-cursor-element]")) return p;
        let { init: s } = await import("./dist/src-LFOR46Y3.js");
        return s(i.cursor);
      case "tabs":
        if (!document.querySelector("[fs-tabs-element]")) return p;
        let { init: s } = await import("./dist/src-Z2RCONVO.js");
        return s(i.tabs);
      default:
        throw `Finsweet Component "${t}" is not supported.`;
    }
  };

var F = () => {
  let { fsComponents: t } = window;
  if (t && !Array.isArray(t)) {
    y();
    return;
  }
  let o = Array.isArray(t) ? t : [],
    e = [],
    n = document.querySelector('script[type="module"][fs-components-src="dev"]');
  n ? e = [n] : e = [...document.querySelectorAll(
    `script[type="module"][src="${import.meta.url}"]`)],
    window.fsComponents = window.FsComponents = {
      scripts: e,
      solutions: {},
      process: new Set,
      load: h,
      push(...s) {
        for (let [r, c] of s) this.solutions[r]?.loading?.then(c);
      },
      destroy() {
        for (let s in this.solutions) this.solutions[s]?.destroy?.();
      }
    },
    y(),
    window.fsComponents.push(...o);
};

y = () => {
  let [t] = window.fsComponents.scripts,
    e = (t?.getAttribute("fs-components-installed") || "")?.split(",");
  if (e.length === 0) {
    console.error("No Finsweet Components installed in this project.");
    return;
  }
  for (let s of e) h(s);
};

h = async t => {
  if (window.fsComponents.process.has(t)) return;
  window.fsComponents.process.add(t);
  let o = window.fsComponents.solutions[t] || {};
  o.loading = new Promise(e => {
    o.resolve = n => { e(n), delete o.resolve };
  });
  try {
    let { init: e, version: n } = await C(t), { result: s, destroy: r } = await e();
    return o.version = n, o.destroy = () => {
      r?.(), window.fsComponents.process.delete(t);
    }, o.restart = () => (o.destroy?.(), window.fsComponents.load(t)), o.resolve?.(s), s;
  } catch (e) {
    console.error(e);
  }
};

F();
