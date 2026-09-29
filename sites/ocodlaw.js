// Last updated: 2026-09-29 20:02:24

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
/* Location pages template, FAQs (page-faqs_rich-text, main column under the content):
   these elements are created at runtime by initFaqs() below, so they have no
   Designer classes. */
.page-faqs_item { border-bottom: 1px solid var(--old-lace); }
.page-faqs_question { display: flex; justify-content: space-between; align-items: center; grid-column-gap: 1rem; padding: 1.25rem 0; cursor: pointer; list-style: none; }
/* Hides Safari's default disclosure triangle; list-style covers other browsers. */
.page-faqs_question::-webkit-details-marker { display: none; }
.page-faqs_question h3 { margin: 0; font-size: 1.25rem; line-height: 1.4; }
.page-faqs_toggle { display: flex; flex: none; width: 1.25rem; height: 1.25rem; color: var(--dark-slate-blue); transition: transform 300ms ease; }
.page-faqs_item.is-open .page-faqs_toggle { transform: rotate(180deg); }
.page-faqs_answer { overflow: hidden; }
.page-faqs_answer-inner { padding-bottom: 1.25rem; }
.page-faqs_answer p { margin: 0; }
`;
  document.head.appendChild(style);

  // -------------------------------------------------------
  // LOCATION PAGE FAQS
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
    document.querySelectorAll('.page-faqs_rich-text').forEach((rt) => {
      rt.querySelectorAll('h3').forEach((heading) => {
        const item = document.createElement('details');
        item.className = 'page-faqs_item';

        const question = document.createElement('summary');
        question.className = 'page-faqs_question';
        heading.parentNode.insertBefore(item, heading);
        question.appendChild(heading);

        const toggle = document.createElement('span');
        toggle.className = 'page-faqs_toggle';
        toggle.innerHTML = CARET;
        question.appendChild(toggle);
        item.appendChild(question);

        // Everything up to the next question is this item's answer. The inner
        // wrapper carries the padding so the animated height includes it.
        const answer = document.createElement('div');
        answer.className = 'page-faqs_answer';
        const inner = document.createElement('div');
        inner.className = 'page-faqs_answer-inner';
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

  // -------------------------------------------------------
  // STRUCTURED DATA (JSON-LD)
  // -------------------------------------------------------

  // Hybrid schema: lean JSON-LD stays in each page's native settings so every
  // crawler sees it (home: the full LegalService entity; location template: WebPage +
  // Service bound to CMS fields). This adds what the native markup can't do or
  // would repeat on every page: the firm and website entities, a WebPage where
  // none exists, breadcrumbs, an FAQPage built from the location page FAQs, and the
  // list of location pages. Ids use the production domain on every host, so
  // staging produces the same graph.
  const SITE = 'https://www.ocodlaw.com';
  const ORG_ID = `${SITE}/#legalservice`;
  const WEBSITE_ID = `${SITE}/#website`;

  const ORG = {
    '@type': 'LegalService',
    '@id': ORG_ID,
    name: "O'Connor O'Donoghue & Co LLP Solicitors",
    alternateName: ["O'Connor O'Donoghue Solicitors", 'OCOD Law'],
    url: `${SITE}/`,
    logo: 'https://cdn.prod.website-files.com/5fe193a33425698ce128e5ca/68f0f192c007fc3e515238d9_ocodlaw_logo.jpg',
    image: 'https://cdn.prod.website-files.com/5fe193a33425698ce128e5ca/5fedd79501bdfaf9efa75c7c_og%20image.jpg',
    description:
      "O'Connor O'Donoghue & Co LLP Solicitors in Killarney, Co. Kerry provide legal advice and representation in conveyancing, wills and probate, personal injury, medical negligence, court representation and dispute resolution.",
    telephone: '+353-64-663-4755',
    email: 'info@ocodlaw.com',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '23 Main Street',
      addressLocality: 'Killarney',
      addressRegion: 'Co. Kerry',
      postalCode: 'V93 WVH7',
      addressCountry: 'IE',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 52.05831226259671, longitude: -9.508855003624484 },
    hasMap: 'https://www.google.com/maps/place/23+Main+St,+Killarney,+Co.+Kerry,+V93+WVH7,+Ireland/',
    areaServed: [
      { '@type': 'City', name: 'Killarney' },
      { '@type': 'AdministrativeArea', name: 'County Kerry' },
    ],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '17:15',
      },
    ],
    founder: [
      { '@type': 'Person', name: "Pat F. O'Connor" },
      { '@type': 'Person', name: "Michael O'Donoghue" },
    ],
    memberOf: [
      { '@type': 'Organization', name: 'Law Society of Ireland', url: 'https://www.lawsociety.ie/' },
      { '@type': 'Organization', name: 'STEP Ireland', url: 'https://www.step.ie/' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+353-64-663-4755',
      email: 'info@ocodlaw.com',
      contactType: 'customer service',
      areaServed: 'IE',
      availableLanguage: 'English',
    },
    knowsAbout: [
      'Conveyancing',
      'Wills and probate',
      'Succession planning',
      'Personal injury',
      'Medical negligence',
      'Dispute resolution',
      'Landlord and tenant law',
      'Employment law',
    ],
  };

  const WEBSITE = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE}/`,
    name: "O'Connor O'Donoghue & Co LLP Solicitors",
    inLanguage: 'en-IE',
    publisher: { '@id': ORG_ID },
  };

  const cleanText = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  // Every node already on the page (native settings or embeds), flattened.
  function existingNodes() {
    const nodes = [];
    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        (Array.isArray(data) ? data : [data]).forEach((entry) => {
          if (entry && entry['@graph']) nodes.push(...entry['@graph']);
          else if (entry) nodes.push(entry);
        });
      } catch (e) {
        // Leave malformed markup alone; it is reported by Search Console.
      }
    });
    return nodes;
  }

  function pageUrl() {
    const path = location.pathname.replace(/\/+$/, '');
    return path ? SITE + path : `${SITE}/`;
  }

  function breadcrumb(url, name) {
    const path = location.pathname.replace(/\/+$/, '');
    const items = [{ name: 'Home', item: `${SITE}/` }];
    if (path.startsWith('/legal-services/')) {
      items.push({ name: 'Legal Services & Locations', item: `${SITE}/services-and-locations` });
    }
    if (path) items.push({ name, item: url });
    return {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: items.map((entry, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: entry.name,
        item: entry.item,
      })),
    };
  }

  // Question/answer pairs from an h3 + answer rich text, read before the FAQ
  // accordion restructures it.
  function faqEntities(rt) {
    const entities = [];
    rt.querySelectorAll('h3').forEach((heading) => {
      const parts = [];
      let node = heading.nextElementSibling;
      while (node && node.tagName !== 'H3') {
        parts.push(cleanText(node));
        node = node.nextElementSibling;
      }
      const answer = parts.filter(Boolean).join(' ');
      if (cleanText(heading) && answer) {
        entities.push({
          '@type': 'Question',
          name: cleanText(heading),
          acceptedAnswer: { '@type': 'Answer', text: answer },
        });
      }
    });
    return entities;
  }

  function initSchema() {
    const nodes = existingNodes();
    const ids = new Set(nodes.map((n) => n['@id']).filter(Boolean));
    const url = pageUrl();
    const h1 = cleanText(document.querySelector('h1'));
    const title = document.title.split('|')[0].trim();
    const name = h1 || title;
    const description = document.querySelector('meta[name="description"]')?.content || '';
    const graph = [];

    if (!ids.has(ORG_ID)) graph.push(ORG);
    if (!ids.has(WEBSITE_ID)) graph.push(WEBSITE);

    // A native page node (e.g. AboutPage, ContactPage, FAQPage, or the location
    // template's WebPage) takes priority; otherwise describe the page here.
    const hasPageNode = nodes.some(
      (n) => /Page$/.test(n['@type'] || '') && (n.url === url || n['@id'] === `${url}#webpage`)
    );
    const breadcrumbNode = breadcrumb(url, name);
    graph.push(breadcrumbNode);
    if (!hasPageNode) {
      graph.push({
        '@type': location.pathname === '/services-and-locations' ? 'CollectionPage' : 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: document.title,
        description: description || undefined,
        inLanguage: 'en-IE',
        isPartOf: { '@id': WEBSITE_ID },
        about: { '@id': ORG_ID },
        breadcrumb: { '@id': breadcrumbNode['@id'] },
      });
    }

    // Location pages: FAQ rich text becomes an FAQPage.
    const faqRt = document.querySelector('.page-faqs_rich-text');
    if (faqRt) {
      const questions = faqEntities(faqRt);
      if (questions.length) {
        graph.push({
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          url,
          isPartOf: { '@id': WEBSITE_ID },
          mainEntity: questions,
        });
      }
    }

    // Services and locations: the location pages it links to, once the card
    // links resolve to real item URLs.
    if (location.pathname === '/services-and-locations') {
      const links = [...document.querySelectorAll('a[href*="/legal-services/"]')];
      const seen = new Set();
      const items = links
        .map((a) => ({ url: SITE + new URL(a.href).pathname, name: cleanText(a) }))
        .filter((item) => item.name && !seen.has(item.url) && seen.add(item.url));
      if (items.length) {
        graph.push({
          '@type': 'ItemList',
          '@id': `${url}#locations`,
          name: 'Legal services by location',
          numberOfItems: items.length,
          itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            url: item.url,
          })),
        });
      }
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.source = 'ocodlaw.js';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(script);
  }

  function init() {
    // Schema reads the FAQ rich text before initFaqs() restructures it.
    initSchema();
    initFaqs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
