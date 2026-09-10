// Last updated: 2026-09-10 21:07:38

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

// ALTERNATE SERVICE LINKS
function addAlternatingServiceLinkClasses() {
  document.querySelectorAll('.service-list_link').forEach(function (link, index) {
    if (index % 2 === 1) link.classList.add('is-alt');
  });
}

function initMindwavePage() {
  generateMindwaveServiceLocationSchema();
  addAlternatingServiceLinkClasses();
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
