// Last updated: 2026-08-17 09:45:53

(function () {
  'use strict';

  const TESTIMONIALS_PAGE_ID = '68b976566c8bd2dcbcd35346';
  const SCHEMA_ID = 'fogbandit-testimonials-schema';

  if (
    document.documentElement.dataset.wfPage !== TESTIMONIALS_PAGE_ID &&
    !/^\/about\/testimonials\/?$/.test(window.location.pathname)
  ) return;

  function cleanText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
  }

  function absoluteUrl(value, baseUrl) {
    if (!value) return '';

    try {
      return new URL(value, baseUrl).href;
    } catch (error) {
      return '';
    }
  }

  function getPageUrl() {
    const canonical = document.querySelector('link[rel="canonical"][href]');
    const url = new URL(canonical?.href || window.location.href);

    url.search = '';
    url.hash = '';
    return url.href;
  }

  const pageUrl = getPageUrl();
  const siteUrl = new URL('/', pageUrl).href;
  const organizationId = siteUrl + '#organization';
  const websiteId = siteUrl + '#website';
  const webpageId = pageUrl + '#webpage';
  const breadcrumbId = pageUrl + '#breadcrumb';
  const reviewListId = pageUrl + '#reviews';
  const pageHeading = cleanText(document.querySelector('h1')?.textContent);
  const headerDescription = cleanText(document.querySelector('.header_subtitle')?.textContent);
  const metaDescription = cleanText(document.querySelector('meta[name="description"]')?.content);
  const description = headerDescription || metaDescription;
  const siteName = cleanText(
    document.querySelector('.footer_credit-text')?.textContent
      .replace(/^\s*©\s*\d{4}\s*/, '')
      .replace(/\s*All rights reserved\.?.*$/i, '')
  ) || 'Fog Bandit Ireland';
  const logo = document.querySelector(
    '.nav_logo-image[src], .nav_logo img[src], a[href="/"] img[src]'
  );
  const emailLink = document.querySelector('.footer_component a[href^="mailto:"]');
  const phoneLink = document.querySelector('.footer_component a[href^="tel:"]');
  const locationHeading = Array.from(document.querySelectorAll('.footer_heading')).find(function (heading) {
    return /location/i.test(heading.textContent);
  });
  const locationColumn = locationHeading?.closest('.footer_column');
  const locationLink = locationColumn?.querySelector('a[href*="google.com/maps"]');
  const addressText = cleanText(locationLink?.textContent);
  const socialUrls = Array.from(document.querySelectorAll(
    '.footer_social-link[href^="http"], .nav_social-link[href^="http"]'
  ))
    .map(function (link) {
      return absoluteUrl(link.getAttribute('href'), pageUrl);
    })
    .filter(function (url, index, urls) {
      return url && urls.indexOf(url) === index;
    });

  const organization = {
    '@type': ['Organization', 'LocalBusiness'],
    '@id': organizationId,
    name: siteName,
    url: siteUrl
  };

  if (logo) {
    const logoUrl = absoluteUrl(logo.getAttribute('src'), pageUrl);

    if (logoUrl) {
      organization.logo = {
        '@type': 'ImageObject',
        '@id': siteUrl + '#logo',
        url: logoUrl,
        contentUrl: logoUrl,
        caption: siteName
      };
      organization.image = { '@id': siteUrl + '#logo' };
    }
  }
  if (emailLink) organization.email = emailLink.href.replace(/^mailto:/i, '').split('?')[0];
  if (phoneLink) organization.telephone = cleanText(phoneLink.textContent) || phoneLink.href.replace(/^tel:/i, '');
  if (addressText) {
    organization.address = {
      '@type': 'PostalAddress',
      streetAddress: addressText,
      addressCountry: 'IE'
    };
  }
  if (locationLink) organization.hasMap = locationLink.href;
  if (socialUrls.length) organization.sameAs = socialUrls;

  const reviews = [];

  document.querySelectorAll('.testimonial_item').forEach(function (item, index) {
    const authorName = cleanText(item.querySelector('.testimonial_name')?.textContent);
    const companyName = cleanText(item.querySelector('.testimonial_company')?.textContent);
    const reviewBody = cleanText(item.querySelector('.text-rich-text')?.textContent);

    if (!authorName || !reviewBody) return;

    const review = {
      '@type': 'Review',
      '@id': pageUrl + '#review-' + (index + 1),
      name: 'Testimonial from ' + authorName + (companyName ? ', ' + companyName : ''),
      reviewBody: reviewBody,
      author: {
        '@type': 'Person',
        name: authorName
      },
      itemReviewed: { '@id': organizationId },
      publisher: { '@id': organizationId },
      inLanguage: document.documentElement.lang || 'en'
    };

    if (companyName) {
      review.author.affiliation = {
        '@type': 'Organization',
        name: companyName
      };
    }

    reviews.push(review);
  });

  if (reviews.length) {
    organization.review = reviews.map(function (review) {
      return { '@id': review['@id'] };
    });
  }

  const graph = [
    organization,
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: siteName,
      publisher: { '@id': organizationId },
      inLanguage: document.documentElement.lang || 'en'
    },
    {
      '@type': 'CollectionPage',
      '@id': webpageId,
      url: pageUrl,
      name: document.title,
      headline: pageHeading || document.title,
      description: description,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
      publisher: { '@id': organizationId },
      breadcrumb: { '@id': breadcrumbId },
      mainEntity: { '@id': reviewListId },
      inLanguage: document.documentElement.lang || 'en'
    },
    {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'About',
          item: new URL('/about/about', siteUrl).href
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: pageHeading || 'Testimonials',
          item: pageUrl
        }
      ]
    },
    {
      '@type': 'ItemList',
      '@id': reviewListId,
      name: pageHeading || 'Testimonials',
      numberOfItems: reviews.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: reviews.map(function (review, index) {
        return {
          '@type': 'ListItem',
          position: index + 1,
          item: { '@id': review['@id'] }
        };
      })
    }
  ].concat(reviews);

  const existingSchema = document.getElementById(SCHEMA_ID);
  if (existingSchema) existingSchema.remove();

  const schema = document.createElement('script');
  schema.id = SCHEMA_ID;
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph
  });
  document.head.appendChild(schema);
}());

