// Last updated: 2026-09-14 11:28:33

const MINDWAVE_LOCATION_COLLECTION_ID = '6aa2e5fb25ceac00ddd9f2ea';
const MINDWAVE_LOCATION_SCHEMA_ID = 'mindwave-service-location-schema';
const MINDWAVE_PAGE_SCHEMA_ID = 'mindwave-page-schema';
const MINDWAVE_SITE_URL = 'https://www.mindwave.agency/';
const MINDWAVE_PAGE_IDS = {
  home: '6825f24fcaddf4a2b5da44fc',
  whoWeAre: '682b348f79b7b2efc8e6c158',
  whatWeDo: '682cbb4f905b823bd762352c',
  news: '682b916ab5eaf87f92aa1aaa',
  contact: '682b76357d290e9990457bcd',
  serviceLocations: '6aa2e9196918bc0ab053ed5a'
};
const MINDWAVE_SERVICE_PAGE_IDS = [
  '68506213fd9ef8a15f294ddd',
  '685cec70704d9c99836720de',
  '685ce59ff3d741f27c2c6ed3',
  '685ce98eb10924ff5436c558',
  '685ce820b27d88d704366eef'
];
const MINDWAVE_NEWS_COLLECTION_ID = '682b976d70e048ecf0817883';
const MINDWAVE_NEWS_CATEGORY_COLLECTION_ID = '685d0a62452c9d10796a5b42';

function cleanMindwaveText(element) {
  return element
    ? element.textContent.replace(/\s+/g, ' ').trim()
    : '';
}

function getMindwaveAbsoluteUrl(value, baseUrl) {
  if (!value) return '';

  try {
    return new URL(value, baseUrl).href;
  } catch (error) {
    return '';
  }
}

function getMindwaveImageObject(image, id, pageUrl, fallbackCaption) {
  if (!image) return null;

  const url = getMindwaveAbsoluteUrl(
    image.currentSrc || image.getAttribute('src'),
    pageUrl
  );

  if (!url) return null;

  const imageObject = {
    '@type': 'ImageObject',
    '@id': id,
    url: url,
    contentUrl: url
  };
  const caption = image.getAttribute('alt')?.trim() || fallbackCaption;

  if (caption) imageObject.caption = caption;

  return imageObject;
}

function getUniqueMindwaveValues(values) {
  return values.filter(function (value, index, allValues) {
    return value && allValues.indexOf(value) === index;
  });
}

function generateMindwaveServiceLocationSchema() {
  if (
    document.documentElement.dataset.wfCollection !==
    MINDWAVE_LOCATION_COLLECTION_ID
  ) {
    return;
  }

  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = getMindwaveAbsoluteUrl(
    canonical?.getAttribute('href') || location.href,
    MINDWAVE_SITE_URL
  );
  const siteUrl = new URL('/', pageUrl).href;
  const organizationId = siteUrl + '#organization';
  const websiteId = siteUrl + '#website';
  const pageId = pageUrl + '#webpage';
  const serviceId = pageUrl + '#service';
  const breadcrumbId = pageUrl + '#breadcrumb';
  const headline = cleanMindwaveText(
    document.querySelector('.heading-style-h1.is-location-page, h1')
  );
  const description =
    document.querySelector('meta[name="description"]')?.content.trim() ||
    cleanMindwaveText(document.querySelector('.service-header_content-right'));

  if (!pageUrl || !headline) return;

  const language = document.documentElement.lang || 'en';
  const titleParts = document.title.split('|');
  const footerName = cleanMindwaveText(document.querySelector('.footer_credit-text'))
    .replace(/^\u00a9\s*\d{4}\s*/, '');
  const organizationName = footerName || titleParts[titleParts.length - 1].trim();
  const locationMatch = headline.match(/\s+in\s+(.+)$/i);
  const locationName = locationMatch ? locationMatch[1].trim() : '';
  const serviceType = locationMatch
    ? headline.slice(0, locationMatch.index).trim()
    : headline;
  const logo = getMindwaveImageObject(
    document.querySelector('.nav_logo-image[src], .global_animation-logo[src]'),
    siteUrl + '#logo',
    pageUrl,
    organizationName
  );
  const emailLink = document.querySelector('.section_cta a[href^="mailto:"]') ||
    document.querySelector('footer a[href^="mailto:"]');
  const email = emailLink
    ? decodeURIComponent(emailLink.href.replace(/^mailto:/i, '').split('?')[0])
    : '';
  const socialUrls = getUniqueMindwaveValues(
    Array.from(document.querySelectorAll('footer .social_link[href^="http"]'))
      .map(function (link) {
        return getMindwaveAbsoluteUrl(link.getAttribute('href'), pageUrl);
      })
  );
  const knowsAbout = getUniqueMindwaveValues(
    Array.from(document.querySelectorAll('.nav_dd-link-text'))
      .map(cleanMindwaveText)
  );
  const organization = {
    '@type': 'Organization',
    '@id': organizationId,
    name: organizationName,
    url: siteUrl
  };

  if (logo) {
    organization.logo = { '@id': logo['@id'] };
    organization.image = { '@id': logo['@id'] };
  }
  if (email) {
    organization.email = email;
    organization.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'new business enquiries',
      email: email,
      availableLanguage: language
    };
  }
  if (socialUrls.length) organization.sameAs = socialUrls;
  if (knowsAbout.length) organization.knowsAbout = knowsAbout;

  const service = {
    '@type': 'Service',
    '@id': serviceId,
    name: headline,
    serviceType: serviceType,
    description: description,
    url: pageUrl,
    provider: { '@id': organizationId },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: pageUrl,
      availableLanguage: language
    }
  };

  if (locationName) {
    service.areaServed = {
      '@type': 'City',
      name: locationName
    };
    service.audience = {
      '@type': 'BusinessAudience',
      geographicArea: { '@type': 'City', name: locationName }
    };
  }

  const graph = [organization];

  if (logo) graph.push(logo);

  graph.push({
    '@type': 'WebSite',
    '@id': websiteId,
    url: siteUrl,
    name: organizationName,
    publisher: { '@id': organizationId },
    inLanguage: language
  });

  const pageSections = [];

  document.querySelectorAll('.location_row').forEach(function (row, index) {
    const sectionHeading = cleanMindwaveText(
      row.querySelector('.heading-style-h3, h2, h3')
    );
    const sectionText = cleanMindwaveText(
      row.querySelector('.text-rich-text, .text-size-medium')
    );

    if (!sectionHeading || !sectionText) return;

    const sectionId = pageUrl + '#service-section-' + (index + 1);
    const section = {
      '@type': 'WebPageElement',
      '@id': sectionId,
      name: sectionHeading,
      text: sectionText,
      isPartOf: { '@id': pageId },
      about: { '@id': serviceId }
    };
    const sectionImage = getMindwaveImageObject(
      row.querySelector('.location_img[src], img[src]'),
      sectionId + '-image',
      pageUrl,
      sectionHeading
    );

    if (sectionImage) {
      section.image = { '@id': sectionImage['@id'] };
      graph.push(sectionImage);
    }

    graph.push(section);
    pageSections.push({ '@id': sectionId });
  });

  const processSection = document.querySelector('.section_process');
  const processHeading = cleanMindwaveText(
    processSection?.querySelector('.heading-style-h2, h2')
  );
  const processSteps = processSection
    ? Array.from(processSection.querySelectorAll('.process_content-item'))
      .map(function (item, index) {
        const name = cleanMindwaveText(item.querySelector('h3, h4, h5'));
        const text = cleanMindwaveText(item.querySelector('.text-rich-text'));

        if (!name || !text) return null;

        return {
          '@type': 'HowToStep',
          position: index + 1,
          name: name,
          text: text
        };
      })
      .filter(Boolean)
    : [];

  if (processHeading && processSteps.length) {
    const processId = pageUrl + '#process';

    graph.push({
      '@type': 'HowTo',
      '@id': processId,
      name: processHeading,
      about: { '@id': serviceId },
      step: processSteps
    });
    pageSections.push({ '@id': processId });
  }

  const relatedArticles = [];

  document.querySelectorAll('.news-list_item').forEach(function (item, index) {
    const titleLink = item.querySelector('.news-list_title[href]');
    const articleUrl = getMindwaveAbsoluteUrl(
      titleLink?.getAttribute('href'),
      pageUrl
    );
    const articleTitle = cleanMindwaveText(titleLink);

    if (!articleUrl || !articleTitle) return;

    const articleId = articleUrl + '#article';
    const article = {
      '@type': 'BlogPosting',
      '@id': articleId,
      url: articleUrl,
      headline: articleTitle,
      position: index + 1,
      publisher: { '@id': organizationId },
      isPartOf: { '@id': websiteId }
    };
    const dateText = cleanMindwaveText(item.querySelector('.news-list_date'));
    const parsedDate = dateText ? new Date(dateText) : null;
    const articleImage = getMindwaveImageObject(
      item.querySelector('.news-list_image[src], img[src]'),
      articleId + '-image',
      pageUrl,
      articleTitle
    );

    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      article.datePublished = parsedDate.toISOString().slice(0, 10);
    }
    if (articleImage) {
      article.image = { '@id': articleImage['@id'] };
      graph.push(articleImage);
    }

    graph.push(article);
    relatedArticles.push({ '@id': articleId });
  });

  if (relatedArticles.length) service.subjectOf = relatedArticles;

  graph.push(service);

  const primaryImageUrl =
    document.querySelector('meta[property="og:image"]')?.content.trim() || '';
  const contactTarget = getMindwaveAbsoluteUrl('#contact-us', pageUrl);
  const webPage = {
    '@type': 'WebPage',
    '@id': pageId,
    url: pageUrl,
    name: document.title,
    headline: headline,
    description: description,
    isPartOf: { '@id': websiteId },
    about: { '@id': serviceId },
    mainEntity: { '@id': serviceId },
    publisher: { '@id': organizationId },
    breadcrumb: { '@id': breadcrumbId },
    inLanguage: language
  };

  if (primaryImageUrl) {
    const primaryImage = {
      '@type': 'ImageObject',
      '@id': pageUrl + '#primaryimage',
      url: getMindwaveAbsoluteUrl(primaryImageUrl, pageUrl),
      contentUrl: getMindwaveAbsoluteUrl(primaryImageUrl, pageUrl),
      caption: headline
    };

    graph.push(primaryImage);
    webPage.primaryImageOfPage = { '@id': primaryImage['@id'] };
  }
  if (pageSections.length) webPage.hasPart = pageSections;
  if (relatedArticles.length) {
    webPage.relatedLink = relatedArticles.map(function (article) {
      return article['@id'].replace(/#article$/, '');
    });
  }
  if (contactTarget || email) {
    const actions = [];

    if (contactTarget) {
      actions.push({
        '@type': 'CommunicateAction',
        name: 'Contact Mindwave about ' + headline,
        target: contactTarget
      });
    }
    if (email) {
      actions.push({
        '@type': 'CommunicateAction',
        name: 'Email Mindwave',
        target: 'mailto:' + email
      });
    }

    webPage.potentialAction = actions;
  }

  graph.push(webPage, {
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
        name: 'Service Locations',
        item: getMindwaveAbsoluteUrl('/service-locations', siteUrl)
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: headline,
        item: pageUrl
      }
    ]
  });

  document.getElementById(MINDWAVE_LOCATION_SCHEMA_ID)?.remove();

  const schema = document.createElement('script');

  schema.id = MINDWAVE_LOCATION_SCHEMA_ID;
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph
  });
  document.head.appendChild(schema);
}

function getMindwavePageContext() {
  const canonical = document.querySelector('link[rel="canonical"]');
  const pageUrl = getMindwaveAbsoluteUrl(
    canonical?.getAttribute('href') || location.href,
    MINDWAVE_SITE_URL
  );
  const siteUrl = new URL('/', pageUrl).href;
  const titleParts = document.title.split('|');
  const footerName = cleanMindwaveText(document.querySelector('.footer_credit-text'))
    .replace(/^\u00a9\s*\d{4}\s*/, '');

  return {
    pageUrl: pageUrl,
    siteUrl: siteUrl,
    organizationId: siteUrl + '#organization',
    websiteId: siteUrl + '#website',
    pageId: pageUrl + '#webpage',
    breadcrumbId: pageUrl + '#breadcrumb',
    headline: cleanMindwaveText(document.querySelector('h1')),
    description: document.querySelector('meta[name="description"]')?.content.trim() || '',
    language: document.documentElement.lang || 'en',
    organizationName: footerName || titleParts[titleParts.length - 1].trim()
  };
}

function addMindwaveFoundation(graph, context) {
  const logo = getMindwaveImageObject(
    document.querySelector('.nav_logo-image[src], .global_animation-logo[src]'),
    context.siteUrl + '#logo',
    context.pageUrl,
    context.organizationName
  );
  const emailLink = document.querySelector('a[href^="mailto:"]');
  const email = emailLink
    ? decodeURIComponent(emailLink.href.replace(/^mailto:/i, '').split('?')[0])
    : '';
  const socialUrls = getUniqueMindwaveValues(
    Array.from(document.querySelectorAll('footer .social_link[href^="http"]'))
      .map(function (link) {
        return getMindwaveAbsoluteUrl(link.getAttribute('href'), context.pageUrl);
      })
  );
  const knowsAbout = getUniqueMindwaveValues(
    Array.from(document.querySelectorAll('.nav_dd-link-text'))
      .map(cleanMindwaveText)
  );
  const organization = {
    '@type': 'Organization',
    '@id': context.organizationId,
    name: context.organizationName,
    url: context.siteUrl
  };

  if (logo) {
    organization.logo = { '@id': logo['@id'] };
    organization.image = { '@id': logo['@id'] };
  }
  if (email) {
    organization.email = email;
    organization.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'new business enquiries',
      email: email,
      availableLanguage: context.language
    };
  }
  if (socialUrls.length) organization.sameAs = socialUrls;
  if (knowsAbout.length) organization.knowsAbout = knowsAbout;

  graph.push(organization);
  if (logo) graph.push(logo);
  graph.push({
    '@type': 'WebSite',
    '@id': context.websiteId,
    url: context.siteUrl,
    name: context.organizationName,
    publisher: { '@id': context.organizationId },
    inLanguage: context.language
  });

  return organization;
}

function getMindwaveBreadcrumb(context, levels) {
  return {
    '@type': 'BreadcrumbList',
    '@id': context.breadcrumbId,
    itemListElement: levels.map(function (level, index) {
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: level.name,
        item: getMindwaveAbsoluteUrl(level.url, context.siteUrl)
      };
    })
  };
}

function addMindwavePrimaryImage(graph, page, context, image) {
  const primaryImage = image
    ? getMindwaveImageObject(
      image,
      context.pageUrl + '#primaryimage',
      context.pageUrl,
      context.headline
    )
    : null;
  const ogImageUrl = document.querySelector('meta[property="og:image"]')?.content.trim();
  const fallbackImage = !primaryImage && ogImageUrl
    ? {
      '@type': 'ImageObject',
      '@id': context.pageUrl + '#primaryimage',
      url: getMindwaveAbsoluteUrl(ogImageUrl, context.pageUrl),
      contentUrl: getMindwaveAbsoluteUrl(ogImageUrl, context.pageUrl),
      caption: context.headline
    }
    : null;
  const selectedImage = primaryImage || fallbackImage;

  if (!selectedImage) return;

  graph.push(selectedImage);
  page.primaryImageOfPage = { '@id': selectedImage['@id'] };
}

function addMindwavePageSections(graph, context, sectionSelector, aboutId) {
  const references = [];

  document.querySelectorAll(sectionSelector).forEach(function (section, index) {
    const heading = cleanMindwaveText(section.querySelector('h2, h3'));
    const textElement = Array.from(
      section.querySelectorAll('.text-rich-text, .text-size-medium, .h2-subheader')
    ).find(function (element) {
      return cleanMindwaveText(element);
    });
    const text = cleanMindwaveText(textElement);

    if (!heading || !text) return;

    const sectionId = context.pageUrl + '#section-' + (index + 1);
    const node = {
      '@type': 'WebPageElement',
      '@id': sectionId,
      name: heading,
      text: text,
      isPartOf: { '@id': context.pageId }
    };

    if (aboutId) node.about = { '@id': aboutId };

    const image = getMindwaveImageObject(
      section.querySelector('img[src]'),
      sectionId + '-image',
      context.pageUrl,
      heading
    );

    if (image) {
      graph.push(image);
      node.image = { '@id': image['@id'] };
    }

    graph.push(node);
    references.push({ '@id': sectionId });
  });

  return references;
}

function addMindwaveProcess(graph, context, aboutId) {
  const processSection = document.querySelector('.process_content-item')?.closest('section') ||
    document.querySelector('.section_process');
  const heading = cleanMindwaveText(
    processSection?.querySelector('.heading-style-h2, h2')
  );
  const steps = processSection
    ? Array.from(processSection.querySelectorAll('.process_content-item'))
      .map(function (item, index) {
        const name = cleanMindwaveText(item.querySelector('h3, h4, h5'));
        const text = cleanMindwaveText(item.querySelector('.text-rich-text'));

        if (!name || !text) return null;

        return {
          '@type': 'HowToStep',
          position: index + 1,
          name: name,
          text: text
        };
      })
      .filter(Boolean)
    : [];

  if (!heading || !steps.length) return null;

  const process = {
    '@type': 'HowTo',
    '@id': context.pageUrl + '#process',
    name: heading,
    isPartOf: { '@id': context.pageId },
    step: steps
  };

  if (aboutId) process.about = { '@id': aboutId };

  graph.push(process);
  return { '@id': process['@id'] };
}

function addMindwaveNewsList(graph, context, listName) {
  const references = [];
  const seenUrls = new Set();

  document.querySelectorAll('.news-list_item').forEach(function (item) {
    const titleLink = item.querySelector('.news-list_title[href]');
    const url = getMindwaveAbsoluteUrl(titleLink?.getAttribute('href'), context.pageUrl);
    const headline = cleanMindwaveText(titleLink);

    if (!url || !headline || seenUrls.has(url)) return;

    seenUrls.add(url);

    const articleId = url + '#article';
    const article = {
      '@type': 'BlogPosting',
      '@id': articleId,
      url: url,
      headline: headline,
      publisher: { '@id': context.organizationId },
      isPartOf: { '@id': context.websiteId },
      inLanguage: context.language
    };
    const category = cleanMindwaveText(item.querySelector('.page_type'));
    const dateText = cleanMindwaveText(item.querySelector('.news-list_date'));
    const parsedDate = dateText ? new Date(dateText) : null;
    const image = getMindwaveImageObject(
      item.querySelector('.news-list_image[src], img[src]'),
      articleId + '-image',
      context.pageUrl,
      headline
    );

    if (category) {
      article.articleSection = category;
      article.keywords = category;
    }
    if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
      article.datePublished = parsedDate.toISOString().slice(0, 10);
    }
    if (image) {
      graph.push(image);
      article.image = { '@id': image['@id'] };
    }

    graph.push(article);
    references.push({ '@id': articleId });
  });

  if (!references.length) return null;

  const list = {
    '@type': 'ItemList',
    '@id': context.pageUrl + '#news-list',
    name: listName || 'News & Views',
    numberOfItems: references.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    itemListElement: references.map(function (reference, index) {
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: reference
      };
    })
  };

  graph.push(list);
  return {
    reference: { '@id': list['@id'] },
    articles: references
  };
}

function addMindwaveServiceList(graph, context, listName, excludedUrl) {
  const references = [];
  const urls = [];
  const seenUrls = new Set();

  document.querySelectorAll('.service-list_item').forEach(function (item) {
    const link = item.querySelector('.service-list_link[href], a[href]');
    const url = getMindwaveAbsoluteUrl(link?.getAttribute('href'), context.pageUrl);
    const name = cleanMindwaveText(
      item.querySelector('.service-list_title') || link
    );

    if (!url || !name || url === excludedUrl || seenUrls.has(url)) return;

    seenUrls.add(url);

    const serviceId = url + '#service';
    const service = {
      '@type': 'Service',
      '@id': serviceId,
      name: name,
      url: url,
      provider: { '@id': context.organizationId }
    };
    const image = getMindwaveImageObject(
      item.querySelector('.service-list_img[src], img[src]'),
      serviceId + '-image',
      context.pageUrl,
      name
    );

    if (image) {
      graph.push(image);
      service.image = { '@id': image['@id'] };
    }

    graph.push(service);
    references.push({ '@id': serviceId });
    urls.push(url);
  });

  if (!references.length) return null;

  const list = {
    '@type': 'ItemList',
    '@id': context.pageUrl + '#service-list',
    name: listName || 'Mindwave services',
    numberOfItems: references.length,
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    itemListElement: references.map(function (reference, index) {
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: reference
      };
    })
  };

  graph.push(list);
  return {
    reference: { '@id': list['@id'] },
    services: references,
    urls: urls
  };
}

function getMindwaveBasePage(type, context) {
  return {
    '@type': type,
    '@id': context.pageId,
    url: context.pageUrl,
    name: document.title,
    headline: context.headline,
    description: context.description || undefined,
    isPartOf: { '@id': context.websiteId },
    publisher: { '@id': context.organizationId },
    breadcrumb: { '@id': context.breadcrumbId },
    inLanguage: context.language
  };
}

function addMindwaveContactActions(page, context) {
  const actions = [];
  const messageTarget = document.getElementById('message-us')
    ? context.pageUrl + '#message-us'
    : getMindwaveAbsoluteUrl('/contact#message-us', context.siteUrl);
  const emailLink = document.querySelector('a[href^="mailto:"]');

  if (messageTarget) {
    actions.push({
      '@type': 'CommunicateAction',
      name: 'Message Mindwave',
      target: messageTarget
    });
  }
  if (emailLink) {
    actions.push({
      '@type': 'CommunicateAction',
      name: 'Email Mindwave',
      target: emailLink.href
    });
  }

  if (actions.length) page.potentialAction = actions;
}

function addMindwaveSubserviceCatalog(graph, context, mainService) {
  const offers = [];

  document.querySelectorAll('.subservices_column').forEach(function (column, index) {
    const name = cleanMindwaveText(
      column.querySelector('.heading-style-h5') ||
      column.querySelector('.subservices_column-horiztonal-text') ||
      column.querySelector('h3')
    );
    const descriptionElement = Array.from(
      column.querySelectorAll('.subservices_content-wrapper .text-rich-text, .text-rich-text')
    ).find(function (element) {
      return cleanMindwaveText(element);
    });

    if (!name) return;

    const subserviceId = context.pageUrl + '#subservice-' + (index + 1);
    const subservice = {
      '@type': 'Service',
      '@id': subserviceId,
      name: name,
      url: context.pageUrl,
      provider: { '@id': context.organizationId }
    };
    const description = cleanMindwaveText(descriptionElement);
    const image = getMindwaveImageObject(
      column.querySelector('.subservices_image[src], img[src]'),
      subserviceId + '-image',
      context.pageUrl,
      name
    );

    if (description) subservice.description = description;
    if (image) {
      graph.push(image);
      subservice.image = { '@id': image['@id'] };
    }

    graph.push(subservice);
    offers.push({
      '@type': 'Offer',
      itemOffered: { '@id': subserviceId }
    });
  });

  if (!offers.length) return null;

  const catalog = {
    '@type': 'OfferCatalog',
    '@id': context.pageUrl + '#service-catalog',
    name: context.headline + ' services',
    itemListElement: offers
  };

  graph.push(catalog);
  mainService.hasOfferCatalog = { '@id': catalog['@id'] };

  return { '@id': catalog['@id'] };
}

function generateMindwaveHomeSchema(graph, context) {
  const page = getMindwaveBasePage('WebPage', context);
  const parts = [];
  const services = addMindwaveServiceList(graph, context, 'Core services');
  const process = addMindwaveProcess(graph, context);
  const news = addMindwaveNewsList(graph, context, 'Latest News & Views');

  if (services) {
    page.mainEntity = services.reference;
    parts.push(services.reference);
  }
  if (process) parts.push(process);
  if (news) {
    parts.push(news.reference);
    page.relatedLink = news.articles.map(function (article) {
      return article['@id'].replace(/#article$/, '');
    });
  }
  if (parts.length) page.hasPart = parts;

  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(graph, page, context);
  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl }
  ]));
}

function generateMindwaveAboutSchema(graph, context) {
  const page = getMindwaveBasePage('AboutPage', context);
  const parts = addMindwavePageSections(
    graph,
    context,
    'main section:not(.section_cta)',
    context.organizationId
  );
  const careerLinks = getUniqueMindwaveValues(
    Array.from(document.querySelectorAll('.career-list_item a[href]'))
      .map(function (link) {
        return getMindwaveAbsoluteUrl(link.getAttribute('href'), context.pageUrl);
      })
  );

  page.about = { '@id': context.organizationId };
  page.mainEntity = { '@id': context.organizationId };
  if (parts.length) page.hasPart = parts;
  if (careerLinks.length) page.significantLink = careerLinks;

  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(graph, page, context);
  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl },
    { name: context.headline || 'Who We Are', url: context.pageUrl }
  ]));
}

function generateMindwaveServicesIndexSchema(graph, context) {
  const page = getMindwaveBasePage('CollectionPage', context);
  const services = addMindwaveServiceList(graph, context, 'Mindwave services');

  if (services) {
    page.mainEntity = services.reference;
    page.hasPart = [services.reference];
  }

  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(graph, page, context);
  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl },
    { name: context.headline || 'What We Do', url: context.pageUrl }
  ]));
}

function generateMindwaveServiceSchema(graph, context) {
  const serviceId = context.pageUrl + '#service';
  const service = {
    '@type': 'Service',
    '@id': serviceId,
    name: context.headline,
    serviceType: context.headline,
    description: context.description,
    url: context.pageUrl,
    provider: { '@id': context.organizationId },
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: context.pageUrl,
      availableLanguage: context.language
    }
  };
  const page = getMindwaveBasePage('WebPage', context);
  const parts = addMindwavePageSections(
    graph,
    context,
    '.section_service-why .service-why_content',
    serviceId
  );
  const catalog = addMindwaveSubserviceCatalog(graph, context, service);
  const process = addMindwaveProcess(graph, context, serviceId);
  const news = addMindwaveNewsList(graph, context, 'Related News & Views');
  const relatedServices = addMindwaveServiceList(
    graph,
    context,
    'More services',
    context.pageUrl
  );

  if (catalog) parts.push(catalog);
  if (process) parts.push(process);
  if (news) {
    service.subjectOf = news.articles;
    parts.push(news.reference);
  }
  if (relatedServices) {
    if (relatedServices.urls.length) page.relatedLink = relatedServices.urls;
    parts.push(relatedServices.reference);
  }

  graph.push(service);
  page.about = { '@id': serviceId };
  page.mainEntity = { '@id': serviceId };
  if (parts.length) page.hasPart = parts;

  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(
    graph,
    page,
    context,
    document.querySelector('.service-why_image[src], .service-header_content-right img[src]')
  );
  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl },
    { name: 'What We Do', url: '/what-we-do' },
    { name: context.headline, url: context.pageUrl }
  ]));
}

function generateMindwaveNewsListSchema(graph, context, isCategory) {
  const page = getMindwaveBasePage('CollectionPage', context);
  const displayHeadline = isCategory
    ? document.title.split('|')[0].trim()
    : context.headline;
  const news = addMindwaveNewsList(
    graph,
    context,
    isCategory ? displayHeadline + ' articles' : 'News & Views'
  );

  page.headline = displayHeadline;
  if (news) {
    page.mainEntity = news.reference;
    page.hasPart = [news.reference];
  }

  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(graph, page, context);

  const levels = [
    { name: 'Home', url: context.siteUrl },
    { name: 'News & Views', url: '/news-and-views' }
  ];

  if (isCategory) levels.push({ name: displayHeadline, url: context.pageUrl });

  graph.push(page, getMindwaveBreadcrumb(context, levels));
}

function generateMindwaveArticleSchema(graph, context) {
  const articleId = context.pageUrl + '#article';
  const category = cleanMindwaveText(document.querySelector('.section_header .page_type'));
  const authorText = cleanMindwaveText(
    document.querySelector('.news_details:not(.w-condition-invisible) .news_detail-text:not(.is-date)')
  );
  const authorName = authorText.replace(/\s*@\s*Mindwave\s*$/i, '').trim();
  const dateText = cleanMindwaveText(
    document.querySelector('.news_details:not(.w-condition-invisible) .news_detail-text.is-date')
  );
  const parsedDate = dateText ? new Date(dateText) : null;
  const articleBody = Array.from(
    document.querySelectorAll('.section_news-article .text-rich-text')
  ).map(cleanMindwaveText).sort(function (a, b) {
    return b.length - a.length;
  })[0] || '';
  const article = {
    '@type': 'BlogPosting',
    '@id': articleId,
    url: context.pageUrl,
    headline: context.headline,
    description: context.description,
    articleBody: articleBody || undefined,
    articleSection: category || undefined,
    keywords: category || undefined,
    publisher: { '@id': context.organizationId },
    mainEntityOfPage: { '@id': context.pageId },
    isPartOf: { '@id': context.websiteId },
    inLanguage: context.language
  };

  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    article.datePublished = parsedDate.toISOString().slice(0, 10);
  }
  if (authorName) {
    const authorId = context.siteUrl + '#author-' + authorName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    graph.push({
      '@type': 'Person',
      '@id': authorId,
      name: authorName,
      affiliation: { '@id': context.organizationId }
    });
    article.author = { '@id': authorId };
  }

  const articleImage = getMindwaveImageObject(
    document.querySelector('.news_main-image[src]'),
    context.pageUrl + '#primaryimage',
    context.pageUrl,
    context.headline
  );

  if (articleImage) {
    graph.push(articleImage);
    article.image = { '@id': articleImage['@id'] };
  }

  graph.push(article);

  const page = getMindwaveBasePage('WebPage', context);
  const relatedNews = addMindwaveNewsList(graph, context, 'More News & Views');

  page.mainEntity = { '@id': articleId };
  page.about = category || undefined;
  if (articleImage) page.primaryImageOfPage = { '@id': articleImage['@id'] };
  if (relatedNews) {
    page.relatedLink = relatedNews.articles.map(function (relatedArticle) {
      return relatedArticle['@id'].replace(/#article$/, '');
    });
    page.hasPart = [relatedNews.reference];
  }
  addMindwaveContactActions(page, context);

  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl },
    { name: 'News & Views', url: '/news-and-views' },
    { name: context.headline, url: context.pageUrl }
  ]));
}

function generateMindwaveContactSchema(graph, context, organization) {
  const page = getMindwaveBasePage('ContactPage', context);
  const locationsBlock = Array.from(document.querySelectorAll('.contact_block'))
    .find(function (block) {
      return /^locations$/i.test(cleanMindwaveText(block.querySelector('h2, h3')));
    });
  const locations = locationsBlock
    ? getUniqueMindwaveValues(
      Array.from(locationsBlock.children)
        .map(cleanMindwaveText)
        .filter(function (text) {
          return text && !/^locations$/i.test(text);
        })
    )
    : [];

  if (locations.length) {
    organization.location = locations.map(function (name) {
      return {
        '@type': 'Place',
        name: name
      };
    });
  }

  page.about = { '@id': context.organizationId };
  page.mainEntity = { '@id': context.organizationId };
  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(graph, page, context);
  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl },
    { name: context.headline || 'Contact', url: context.pageUrl }
  ]));
}

function generateMindwaveServiceLocationsIndexSchema(graph, context) {
  const page = getMindwaveBasePage('CollectionPage', context);
  const references = [];

  document.querySelectorAll('.locations-list_item').forEach(function (item, index) {
    const link = item.querySelector('a[href]');
    const url = getMindwaveAbsoluteUrl(link?.getAttribute('href'), context.pageUrl);
    const name = cleanMindwaveText(link || item);

    if (!url || !name) return;

    const match = name.match(/^(.*?\sAgency)\s+(.+)$/i);
    const serviceId = url + '#service';
    const service = {
      '@type': 'Service',
      '@id': serviceId,
      name: name,
      serviceType: match ? match[1] : name,
      url: url,
      provider: { '@id': context.organizationId }
    };

    if (match) {
      service.areaServed = {
        '@type': 'City',
        name: match[2]
      };
    }

    graph.push(service);
    references.push({
      '@type': 'ListItem',
      position: index + 1,
      item: { '@id': serviceId }
    });
  });

  if (references.length) {
    const list = {
      '@type': 'ItemList',
      '@id': context.pageUrl + '#location-services',
      name: context.headline,
      numberOfItems: references.length,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: references
    };

    graph.push(list);
    page.mainEntity = { '@id': list['@id'] };
    page.hasPart = [{ '@id': list['@id'] }];
  }

  const services = addMindwaveServiceList(graph, context, 'Mindwave services');
  const news = addMindwaveNewsList(graph, context, 'Latest News & Views');

  if (services) page.hasPart = (page.hasPart || []).concat(services.reference);
  if (news) {
    page.hasPart = (page.hasPart || []).concat(news.reference);
    page.relatedLink = news.articles.map(function (article) {
      return article['@id'].replace(/#article$/, '');
    });
  }

  addMindwaveContactActions(page, context);
  addMindwavePrimaryImage(graph, page, context);
  graph.push(page, getMindwaveBreadcrumb(context, [
    { name: 'Home', url: context.siteUrl },
    { name: context.headline || 'Service Locations', url: context.pageUrl }
  ]));
}

function generateMindwavePageSchema() {
  if (
    document.documentElement.dataset.wfCollection ===
    MINDWAVE_LOCATION_COLLECTION_ID
  ) {
    return;
  }

  const pageId = document.documentElement.dataset.wfPage;
  const collectionId = document.documentElement.dataset.wfCollection;
  const supported = Object.values(MINDWAVE_PAGE_IDS).includes(pageId) ||
    MINDWAVE_SERVICE_PAGE_IDS.includes(pageId) ||
    collectionId === MINDWAVE_NEWS_COLLECTION_ID ||
    collectionId === MINDWAVE_NEWS_CATEGORY_COLLECTION_ID;

  if (!supported) return;

  const context = getMindwavePageContext();

  if (!context.pageUrl || !context.headline) return;

  const graph = [];
  const organization = addMindwaveFoundation(graph, context);

  if (pageId === MINDWAVE_PAGE_IDS.home) {
    generateMindwaveHomeSchema(graph, context);
  } else if (pageId === MINDWAVE_PAGE_IDS.whoWeAre) {
    generateMindwaveAboutSchema(graph, context);
  } else if (pageId === MINDWAVE_PAGE_IDS.whatWeDo) {
    generateMindwaveServicesIndexSchema(graph, context);
  } else if (MINDWAVE_SERVICE_PAGE_IDS.includes(pageId)) {
    generateMindwaveServiceSchema(graph, context);
  } else if (pageId === MINDWAVE_PAGE_IDS.news) {
    generateMindwaveNewsListSchema(graph, context, false);
  } else if (collectionId === MINDWAVE_NEWS_CATEGORY_COLLECTION_ID) {
    generateMindwaveNewsListSchema(graph, context, true);
  } else if (collectionId === MINDWAVE_NEWS_COLLECTION_ID) {
    generateMindwaveArticleSchema(graph, context);
  } else if (pageId === MINDWAVE_PAGE_IDS.contact) {
    generateMindwaveContactSchema(graph, context, organization);
  } else if (pageId === MINDWAVE_PAGE_IDS.serviceLocations) {
    generateMindwaveServiceLocationsIndexSchema(graph, context);
  }

  if (graph.length <= 3) return;

  document.getElementById(MINDWAVE_PAGE_SCHEMA_ID)?.remove();

  const schema = document.createElement('script');

  schema.id = MINDWAVE_PAGE_SCHEMA_ID;
  schema.type = 'application/ld+json';
  schema.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': graph
  });
  document.head.appendChild(schema);
}

// ALTERNATE SERVICE LINKS
function addAlternatingServiceLinkClasses() {
  document.querySelectorAll('.service-list_link').forEach(function (link, index) {
    if (index % 2 === 1) link.classList.add('is-alt');
  });
}

// PRICING PAGE STICKY NAVIGATION
function initMindwavePricingNavigation() {
  if (location.pathname.replace(/\/+$/, '') !== '/pricing') return;

  const pricingNavSection = document.querySelector('.section_pricing-nav');
  const pricingNav = pricingNavSection?.querySelector('.pricing_nav');
  const header = document.querySelector('.nav_component');
  const finalPricingSection = document.querySelector('#faq');

  if (!pricingNavSection || !pricingNav || !finalPricingSection) return;

  const googleAdsSection = document.querySelector('.section_pricing-ads');
  const googleAdsLink = pricingNav.querySelector('a[href="#google-ads"]');

  if (googleAdsSection && !document.getElementById('pricing-google-ads')) {
    googleAdsSection.id = 'pricing-google-ads';
  }

  if (googleAdsLink) {
    googleAdsLink.setAttribute('href', '#pricing-google-ads');
  }

  if (!document.getElementById('mindwave-pricing-navigation-styles')) {
    const style = document.createElement('style');

    style.id = 'mindwave-pricing-navigation-styles';
    style.textContent = `
      .section_pricing-nav {
        position: sticky;
        top: calc(var(--mindwave-header-height, 0px) + 4px);
        z-index: 20;
        background-color: #fff;
        opacity: 1;
        transform: translateY(0);
        transition: opacity 180ms ease, transform 180ms ease;
      }

      .section_pricing-nav.is-past-pricing {
        opacity: 0;
        transform: translateY(-0.5rem);
        pointer-events: none;
      }

      .section_pricing-nav .pricing_nav {
        width: 100%;
        max-width: 100%;
        display: flex;
        flex-wrap: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-x: contain;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
      }

      .section_pricing-nav .pricing_nav-link {
        flex: 0 0 auto;
        white-space: nowrap;
      }

      #pricing-google-ads,
      #klaviyo,
      #both-channels,
      #calculator,
      #why-both-together,
      #other-services,
      #onboarding,
      #faq {
        scroll-margin-top: calc(
          var(--mindwave-header-height, 0px) +
          var(--mindwave-pricing-nav-height, 0px) +
          12px
        );
      }

      @media (prefers-reduced-motion: reduce) {
        .section_pricing-nav {
          transition: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  let frameId = 0;

  function getPricingHeaderHeight() {
    if (!header) return 0;

    return window.matchMedia('(min-width: 992px)').matches
      ? 60
      : Math.ceil(header.getBoundingClientRect().height);
  }

  function updatePricingNavigation() {
    frameId = 0;

    const headerHeight = getPricingHeaderHeight();
    const pricingNavHeight = Math.ceil(
      pricingNavSection.getBoundingClientRect().height
    );
    const stickyTop = headerHeight + 4;
    const finalPricingBottom =
      finalPricingSection.getBoundingClientRect().bottom + window.scrollY;
    const shouldHide =
      window.scrollY + stickyTop + pricingNavHeight >= finalPricingBottom;

    document.documentElement.style.setProperty(
      '--mindwave-header-height',
      headerHeight + 'px'
    );
    document.documentElement.style.setProperty(
      '--mindwave-pricing-nav-height',
      pricingNavHeight + 'px'
    );
    pricingNavSection.classList.toggle('is-past-pricing', shouldHide);
  }

  function queuePricingNavigationUpdate() {
    if (frameId) return;
    frameId = window.requestAnimationFrame(updatePricingNavigation);
  }

  window.addEventListener('scroll', queuePricingNavigationUpdate, {
    passive: true
  });
  window.addEventListener('resize', queuePricingNavigationUpdate, {
    passive: true
  });

  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(queuePricingNavigationUpdate);

    if (header) resizeObserver.observe(header);
    resizeObserver.observe(pricingNavSection);
  }

  pricingNav.addEventListener('click', function (event) {
    const link = event.target.closest('a[href*="#"]');
    const target = link ? document.querySelector(link.hash) : null;

    if (!target) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const headerHeight = getPricingHeaderHeight();
    const pricingNavHeight = Math.ceil(
      pricingNavSection.getBoundingClientRect().height
    );
    const targetTop =
      target.getBoundingClientRect().top +
      window.scrollY -
      headerHeight -
      pricingNavHeight -
      12;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    window.history.pushState(null, '', link.hash);
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  }, true);

  updatePricingNavigation();
}

// PRICING CALCULATOR
const MINDWAVE_PRICING_CONFIG = {
  MIN_SPEND: 3000,
  COMBINED_DISCOUNT: 750,
  // Google Ads tiers — exact, from the deck. A tier applies from its min up to the next tier's min.
  GOOGLE_TIERS: [
    { min: 3000, fee: 1000 },
    { min: 7000, fee: 1750 },
    { min: 20000, fee: 2750 },
    { min: 35000, fee: 3250 },
    { min: 50000, fee: 4000, from: true }
  ],
  // Klaviyo bands — PLACEHOLDER, awaiting sign-off from Mindwave. Do not ship without confirmed figures.
  // Only the 50k–100k band is anchored to a real figure (80k profiles = €1,500).
  KLAVIYO_BANDS: [
    { min: 0, fee: 1000 }, // Under 25k
    { min: 25000, fee: 1250 }, // 25k–50k
    { min: 50000, fee: 1500 }, // 50k–100k
    { min: 100000, fee: 2250 }, // 100k–150k
    { min: 150000, fee: 3000, from: true } // 150k+
  ]
};

function getMindwavePricingBand(bands, value) {
  let match = null;

  bands.forEach(function (band) {
    if (value >= band.min) match = band;
  });

  return match;
}

function formatMindwaveEuro(amount) {
  return '€' + Math.round(amount).toLocaleString('en-IE');
}

function formatMindwavePricingFee(band) {
  return (band.from ? 'From ' : '') + formatMindwaveEuro(band.fee);
}

function formatMindwaveProfiles(value) {
  return Math.round(value / 1000) + 'k';
}

function initMindwavePricingCalculator() {
  const calculators = document.querySelectorAll('[data-pricing-calculator]');

  if (!calculators.length) return;

  // Range track and thumb pseudo-elements cannot be styled with native Webflow
  // controls, so the slider styling is injected here alongside its behaviour.
  if (!document.getElementById('mindwave-pricing-calculator-styles')) {
    const style = document.createElement('style');

    style.id = 'mindwave-pricing-calculator-styles';
    style.textContent = `
      [data-pricing-calculator] .pricing_range {
        -webkit-appearance: none;
        appearance: none;
        height: 1.5rem;
        background: transparent;
        cursor: pointer;
      }

      [data-pricing-calculator] .pricing_range::-webkit-slider-runnable-track {
        height: 8px;
        border-radius: 999px;
        background: linear-gradient(90deg, #6e85ff 0%, #cb94ff var(--pricing-range-progress, 50%), #e6e6ee var(--pricing-range-progress, 50%), #e6e6ee 100%);
      }

      [data-pricing-calculator] .pricing_range::-moz-range-track {
        height: 8px;
        border-radius: 999px;
        background: linear-gradient(90deg, #6e85ff 0%, #cb94ff var(--pricing-range-progress, 50%), #e6e6ee var(--pricing-range-progress, 50%), #e6e6ee 100%);
      }

      [data-pricing-calculator] .pricing_range::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        margin-top: -7px;
        border: 3px solid #fff;
        border-radius: 50%;
        background: #6e85ff;
        box-shadow: 0 2px 8px rgba(110, 133, 255, 0.45);
      }

      [data-pricing-calculator] .pricing_range::-moz-range-thumb {
        width: 22px;
        height: 22px;
        border: 3px solid #fff;
        border-radius: 50%;
        background: #6e85ff;
        box-shadow: 0 2px 8px rgba(110, 133, 255, 0.45);
      }

      [data-pricing-calculator] .pricing_range:focus-visible {
        outline: 2px solid #6e85ff;
        outline-offset: 4px;
        border-radius: 999px;
      }
    `;
    document.head.appendChild(style);
  }

  calculators.forEach(function (calculator) {
    const config = MINDWAVE_PRICING_CONFIG;
    const googleToggle = calculator.querySelector('[data-pricing-toggle="google"]');
    const klaviyoToggle = calculator.querySelector('[data-pricing-toggle="klaviyo"]');
    const spendInput = calculator.querySelector('[data-pricing-input="google-spend"]');
    const profilesInput = calculator.querySelector(
      '[data-pricing-input="klaviyo-profiles"]'
    );

    function setText(selector, text) {
      calculator.querySelectorAll(selector).forEach(function (element) {
        element.textContent = text;
      });
    }

    function setVisible(selector, isVisible, display) {
      calculator.querySelectorAll(selector).forEach(function (element) {
        element.style.display = isVisible ? display || '' : 'none';
      });
    }

    function updateRangeProgress(input) {
      const min = Number(input.min) || 0;
      const max = Number(input.max) || 100;
      const progress =
        max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;

      input.style.setProperty('--pricing-range-progress', progress + '%');
    }

    function updatePricingCalculator() {
      const hasGoogle = Boolean(spendInput) && (!googleToggle || googleToggle.checked);
      const hasKlaviyo =
        Boolean(profilesInput) && (!klaviyoToggle || klaviyoToggle.checked);
      const spend = spendInput ? Number(spendInput.value) : 0;
      const profiles = profilesInput ? Number(profilesInput.value) : 0;
      const spendLabel =
        formatMindwaveEuro(spend) +
        (spendInput && spend >= Number(spendInput.max) ? '+' : '');
      const profilesLabel =
        formatMindwaveProfiles(profiles) +
        (profilesInput && profiles >= Number(profilesInput.max) ? '+' : '');
      const isBelowMinSpend = hasGoogle && spend < config.MIN_SPEND;
      const googleBand =
        hasGoogle && !isBelowMinSpend
          ? getMindwavePricingBand(config.GOOGLE_TIERS, spend)
          : null;
      const klaviyoBand = hasKlaviyo
        ? getMindwavePricingBand(config.KLAVIYO_BANDS, profiles)
        : null;
      const hasDiscount = hasGoogle && hasKlaviyo && !isBelowMinSpend;

      if (spendInput) {
        spendInput.setAttribute('aria-valuetext', spendLabel + ' per month');
        updateRangeProgress(spendInput);
      }

      if (profilesInput) {
        profilesInput.setAttribute('aria-valuetext', profilesLabel + ' profiles');
        updateRangeProgress(profilesInput);
      }

      setText('[data-pricing-output="google-spend"]', spendLabel);
      setText('[data-pricing-output="klaviyo-profiles"]', profilesLabel);

      setVisible('[data-pricing-field="google"]', hasGoogle);
      setVisible('[data-pricing-field="klaviyo"]', hasKlaviyo);
      setVisible('[data-pricing-row="google"]', hasGoogle);
      setVisible('[data-pricing-row="klaviyo"]', hasKlaviyo);
      setVisible('[data-pricing-row="discount"]', hasDiscount);
      setVisible('[data-pricing-klaviyo-only]', hasKlaviyo);
      setVisible('[data-pricing-discount-note]', hasDiscount);
      setVisible('[data-pricing-notice="min-spend"]', isBelowMinSpend, 'inline-flex');
      setVisible('[data-pricing-output="google-fee"]', !isBelowMinSpend);

      if (googleBand) {
        setText('[data-pricing-output="google-fee"]', formatMindwavePricingFee(googleBand));
      }

      if (klaviyoBand) {
        setText('[data-pricing-output="klaviyo-fee"]', formatMindwavePricingFee(klaviyoBand));
      }

      setText(
        '[data-pricing-output="discount"]',
        '−' + formatMindwaveEuro(config.COMBINED_DISCOUNT)
      );

      let total = 'Pick a channel';

      if (isBelowMinSpend) {
        total = 'Let’s talk';
      } else if (hasGoogle || hasKlaviyo) {
        const bands = [googleBand, klaviyoBand].filter(Boolean);
        const sum =
          bands.reduce(function (runningTotal, band) {
            return runningTotal + band.fee;
          }, 0) - (hasDiscount ? config.COMBINED_DISCOUNT : 0);
        const isFrom = bands.some(function (band) {
          return band.from;
        });

        total = (isFrom ? 'From ' : '') + formatMindwaveEuro(sum);
      }

      setText('[data-pricing-output="total"]', total);
    }

    calculator.querySelectorAll('[data-pricing-output="total"]').forEach(function (output) {
      if (!output.hasAttribute('aria-live')) output.setAttribute('aria-live', 'polite');
    });

    [googleToggle, klaviyoToggle, spendInput, profilesInput].forEach(function (input) {
      if (!input) return;

      input.addEventListener('input', updatePricingCalculator);
      input.addEventListener('change', updatePricingCalculator);
    });

    updatePricingCalculator();
  });
}

function initMindwavePage() {
  generateMindwaveServiceLocationSchema();
  generateMindwavePageSchema();
  addAlternatingServiceLinkClasses();
  initMindwavePricingNavigation();
  initMindwavePricingCalculator();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMindwavePage);
} else {
  initMindwavePage();
}

// // INSERT TABLE SCROLL WRAPPER
// $('.table_component').each(function () {
//   const scrollElement = $('.global_table-scroll').first().clone();
//   $(this).after(scrollElement);
// });

// // SET ALL PROCESS BLOCKS TO SAME HEIGHT
// let tallest = 0;
// $('.process_content-item').each(function () {
//   const height = $(this).outerHeight(); // includes padding and border
//   if (height > tallest) {
//     tallest = height;
//   }
// });
// $('.process_content-item').each(function () {
//   $(this).outerHeight(tallest); // this sets the total height correctly
// });

// // PAGE LOAD ANIMATION
// $(document).ready(function () {
//   const hasVisited = localStorage.getItem('hasVisited');
//   const expiry = localStorage.getItem('hasVisitedExpiry');
//   const now = Date.now();

//   if (!hasVisited || now > parseInt(expiry)) {
//     localStorage.setItem('hasVisited', 'true');
//     localStorage.setItem('hasVisitedExpiry', now + 2 * 24 * 60 * 60 * 1000); // 30 minutes

//     $(".global_animation").css("display", "flex");
//     const fullText = "Mindwave";
//     const $target = $(".global_animation-text");
//     $target.empty();
//     const tl = gsap.timeline({ repeat: 0 });
//     tl.to({}, { duration: 0.3 }); // Wait 300ms before starting
//     fullText.split("").forEach((char, i) => {
//       tl.call(() => {
//         const $span = $("<span>").text(char);
//         if (i >= 4) {
//           if (i === 4) {
//             const $wrapper = $("<span>").addClass("text-color-gradient");
//             $target.append($wrapper);
//             $wrapper.append($span);
//           } else {
//             $target.find(".text-color-gradient").append($span);
//           }
//         } else {
//           $target.append($span);
//         }
//       }, null, "+=0.13");
//     });
//     tl.to({}, { duration: 0.2 })
//       .to(".global_animation-text-wrapper", { opacity: 0, duration: 0.3 })
//       .to(".global_animation-door", { width: "0%", duration: 1 })
//       .set(".global_animation", { display: "none" });
//   } else {
//     $(".global_animation").css("display", "none");
//   }
// });

// NAV WAVE ANIMATION
// $(".nav_link.is-test, .nav_logo-text").each(function () {
//   const text = $(this).text();
//   const wrapped = text
//     .split("")
//     .map((char) => (char === " " ? `<span>&nbsp;</span>` : `<span>${char}</span>`))
//     .join("");
//   $(this).html(wrapped);
// });

// $(".nav_link.is-test, .nav_logo-text").on("mouseenter", function () {
//   gsap.to($(this).find("span"), {
//     y: -12,
//     stagger: {
//       each: 0.04,
//       from: "start",
//       yoyo: true,
//       repeat: 1,
//     },
//     ease: "power2.out",
//     duration: 0.2,
//   });
// });
