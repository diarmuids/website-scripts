// Last updated: 2026-08-13 18:19:57

(function () {
  'use strict';

  const SCHEMA_ID = 'csc-home-schema';
  const SITE_URL = 'https://www.cscsecurity.ie/';
  const ORGANIZATION_ID = `${SITE_URL}#organization`;

  function cleanText(value) {
    return String(value || '')
      .replace(/[“”"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function textFrom(root, selector) {
    return cleanText(root.querySelector(selector)?.textContent);
  }

  function absoluteUrl(value) {
    if (!value) return undefined;

    try {
      return new URL(value, SITE_URL).href;
    } catch (_error) {
      return undefined;
    }
  }

  function getReviews() {
    return Array.from(document.querySelectorAll('.testimonial-list_item'))
      .map((item, index) => {
        const name = textFrom(item, '.testimonial-slider_name');
        const company = textFrom(item, '.testimonial-slider_role');
        const jobTitle = textFrom(item, '.testimonial-slider_company');
        const reviewBody = [
          textFrom(item, '.testimonial-slider_main-text'),
          textFrom(item, '.text-block')
        ].filter(Boolean).join(' ');

        if (!name || !reviewBody) return null;

        const author = {
          '@type': 'Person',
          name
        };

        if (jobTitle) author.jobTitle = jobTitle;
        if (company) {
          author.worksFor = {
            '@type': 'Organization',
            name: company
          };
        }

        return {
          '@type': 'Review',
          '@id': `${SITE_URL}#review-${index + 1}`,
          itemReviewed: { '@id': ORGANIZATION_ID },
          author,
          reviewBody,
          reviewRating: {
            '@type': 'Rating',
            ratingValue: 5,
            bestRating: 5,
            worstRating: 1
          }
        };
      })
      .filter(Boolean);
  }

  function getServiceOffers() {
    const seen = new Set();

    return Array.from(document.querySelectorAll('.service-list_item'))
      .map((item) => {
        const name = textFrom(item, '.service-list_content h2, .service-list_content h3, .service-list_content [class*="heading-style-"]');
        const description = textFrom(item, '.service-list_content > div:not([class*="heading-style-"])');
        const link = item.querySelector('a[href]');
        const url = absoluteUrl(link?.getAttribute('href'));

        if (!name || seen.has(name.toLowerCase())) return null;
        seen.add(name.toLowerCase());

        const service = {
          '@type': 'Service',
          name,
          provider: { '@id': ORGANIZATION_ID },
          areaServed: {
            '@type': 'Country',
            name: 'Ireland'
          }
        };

        if (description) service.description = description;
        if (url && !url.endsWith('#')) service.url = url;

        return {
          '@type': 'Offer',
          itemOffered: service
        };
      })
      .filter(Boolean);
  }

  function addHomeSchema() {
    if (window.location.pathname.replace(/\/+$/, '') !== '') return;

    const canonical = absoluteUrl(document.querySelector('link[rel="canonical"]')?.href) || SITE_URL;
    const title = cleanText(document.title);
    const description = cleanText(document.querySelector('meta[name="description"]')?.content);
    const image = absoluteUrl(document.querySelector('meta[property="og:image"]')?.content);
    const reviews = getReviews();
    const offers = getServiceOffers();

    const organization = {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'CSC Covert Security Consultants Ltd.',
      alternateName: 'CSC Security',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}#logo`,
        url: 'https://cdn.prod.website-files.com/691c83f2f8dcc8913bc7801a/691ca300efe1d47e603153e2_logo_symbol.svg'
      },
      description,
      foundingDate: '2007',
      telephone: '+353 818 273 274',
      email: 'info@cscsecurity.ie',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IE'
      },
      areaServed: {
        '@type': 'Country',
        name: 'Ireland'
      },
      slogan: 'Your Security Is Our Business',
      sameAs: [
        'https://www.linkedin.com/company/csc-covert-security-consultants-ltd/'
      ]
    };

    if (offers.length) {
      organization.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: 'Fire and security services',
        itemListElement: offers
      };
    }

    if (reviews.length) {
      organization.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: 5,
        bestRating: 5,
        worstRating: 1,
        reviewCount: reviews.length
      };
      organization.review = reviews;
    }

    const webPage = {
      '@type': 'WebPage',
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}#website` },
      about: { '@id': ORGANIZATION_ID },
      breadcrumb: { '@id': `${canonical}#breadcrumb` }
    };

    if (image) webPage.primaryImageOfPage = { '@type': 'ImageObject', url: image };

    const graph = [
      organization,
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}#website`,
        url: SITE_URL,
        name: 'CSC Security',
        publisher: { '@id': ORGANIZATION_ID },
        inLanguage: 'en-IE'
      },
      webPage,
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: canonical
          }
        ]
      }
    ];

    document.getElementById(SCHEMA_ID)?.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph
    });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addHomeSchema, { once: true });
  } else {
    addHomeSchema();
  }
})();
