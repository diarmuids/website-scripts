// Last updated: 2026-09-30 09:59:10

// OCOD Law site script. Loaded from the site head by the Studio loader
// (dev.wsitefiles.com first, wsitefiles.com as the fallback), so it can run before
// the page body exists: everything that touches the DOM waits for it.

(function () {
  // Run once, even if the page includes the script twice.
  if (window.ocodlawLoaded) return;
  window.ocodlawLoaded = true;

  // -------------------------------------------------------
  // LOCATION PAGE FAQS
  // -------------------------------------------------------

  // The service pages list their FAQs with a native CMS list and a Webflow
  // interaction. The location pages hold theirs in one rich text field (h3
  // question + answer paragraphs), so this rebuilds that rich text into the same
  // structure with the same Webflow classes (faq-item, faq-question,
  // faq-open-icon, faq-answer-outer, faq-answer). The look therefore comes from
  // the Designer's own FAQ styles, and a change there restyles both.
  //
  // Behaviour matches the "FAQ open" / "FAQ close" interactions: all closed to
  // start, the answer's height opens over 300ms and closes over 200ms, and the
  // upright bar of the plus turns flat while open. The click is handled here and
  // kept from Webflow's own .faq-item interaction, which would otherwise run on
  // top of it without the initial closed state.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FAQ_OPEN_MS = 300;
  const FAQ_CLOSE_MS = 200;

  function toggleFaq(item) {
    const outer = item.querySelector('.faq-answer-outer');
    const bar = item.querySelector('.faq-icon-vert');
    const question = item.querySelector('.faq-question');
    const opening = question.getAttribute('aria-expanded') !== 'true';
    const duration = reduceMotion ? 0 : opening ? FAQ_OPEN_MS : FAQ_CLOSE_MS;
    question.setAttribute('aria-expanded', String(opening));

    bar.style.transition = `transform ${duration}ms ease-in-out`;
    bar.style.transform = opening ? 'rotate(90deg)' : '';

    const from = outer.offsetHeight;
    outer.style.height = opening ? 'auto' : '0px';
    if (!duration || !outer.animate) return;
    const to = opening ? outer.scrollHeight : 0;
    outer.getAnimations().forEach((animation) => animation.cancel());
    outer.animate({ height: [`${from}px`, `${to}px`] }, { duration, easing: 'ease-in-out' });
  }

  function initFaqs() {
    document.querySelectorAll('.page-faqs_rich-text').forEach((rt) => {
      const headings = [...rt.querySelectorAll(':scope > h3')];
      if (!headings.length) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'faq-wrapper fw-services';
      const list = document.createElement('div');
      list.className = 'faq-list';
      wrapper.appendChild(list);

      headings.forEach((heading, i) => {
        const item = document.createElement('div');
        item.className = 'faq-item';

        const question = document.createElement('div');
        question.className = 'faq-question';
        question.setAttribute('role', 'button');
        question.setAttribute('tabindex', '0');
        question.setAttribute('aria-expanded', 'false');
        question.setAttribute('aria-controls', `page-faq-${i + 1}`);

        // Everything up to the next question is this item's answer. Collected
        // before the heading moves, while it still has its siblings.
        const answerNodes = [];
        let node = heading.nextSibling;
        while (node && !(node.nodeType === 1 && node.tagName === 'H3')) {
          answerNodes.push(node);
          node = node.nextSibling;
        }

        // The heading stays an h3 for document structure but takes the
        // question's own text style, as the service page questions are plain text.
        heading.style.cssText = 'margin:0;font:inherit;color:inherit;';
        question.appendChild(heading);

        const icon = document.createElement('div');
        icon.className = 'faq-open-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<div class="faq-icon-hoz"></div><div class="faq-icon-vert"></div>';
        question.appendChild(icon);

        const outer = document.createElement('div');
        outer.className = 'faq-answer-outer';
        outer.id = `page-faq-${i + 1}`;
        outer.style.height = '0px';
        const answer = document.createElement('div');
        answer.className = 'faq-answer w-richtext';
        answerNodes.forEach((answerNode) => answer.appendChild(answerNode));
        outer.appendChild(answer);

        item.append(question, outer);
        list.appendChild(item);

        item.addEventListener('click', (event) => {
          event.stopPropagation();
          // A click on a link inside an answer follows the link instead.
          if (event.target.closest('a')) return;
          toggleFaq(item);
        });
        question.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          toggleFaq(item);
        });
      });

      rt.replaceChildren(wrapper);
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
    foundingDate: '1990',
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

  // -------------------------------------------------------
  // APPOINTMENT POPUP
  // -------------------------------------------------------

  // The "Book Appointment" triggers are native Webflow links and divs that open
  // the popup through Webflow interactions. They act as buttons, not links, so
  // they get button semantics here: the role and popup hint for screen readers,
  // keyboard focus on the div ones, no jump to the top from href="#", and Space
  // (plus Enter on the divs) activating them as on a real button.
  const APPOINTMENT_TRIGGERS =
    '.nav-link.nl-cta, .top-nav-link.tnl-book, a[role="button"][href="#"], [data-appointment="open"]';

  function initAppointmentTriggers() {
    document.querySelectorAll(APPOINTMENT_TRIGGERS).forEach((el) => {
      el.setAttribute('role', 'button');
      el.setAttribute('aria-haspopup', 'dialog');
      if (el.tagName !== 'A' && !el.hasAttribute('tabindex')) el.tabIndex = 0;
    });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[role="button"]');
    if (!trigger) return;
    if (trigger.matches('a[href="#"]')) event.preventDefault();
    // A trigger with no interaction of its own (the Contact page one) is marked
    // data-appointment="open" and forwards its click to the nav trigger.
    if (trigger.matches('[data-appointment="open"]')) {
      const navTrigger = document.querySelector('.nav-link.nl-cta');
      if (navTrigger) navTrigger.click();
    }
  });

  document.addEventListener('keydown', (event) => {
    const trigger = event.target.closest('[role="button"]');
    if (!trigger || !trigger.matches(APPOINTMENT_TRIGGERS)) return;
    const isLink = trigger.tagName === 'A';
    if (event.key === ' ' || (event.key === 'Enter' && !isLink)) {
      event.preventDefault();
      trigger.click();
    }
  });

  function init() {
    // Schema reads the FAQ rich text before initFaqs() restructures it.
    initSchema();
    initFaqs();
    initAppointmentTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
