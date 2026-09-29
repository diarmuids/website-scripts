// Last updated: 2026-09-29 19:32:04

// OCOD Law site script. Loaded from the site head by the Studio loader
// (dev.wsitefiles.com first, wsitefiles.com as the fallback), so it can run before
// the page body exists: everything that touches the DOM waits for it.

(function () {
  // Run once, even if the page includes the script twice.
  if (window.ocodlawLoaded) return;
  window.ocodlawLoaded = true;

  // -------------------------------------------------------
  // STYLES (non-native: see each rule's note)
  // -------------------------------------------------------

  const style = document.createElement('style');
  style.textContent = `
/* SEO pages template, main content: every CMS item's Main content starts with an
   H2 that repeats the page H1. Hidden here rather than stripped from 101 CMS items;
   remove this rule if the CMS copy is ever edited to drop that heading. The
   Designer can't target only the first heading inside a rich text element. */
.rtb-service.is-seo > h2:first-child { display: none; }

/* SEO pages template, FAQs (seo-faqs_rich-text, main column under the content):
   these elements are created at runtime by initFaqs() below, so they have no
   Designer classes. */
.seo-faqs_item { border-bottom: 1px solid var(--old-lace); }
.seo-faqs_question { display: flex; justify-content: space-between; align-items: center; grid-column-gap: 1rem; padding: 1.25rem 0; cursor: pointer; list-style: none; }
/* Hides Safari's default disclosure triangle; list-style covers other browsers. */
.seo-faqs_question::-webkit-details-marker { display: none; }
.seo-faqs_question h3 { margin: 0; font-size: 1.25rem; line-height: 1.4; }
.seo-faqs_toggle { flex: none; color: var(--dark-slate-blue); font-size: 1.5rem; line-height: 1; transition: transform 200ms ease; }
.seo-faqs_item[open] .seo-faqs_toggle { transform: rotate(45deg); }
.seo-faqs_answer { padding-bottom: 1.25rem; }
.seo-faqs_answer p { margin: 0; }
`;
  document.head.appendChild(style);

  // -------------------------------------------------------
  // SEO PAGE FAQS
  // -------------------------------------------------------

  // The FAQs rich text is h3 question + p answer pairs. Each pair becomes a native
  // <details> accordion item (keyboard and screen-reader support built in). The
  // first item starts open.
  function initFaqs() {
    document.querySelectorAll('.seo-faqs_rich-text').forEach((rt) => {
      rt.querySelectorAll('h3').forEach((heading, i) => {
        const item = document.createElement('details');
        item.className = 'seo-faqs_item';
        if (i === 0) item.open = true;

        const question = document.createElement('summary');
        question.className = 'seo-faqs_question';
        heading.parentNode.insertBefore(item, heading);
        question.appendChild(heading);

        const toggle = document.createElement('span');
        toggle.className = 'seo-faqs_toggle';
        toggle.setAttribute('aria-hidden', 'true');
        toggle.textContent = '+';
        question.appendChild(toggle);
        item.appendChild(question);

        // Everything up to the next question is this item's answer.
        const answer = document.createElement('div');
        answer.className = 'seo-faqs_answer';
        let node = item.nextSibling;
        while (node && !(node.nodeType === 1 && node.tagName === 'H3')) {
          const next = node.nextSibling;
          answer.appendChild(node);
          node = next;
        }
        item.appendChild(answer);
      });
    });
  }

  function init() {
    initFaqs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
