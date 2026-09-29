// Last updated: 2026-09-29 19:42:15

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
/* SEO pages template, FAQs (seo-faqs_rich-text, main column under the content):
   these elements are created at runtime by initFaqs() below, so they have no
   Designer classes. */
.seo-faqs_item { border-bottom: 1px solid var(--old-lace); }
.seo-faqs_question { display: flex; justify-content: space-between; align-items: center; grid-column-gap: 1rem; padding: 1.25rem 0; cursor: pointer; list-style: none; }
/* Hides Safari's default disclosure triangle; list-style covers other browsers. */
.seo-faqs_question::-webkit-details-marker { display: none; }
.seo-faqs_question h3 { margin: 0; font-size: 1.25rem; line-height: 1.4; }
.seo-faqs_toggle { display: flex; flex: none; width: 1.25rem; height: 1.25rem; color: var(--dark-slate-blue); transition: transform 300ms ease; }
.seo-faqs_item.is-open .seo-faqs_toggle { transform: rotate(180deg); }
.seo-faqs_answer { overflow: hidden; }
.seo-faqs_answer-inner { padding-bottom: 1.25rem; }
.seo-faqs_answer p { margin: 0; }
`;
  document.head.appendChild(style);

  // -------------------------------------------------------
  // SEO PAGE FAQS
  // -------------------------------------------------------

  // The FAQs rich text is h3 question + p answer pairs. Each pair becomes a native
  // <details> accordion item (keyboard and screen-reader support built in), all
  // closed to start. The answer's height is animated open and shut; a down caret
  // turns to point up while the item is open.
  const CARET =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toggleFaq(item, answer) {
    const opening = !item.classList.contains('is-open');
    item.classList.toggle('is-open', opening);
    if (opening) item.open = true;
    if (reduceMotion) {
      item.open = opening;
      return;
    }
    const from = opening ? 0 : answer.offsetHeight;
    const to = opening ? answer.scrollHeight : 0;
    answer.getAnimations().forEach((a) => a.cancel());
    const animation = answer.animate(
      { height: [`${from}px`, `${to}px`] },
      { duration: 300, easing: 'ease' }
    );
    animation.onfinish = () => {
      if (!opening) item.open = false;
    };
  }

  function initFaqs() {
    document.querySelectorAll('.seo-faqs_rich-text').forEach((rt) => {
      rt.querySelectorAll('h3').forEach((heading) => {
        const item = document.createElement('details');
        item.className = 'seo-faqs_item';

        const question = document.createElement('summary');
        question.className = 'seo-faqs_question';
        heading.parentNode.insertBefore(item, heading);
        question.appendChild(heading);

        const toggle = document.createElement('span');
        toggle.className = 'seo-faqs_toggle';
        toggle.innerHTML = CARET;
        question.appendChild(toggle);
        item.appendChild(question);

        // Everything up to the next question is this item's answer. The inner
        // wrapper carries the padding so the animated height includes it.
        const answer = document.createElement('div');
        answer.className = 'seo-faqs_answer';
        const inner = document.createElement('div');
        inner.className = 'seo-faqs_answer-inner';
        answer.appendChild(inner);
        let node = item.nextSibling;
        while (node && !(node.nodeType === 1 && node.tagName === 'H3')) {
          const next = node.nextSibling;
          inner.appendChild(node);
          node = next;
        }
        item.appendChild(answer);

        question.addEventListener('click', (event) => {
          event.preventDefault();
          toggleFaq(item, answer);
        });
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
