// Last updated: 2026-08-17 10:29:54

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

(function () {
  'use strict';

  const PRODUCT_DETAIL_PAGE_ID = '68b96d1096186ca39d6d02fe';
  const SCHEMA_ID = 'fogbandit-product-detail-schema';

  if (
    document.documentElement.dataset.wfPage !== PRODUCT_DETAIL_PAGE_ID &&
    !/^\/product-detail\/[^/]+\/?$/.test(window.location.pathname)
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

  const canonical = document.querySelector('link[rel="canonical"][href]');
  const pageUrlObject = new URL(canonical?.href || window.location.href);
  pageUrlObject.search = '';
  pageUrlObject.hash = '';

  const pageUrl = pageUrlObject.href;
  const siteUrl = new URL('/', pageUrl).href;
  const organizationId = siteUrl + '#organization';
  const websiteId = siteUrl + '#website';
  const webpageId = pageUrl + '#webpage';
  const itemId = pageUrl + '#item';
  const breadcrumbId = pageUrl + '#breadcrumb';
  const itemName = cleanText(document.querySelector('h1')?.textContent);

  if (!itemName) return;

  const metaDescription = cleanText(document.querySelector('meta[name="description"]')?.content);
  const itemSubtitle = cleanText(document.querySelector('.heading_sub.is-product')?.textContent);
  const mainImage = document.querySelector('.product_main-img[src]');
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
  const socialUrls = Array.from(document.querySelectorAll('.footer_social-link[href^="http"]'))
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

  const sectionNodes = [];

  document.querySelectorAll('.section_product .product_block').forEach(function (block, index) {
    const heading = cleanText(block.querySelector('h2, h3')?.textContent);
    const text = cleanText(block.querySelector('.text-rich-text')?.textContent);

    if (!heading || !text) return;

    sectionNodes.push({
      '@type': 'WebPageElement',
      '@id': pageUrl + '#section-' + (index + 1),
      name: heading,
      text: text,
      about: { '@id': itemId },
      isPartOf: { '@id': webpageId },
      inLanguage: document.documentElement.lang || 'en'
    });
  });

  const imageUrls = Array.from(document.querySelectorAll(
    '.product_main-img[src], .gallery_img[src]'
  ))
    .map(function (image) {
      return absoluteUrl(image.getAttribute('src'), pageUrl);
    })
    .filter(function (url, index, urls) {
      return url && urls.indexOf(url) === index;
    });
  const specificationSection = sectionNodes.find(function (section) {
    return /^specification$/i.test(section.name);
  });
  const partNumberMatch = specificationSection?.text.match(/Part No:\s*(.+?)(?=Dimensions:|$)/i);
  const item = {
    '@type': 'Thing',
    '@id': itemId,
    name: itemName,
    url: pageUrl,
    description: metaDescription,
    additionalType: 'Security fogging system',
    mainEntityOfPage: { '@id': webpageId }
  };

  if (itemSubtitle) item.disambiguatingDescription = itemSubtitle;
  if (imageUrls.length) item.image = imageUrls;
  if (partNumberMatch) {
    item.identifier = {
      '@type': 'PropertyValue',
      propertyID: 'Part No',
      value: cleanText(partNumberMatch[1])
    };
  }
  if (sectionNodes.length) {
    item.subjectOf = sectionNodes.map(function (section) {
      return { '@id': section['@id'] };
    });
  }

  const webPage = {
    '@type': 'WebPage',
    '@id': webpageId,
    url: pageUrl,
    name: document.title,
    headline: itemName,
    description: metaDescription,
    isPartOf: { '@id': websiteId },
    mainEntity: { '@id': itemId },
    publisher: { '@id': organizationId },
    breadcrumb: { '@id': breadcrumbId },
    inLanguage: document.documentElement.lang || 'en'
  };

  if (mainImage) {
    webPage.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: absoluteUrl(mainImage.getAttribute('src'), pageUrl),
      caption: mainImage.alt || itemName
    };
  }
  if (sectionNodes.length) {
    webPage.hasPart = sectionNodes.map(function (section) {
      return { '@id': section['@id'] };
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
    webPage,
    item,
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
          name: 'Product Range',
          item: new URL('/product/product-range', siteUrl).href
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: itemName,
          item: pageUrl
        }
      ]
    }
  ].concat(sectionNodes);

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

(function () {
  'use strict';

  const PRODUCT_RANGE_PAGE_ID = '68b969ba939d3612724d32bb';
  const SCHEMA_ID = 'fogbandit-product-range-schema';

  if (
    document.documentElement.dataset.wfPage !== PRODUCT_RANGE_PAGE_ID &&
    !/^\/product\/product-range\/?$/.test(window.location.pathname)
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

  const canonical = document.querySelector('link[rel="canonical"][href]');
  const pageUrlObject = new URL(canonical?.href || window.location.href);
  pageUrlObject.search = '';
  pageUrlObject.hash = '';

  const pageUrl = pageUrlObject.href;
  const siteUrl = new URL('/', pageUrl).href;
  const organizationId = siteUrl + '#organization';
  const websiteId = siteUrl + '#website';
  const webpageId = pageUrl + '#webpage';
  const breadcrumbId = pageUrl + '#breadcrumb';
  const productListId = pageUrl + '#product-list';
  const pageHeading = cleanText(document.querySelector('h1')?.textContent);
  const description = cleanText(document.querySelector('meta[name="description"]')?.content);
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

  const productEntries = [];

  document.querySelectorAll('.prod-list_item').forEach(function (card, index) {
    const titleElement = card.querySelector('h2, h3');
    const link = titleElement?.closest('a[href]') || card.querySelector('a[href*="/product-detail/"]');
    const image = card.querySelector('.prod-list_img[src]');
    const subtitle = cleanText(card.querySelector('.prod-list_subheader')?.textContent);
    const title = cleanText(titleElement?.textContent || image?.alt);
    const url = absoluteUrl(link?.getAttribute('href'), pageUrl);
    const textCandidates = Array.from(card.querySelectorAll('.layout_column > div'))
      .map(function (element) {
        return cleanText(element.textContent);
      })
      .filter(function (text) {
        return text && text !== title && text !== subtitle && !/^learn more$/i.test(text);
      });
    const summary = textCandidates.find(function (text) {
      return text.length > subtitle.length && !text.includes(title);
    }) || subtitle;

    if (!title || !url) return;

    const listItem = {
      '@type': 'ListItem',
      '@id': pageUrl + '#item-' + (index + 1),
      position: productEntries.length + 1,
      name: title,
      url: url
    };

    if (summary) listItem.description = summary;
    if (image) {
      const imageUrl = absoluteUrl(image.getAttribute('src'), pageUrl);
      if (imageUrl) listItem.image = imageUrl;
    }

    productEntries.push(listItem);
  });

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
      about: {
        '@type': 'Thing',
        name: pageHeading || 'Security fogging systems'
      },
      publisher: { '@id': organizationId },
      breadcrumb: { '@id': breadcrumbId },
      mainEntity: { '@id': productListId },
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
          name: 'Product',
          item: new URL('/product/features', siteUrl).href
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: pageHeading || 'Product Range',
          item: pageUrl
        }
      ]
    },
    {
      '@type': 'ItemList',
      '@id': productListId,
      name: pageHeading || 'Product Range',
      description: description,
      numberOfItems: productEntries.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: productEntries
    }
  ];

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

