// Last updated: 2026-09-12 15:04:32

(function () {
  'use strict';

  const SCHEMA_ID = 'dundrum-orthodontics-schema';
  const SITE_ID = '6a04de4a6324d0e78450ddf3';
  const SITE_URL = 'https://www.dundrumorthodontics.ie/';
  const CLINIC_ID = SITE_URL + '#clinic';
  const WEBSITE_ID = SITE_URL + '#website';
  const LOGO_URL =
    'https://cdn.prod.website-files.com/6a04de4a6324d0e78450ddf3/6a26d67302b998205876d4f3_dundrum-orthodontics_logo-navy.svg';
  const DEFAULT_IMAGE_URL =
    'https://cdn.prod.website-files.com/6a04de4a6324d0e78450ddf3/6aa42e4058ccc1f4b2182153_og-image.jpg';
  const MAP_URL =
    'https://www.google.com/maps/place/Dundrum+Orthodontics/@53.2875308,-6.2468619,17z';

  function clean(value) {
    const text = value && value.nodeType ? value.textContent : value;
    return String(text || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function absoluteUrl(value, base) {
    if (!value || value === '#') return '';
    try {
      const url = new URL(value, base || SITE_URL);
      url.hash = '';
      return url.href;
    } catch (_error) {
      return '';
    }
  }

  function canonicalUrl() {
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    const url = new URL(canonical || window.location.href, SITE_URL);
    url.hash = '';
    url.search = '';
    return url.href.replace(/\/$/, '') || SITE_URL;
  }

  function slug(value) {
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'item';
  }

  function unique(values) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function textFrom(root, selector) {
    return clean(root?.querySelector(selector));
  }

  function longestText(root, selector) {
    return Array.from(root?.querySelectorAll(selector) || [])
      .map(clean)
      .sort(function (a, b) {
        return b.length - a.length;
      })[0] || '';
  }

  function imageNode(elementOrUrl, id, pageUrl, fallbackCaption) {
    const element = elementOrUrl && elementOrUrl.nodeType ? elementOrUrl : null;
    const rawUrl = element
      ? element.currentSrc || element.getAttribute('src') || element.getAttribute('data-src')
      : elementOrUrl;
    const url = absoluteUrl(rawUrl, pageUrl);

    if (!url) return null;

    const image = {
      '@type': 'ImageObject',
      '@id': id,
      url: url,
      contentUrl: url,
      caption: clean(element?.getAttribute('alt')) || fallbackCaption || undefined
    };
    const width = Number(element?.getAttribute('width'));
    const height = Number(element?.getAttribute('height'));

    if (width > 0) image.width = width;
    if (height > 0) image.height = height;

    return image;
  }

  function parseDate(value) {
    const date = value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime())
      ? date.toISOString().slice(0, 10)
      : '';
  }

  function context() {
    const pageUrl = canonicalUrl();
    const path = new URL(pageUrl).pathname.replace(/\/$/, '') || '/';
    const headline = clean(document.querySelector('main h1, h1')) ||
      document.title.split('|')[0].trim();

    return {
      pageUrl: pageUrl,
      path: path,
      headline: headline,
      description: document.querySelector('meta[name="description"]')?.content.trim() || '',
      language: document.documentElement.lang || 'en',
      pageId: pageUrl + '#webpage',
      breadcrumbId: pageUrl + '#breadcrumb',
      collectionId: document.documentElement.dataset.wfCollection || ''
    };
  }

  function addFoundation(graph, ctx) {
    const logo = imageNode(LOGO_URL, SITE_URL + '#logo', SITE_URL, 'Dundrum Orthodontics');
    const clinicImage = imageNode(
      DEFAULT_IMAGE_URL,
      SITE_URL + '#clinic-image',
      SITE_URL,
      'Dundrum Orthodontics'
    );
    const clinic = {
      '@type': ['Dentist', 'MedicalClinic'],
      '@id': CLINIC_ID,
      name: 'Dundrum Orthodontics',
      url: SITE_URL,
      description:
        'Specialist orthodontic clinic in Dundrum, Dublin 16 providing braces and clear aligner treatment for children, teenagers and adults.',
      medicalSpecialty: 'https://schema.org/Dentistry',
      logo: { '@id': logo['@id'] },
      image: { '@id': clinicImage['@id'] },
      telephone: '+35312963638',
      email: 'reception@dundrumorthodontics.ie',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'The Gables, 11 Ballinteer Road',
        addressLocality: 'Dundrum',
        addressRegion: 'Dublin 16',
        postalCode: 'D16 FE08',
        addressCountry: 'IE'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 53.2875308,
        longitude: -6.2468619
      },
      hasMap: MAP_URL,
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'https://schema.org/Monday',
          'https://schema.org/Tuesday',
          'https://schema.org/Wednesday',
          'https://schema.org/Thursday',
          'https://schema.org/Friday'
        ],
        opens: '09:00',
        closes: '17:00'
      }],
      contactPoint: [
        {
          '@type': 'ContactPoint',
          contactType: 'appointments and enquiries',
          telephone: '+35312963638',
          email: 'reception@dundrumorthodontics.ie',
          availableLanguage: 'English'
        },
        {
          '@type': 'ContactPoint',
          contactType: 'WhatsApp enquiries',
          telephone: '+353838969996',
          url: 'https://wa.me/353838969996',
          availableLanguage: 'English'
        }
      ],
      sameAs: [
        'https://www.facebook.com/dundrumorthodontics/',
        'https://www.instagram.com/dundrumorthodontics',
        'https://www.linkedin.com/company/dundrum-orthodontics/'
      ],
      potentialAction: {
        '@type': 'ReserveAction',
        name: 'Book an orthodontic consultation',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: absoluteUrl('/book-consultation', SITE_URL),
          actionPlatform: [
            'https://schema.org/DesktopWebPlatform',
            'https://schema.org/MobileWebPlatform'
          ]
        }
      }
    };

    graph.push(clinic, logo, clinicImage, {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL,
      name: 'Dundrum Orthodontics',
      publisher: { '@id': CLINIC_ID },
      inLanguage: ctx.language
    });
    return clinic;
  }

  function addTreatmentCatalog(graph, clinic, ctx) {
    const seen = new Set();
    const services = [];

    document.querySelectorAll('a[href*="/treatment/"]').forEach(function (link) {
      const url = absoluteUrl(link.getAttribute('href'), ctx.pageUrl);
      const name = clean(link);

      if (!url || !name || seen.has(url)) return;
      seen.add(url);

      const id = url + '#service';
      graph.push({
        '@type': 'Service',
        '@id': id,
        name: name,
        serviceType: name,
        url: url,
        provider: { '@id': CLINIC_ID },
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceUrl: url,
          availableLanguage: ctx.language
        }
      });
      services.push({ '@id': id });
    });

    if (!services.length) return null;

    const catalog = {
      '@type': 'OfferCatalog',
      '@id': SITE_URL + '#treatment-catalog',
      name: 'Orthodontic treatments',
      itemListElement: services.map(function (service) {
        return { '@type': 'Offer', itemOffered: service };
      })
    };

    graph.push(catalog);
    clinic.hasOfferCatalog = { '@id': catalog['@id'] };
    clinic.knowsAbout = unique(
      Array.from(document.querySelectorAll('a[href*="/condition/"]')).map(clean)
    );
    return { reference: { '@id': catalog['@id'] }, services: services };
  }

  function breadcrumb(graph, ctx, middle) {
    const levels = [{ name: 'Home', url: SITE_URL }]
      .concat(middle || [])
      .concat(ctx.path === '/' ? [] : [{ name: ctx.headline, url: ctx.pageUrl }]);

    graph.push({
      '@type': 'BreadcrumbList',
      '@id': ctx.breadcrumbId,
      itemListElement: levels.map(function (level, index) {
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: level.name,
          item: absoluteUrl(level.url, SITE_URL)
        };
      })
    });
  }

  function basePage(type, ctx) {
    return {
      '@type': type,
      '@id': ctx.pageId,
      url: ctx.pageUrl,
      name: document.title,
      headline: ctx.headline,
      description: ctx.description || undefined,
      isPartOf: { '@id': WEBSITE_ID },
      publisher: { '@id': CLINIC_ID },
      breadcrumb: { '@id': ctx.breadcrumbId },
      inLanguage: ctx.language
    };
  }

  function addPrimaryImage(graph, page, ctx) {
    const url = document.querySelector('meta[property="og:image"]')?.content || DEFAULT_IMAGE_URL;
    const image = imageNode(url, ctx.pageUrl + '#primaryimage', ctx.pageUrl, ctx.headline);
    if (!image) return null;
    graph.push(image);
    page.primaryImageOfPage = { '@id': image['@id'] };
    return { '@id': image['@id'] };
  }

  function addItemList(graph, ctx, idSuffix, name, references, order) {
    if (!references.length) return null;
    const list = {
      '@type': 'ItemList',
      '@id': ctx.pageUrl + '#' + idSuffix,
      name: name,
      numberOfItems: references.length,
      itemListOrder: order || 'https://schema.org/ItemListOrderAscending',
      itemListElement: references.map(function (reference, index) {
        return { '@type': 'ListItem', position: index + 1, item: reference };
      })
    };
    graph.push(list);
    return { '@id': list['@id'] };
  }

  function addMention(page, reference) {
    if (!reference) return;
    page.mentions = (page.mentions || []).concat(reference);
  }

  function addFaqs(graph, page, ctx) {
    const questions = [];

    document.querySelectorAll('.faq_item').forEach(function (item, index) {
      const name = textFrom(item, '.faq_question');
      const answer = textFrom(item, '.faq_answer-inner') || textFrom(item, '.faq_answer');
      if (!name || !answer) return;

      const question = {
        '@type': 'Question',
        '@id': ctx.pageUrl + '#question-' + (index + 1),
        name: name,
        acceptedAnswer: { '@type': 'Answer', text: answer }
      };
      graph.push(question);
      questions.push({ '@id': question['@id'] });
    });

    if (!questions.length) return null;
    if (ctx.path === '/patients/faqs') {
      page['@type'] = ['WebPage', 'FAQPage'];
      page.mainEntity = questions;
      return questions;
    }

    const faqPage = {
      '@type': 'FAQPage',
      '@id': ctx.pageUrl + '#faqs',
      url: ctx.pageUrl + '#faqs',
      name: ctx.headline + ' FAQs',
      isPartOf: { '@id': ctx.pageId },
      mainEntity: questions,
      inLanguage: ctx.language
    };
    graph.push(faqPage);
    page.hasPart = (page.hasPart || []).concat({ '@id': faqPage['@id'] });
    return questions;
  }

  function addProcess(graph, page, ctx, about) {
    const steps = [];
    document.querySelectorAll('.process_item').forEach(function (item, index) {
      const name = textFrom(item, '.process_title') || textFrom(item, 'h3, h4');
      const text = textFrom(item, '.process_desc-wrapper') || longestText(item, 'p');
      if (!name || !text) return;
      steps.push({ '@type': 'HowToStep', position: index + 1, name: name, text: text });
    });
    if (!steps.length) return null;

    const process = {
      '@type': 'HowTo',
      '@id': ctx.pageUrl + '#treatment-process',
      name: ctx.headline + ' treatment process',
      isPartOf: { '@id': ctx.pageId },
      about: about,
      step: steps
    };
    graph.push(process);
    page.hasPart = (page.hasPart || []).concat({ '@id': process['@id'] });
    return { '@id': process['@id'] };
  }

  function addReviews(graph, page, ctx) {
    const references = [];
    const seen = new Set();

    document.querySelectorAll('.testimonial_item').forEach(function (item, index) {
      const authorName = textFrom(item, '.testimonial_name');
      const body = textFrom(item, '.testimonial_content');
      const key = authorName + '|' + body;
      if (!authorName || !body || seen.has(key)) return;
      seen.add(key);

      const review = {
        '@type': 'Review',
        '@id': ctx.pageUrl + '#review-' + (index + 1),
        author: { '@type': 'Person', name: authorName },
        reviewBody: body,
        itemReviewed: { '@id': CLINIC_ID }
      };
      const date = parseDate(textFrom(item, '.testimonial_date'));
      if (date) review.datePublished = date;
      graph.push(review);
      references.push({ '@id': review['@id'] });
    });

    if (!references.length) return null;
    const list = addItemList(graph, ctx, 'patient-reviews', 'Patient reviews', references);
    addMention(page, list);
    return list;
  }

  function addPageSections(graph, page, ctx) {
    const references = [];
    const excluded = /faq|testimonial|process|blog-list|team|before-after|section_pol|treatments-list|conditions-more/i;

    document.querySelectorAll('main section').forEach(function (section, index) {
      if (excluded.test(section.className)) return;
      const heading = textFrom(section, 'h2, h3');
      const text = Array.from(section.querySelectorAll('p'))
        .map(clean).filter(Boolean).slice(0, 4).join(' ').slice(0, 1200);
      if (!heading || !text) return;

      const id = ctx.pageUrl + '#section-' + (index + 1);
      graph.push({
        '@type': 'WebPageElement',
        '@id': id,
        name: heading,
        text: text,
        isPartOf: { '@id': ctx.pageId }
      });
      references.push({ '@id': id });
    });

    if (references.length) page.hasPart = (page.hasPart || []).concat(references);
    return references;
  }

  function addRelatedTreatments(graph, page, ctx) {
    const references = [];
    const seen = new Set();
    document.querySelectorAll('.treatment-list_item').forEach(function (item) {
      const link = item.querySelector('.treatment-list_link[href], a[href]');
      const url = absoluteUrl(link?.getAttribute('href'), ctx.pageUrl);
      const name = textFrom(item, '.treatment-list_title-wrapper') || clean(link);
      if (!url || !name || url === ctx.pageUrl || seen.has(url)) return;
      seen.add(url);
      references.push({ '@id': url + '#service' });
    });
    const list = addItemList(graph, ctx, 'related-treatments', 'Related treatments', references);
    addMention(page, list);
    return list;
  }

  function addConditions(graph, page, ctx) {
    const references = [];
    const seen = new Set();
    document.querySelectorAll('.conditions_item').forEach(function (item) {
      const link = item.querySelector('.conditions_link[href], a[href]');
      const url = absoluteUrl(link?.getAttribute('href'), ctx.pageUrl);
      const name = clean(link);
      if (!url || !name || url === ctx.pageUrl || seen.has(url)) return;
      seen.add(url);

      const id = url + '#condition';
      graph.push({ '@type': 'MedicalCondition', '@id': id, name: name, url: url });
      references.push({ '@id': id });
    });
    const list = addItemList(graph, ctx, 'related-conditions', 'Related orthodontic conditions', references);
    addMention(page, list);
    return list;
  }

  function addTeam(graph, page, clinic, ctx) {
    const references = [];
    const seen = new Set();
    document.querySelectorAll('.staff_item').forEach(function (item) {
      const name = textFrom(item, 'h3');
      if (!name || seen.has(name)) return;
      seen.add(name);

      const id = SITE_URL + '#person-' + slug(name);
      const person = {
        '@type': 'Person',
        '@id': id,
        name: name,
        jobTitle: textFrom(item, '.staff_role') || undefined,
        description: longestText(item, '.text-rich-text, p') || undefined,
        worksFor: { '@id': CLINIC_ID },
        affiliation: { '@id': CLINIC_ID }
      };
      const qualifications = textFrom(item, '.staff_quals');
      const image = imageNode(item.querySelector('.staff_image[src]'), id + '-image', ctx.pageUrl, name);

      if (qualifications) person.hasCredential = {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: 'qualification',
        name: qualifications
      };
      if (image) {
        graph.push(image);
        person.image = { '@id': image['@id'] };
      }
      graph.push(person);
      references.push({ '@id': id });
    });

    if (!references.length) return null;
    clinic.employee = references;
    const list = addItemList(graph, ctx, 'team', 'Dundrum Orthodontics team', references);
    page.mainEntity = list;
    return list;
  }

  function addProfilePerson(graph, page, clinic, ctx) {
    const name = clean(document.querySelector('.section_team h3')) || clean(document.querySelector('main h3'));
    if (!name || !/^Dr\b/i.test(name)) return null;

    const container = Array.from(document.querySelectorAll('.staff_item, .staff_block, .section_team'))
      .find(function (element) { return clean(element.querySelector('h3')) === name; }) ||
      document.querySelector('.section_team');
    const id = SITE_URL + '#person-' + slug(name);
    const person = {
      '@type': 'Person',
      '@id': id,
      name: name,
      jobTitle: textFrom(container, '.staff_role') || 'Specialist Orthodontist',
      description: longestText(container, '.text-rich-text, p') || ctx.description,
      url: ctx.pageUrl,
      worksFor: { '@id': CLINIC_ID },
      affiliation: { '@id': CLINIC_ID },
      knowsAbout: unique(Array.from(container?.querySelectorAll('h6') || []).map(clean))
    };
    const image = imageNode(
      container?.querySelector('.staff_image[src], img[src]'),
      id + '-image',
      ctx.pageUrl,
      name
    );
    if (image) {
      graph.push(image);
      person.image = { '@id': image['@id'] };
    }
    graph.push(person);
    clinic.employee = [{ '@id': id }];
    page.about = { '@id': id };
    page.mainEntity = { '@id': id };
    return { '@id': id };
  }

  function addBlogList(graph, page, ctx) {
    const references = [];
    const seen = new Set();
    document.querySelectorAll('.blog_item').forEach(function (item) {
      const link = item.querySelector('.blog_link[href], a[href]');
      const url = absoluteUrl(link?.getAttribute('href'), ctx.pageUrl);
      const headline = textFrom(item, '.blog_title') || clean(link);
      if (!url || !headline || seen.has(url)) return;
      seen.add(url);

      const id = url + '#article';
      const article = {
        '@type': 'BlogPosting',
        '@id': id,
        url: url,
        headline: headline,
        description: textFrom(item, '.blog_intro') || undefined,
        publisher: { '@id': CLINIC_ID },
        isPartOf: { '@id': SITE_URL + 'blog#blog' },
        inLanguage: ctx.language
      };
      const date = parseDate(textFrom(item, '.blog_date'));
      const image = imageNode(item.querySelector('.blog_image[src], img[src]'), id + '-image', ctx.pageUrl, headline);
      if (date) article.datePublished = date;
      if (image) {
        graph.push(image);
        article.image = { '@id': image['@id'] };
      }
      graph.push(article);
      references.push({ '@id': id });
    });

    const list = addItemList(
      graph,
      ctx,
      'blog-posts',
      ctx.path === '/blog' ? 'Dundrum Orthodontics blog posts' : 'More blog posts',
      references,
      'https://schema.org/ItemListOrderDescending'
    );
    if (ctx.path !== '/blog') addMention(page, list);
    return list;
  }

  function addBlogArticle(graph, page, ctx) {
    const id = ctx.pageUrl + '#article';
    const authorName = textFrom(document, '.blog-post-header_author-text') || 'Dundrum Orthodontics';
    const authorId = /^Dundrum Orthodontics$/i.test(authorName)
      ? CLINIC_ID
      : SITE_URL + '#person-' + slug(authorName);
    const articleBody = longestText(
      document,
      '.section_blog-post-content .text-rich-text, .section_blog-post-content .w-richtext'
    );
    const article = {
      '@type': 'BlogPosting',
      '@id': id,
      url: ctx.pageUrl,
      headline: ctx.headline,
      description: ctx.description || undefined,
      articleBody: articleBody || undefined,
      author: { '@id': authorId },
      publisher: { '@id': CLINIC_ID },
      mainEntityOfPage: { '@id': ctx.pageId },
      isPartOf: { '@id': SITE_URL + 'blog#blog' },
      inLanguage: ctx.language
    };
    const date = parseDate(textFrom(document, '.blog-post-header_date-wrapper'));
    const image = imageNode(
      document.querySelector('.blog-post-header_image[src]') ||
        document.querySelector('meta[property="og:image"]')?.content,
      ctx.pageUrl + '#article-image',
      ctx.pageUrl,
      ctx.headline
    );
    if (date) {
      article.datePublished = date;
      article.dateModified = date;
    }
    if (image) {
      graph.push(image);
      article.image = { '@id': image['@id'] };
      page.primaryImageOfPage = { '@id': image['@id'] };
    }
    if (authorId !== CLINIC_ID) {
      graph.push({
        '@type': 'Person',
        '@id': authorId,
        name: authorName,
        jobTitle: /^Dr\b/i.test(authorName) ? 'Specialist Orthodontist' : undefined,
        worksFor: { '@id': CLINIC_ID },
        affiliation: { '@id': CLINIC_ID }
      });
    }
    graph.push(article);
    page.mainEntity = { '@id': id };
    page.about = 'Orthodontics';
    addBlogList(graph, page, ctx);
    return { '@id': id };
  }

  function addLocationServices(graph, page, ctx) {
    const references = [];
    document.querySelectorAll('.info-page_item').forEach(function (item, index) {
      const name = textFrom(item, '.info-page_text.is-title');
      const description = Array.from(item.querySelectorAll('.info-page_text'))
        .map(clean)
        .filter(function (text) { return text && text !== name && text !== '-'; })
        .join(' ');
      if (!name) return;

      const id = ctx.pageUrl + '#location-service-' + (index + 1) + '-' + slug(name);
      graph.push({
        '@type': 'Service',
        '@id': id,
        name: name,
        description: description || undefined,
        provider: { '@id': CLINIC_ID },
        availableChannel: {
          '@type': 'ServiceChannel',
          serviceLocation: { '@id': CLINIC_ID },
          serviceUrl: ctx.pageUrl,
          availableLanguage: ctx.language
        }
      });
      references.push({ '@id': id });
    });

    const list = addItemList(graph, ctx, 'location-services', ctx.headline, references);
    if (list) {
      page.mainEntity = list;
    }
    return list;
  }

  function addGallery(graph, page, ctx) {
    const references = [];
    const seen = new Set();
    document.querySelectorAll('.section_before-after img[src]').forEach(function (element, index) {
      const url = absoluteUrl(element.currentSrc || element.getAttribute('src'), ctx.pageUrl);
      if (!url || seen.has(url)) return;
      seen.add(url);

      const image = imageNode(
        element,
        ctx.pageUrl + '#gallery-image-' + (index + 1),
        ctx.pageUrl,
        'Orthodontic treatment before and after result'
      );
      if (!image) return;
      graph.push(image);
      references.push({ '@id': image['@id'] });
    });
    const list = addItemList(graph, ctx, 'gallery-images', 'Before and after gallery', references);
    if (list) {
      page.mainEntity = list;
    }
    return list;
  }

  function addContactActions(page) {
    page.potentialAction = [
      { '@type': 'ReserveAction', name: 'Book a consultation', target: absoluteUrl('/book-consultation', SITE_URL) },
      { '@type': 'CommunicateAction', name: 'Call Dundrum Orthodontics', target: 'tel:+35312963638' },
      { '@type': 'CommunicateAction', name: 'Email Dundrum Orthodontics', target: 'mailto:reception@dundrumorthodontics.ie' }
    ];
  }

  function generate() {
    if (document.documentElement.dataset.wfSite !== SITE_ID) return;

    const ctx = context();
    const graph = [];
    const clinic = addFoundation(graph, ctx);
    const treatmentCatalog = addTreatmentCatalog(graph, clinic, ctx);
    let page;
    let middle = [];

    if (ctx.path === '/blog') {
      page = basePage(['WebPage', 'CollectionPage', 'Blog'], ctx);
      page.about = 'Orthodontics';
      page.mainEntity = addBlogList(graph, page, ctx) || undefined;
    } else if (ctx.path.indexOf('/blog-post/') === 0 || ctx.collectionId === '6a04de4a6324d0e78450de63') {
      page = basePage('WebPage', ctx);
      addBlogArticle(graph, page, ctx);
      middle = [{ name: 'Blog', url: '/blog' }];
    } else if (ctx.path.indexOf('/treatment/') === 0 || ctx.collectionId === '6a04de4a6324d0e78450de19') {
      page = basePage(['WebPage', 'MedicalWebPage'], ctx);
      const serviceId = ctx.pageUrl + '#service';
      let service = graph.find(function (node) { return node['@id'] === serviceId; });
      if (!service) {
        service = {
          '@type': 'Service',
          '@id': serviceId,
          name: ctx.headline,
          serviceType: ctx.headline,
          url: ctx.pageUrl,
          provider: { '@id': CLINIC_ID }
        };
        graph.push(service);
      }
      service.description = ctx.description || undefined;
      service.audience = { '@type': 'MedicalAudience', audienceType: 'Patients' };
      page.about = { '@id': serviceId };
      page.mainEntity = { '@id': serviceId };
      addProcess(graph, page, ctx, { '@id': serviceId });
      addFaqs(graph, page, ctx);
      addRelatedTreatments(graph, page, ctx);
    } else if (ctx.path.indexOf('/condition/') === 0 || ctx.collectionId === '6a04de4a6324d0e78450de90') {
      page = basePage(['WebPage', 'MedicalWebPage'], ctx);
      const condition = {
        '@type': 'MedicalCondition',
        '@id': ctx.pageUrl + '#condition',
        name: ctx.headline,
        description: ctx.description || undefined,
        url: ctx.pageUrl,
        mainEntityOfPage: { '@id': ctx.pageId }
      };
      graph.push(condition);
      page.about = { '@id': condition['@id'] };
      page.mainEntity = { '@id': condition['@id'] };
      addFaqs(graph, page, ctx);
      addConditions(graph, page, ctx);
    } else if (ctx.path === '/locations-we-serve') {
      page = basePage(['WebPage', 'CollectionPage'], ctx);
      addLocationServices(graph, page, ctx);
    } else if (ctx.path === '/about/meet-the-team') {
      page = basePage(['WebPage', 'AboutPage', 'CollectionPage'], ctx);
      page.about = { '@id': CLINIC_ID };
      addTeam(graph, page, clinic, ctx);
    } else if (ctx.path === '/about/meet-the-orthodontist') {
      page = basePage(['WebPage', 'ProfilePage'], ctx);
      addProfilePerson(graph, page, clinic, ctx);
    } else if (ctx.path === '/patients/before-afters') {
      page = basePage(['WebPage', 'CollectionPage', 'ImageGallery'], ctx);
      addGallery(graph, page, ctx);
    } else if (ctx.path === '/contact-us' || ctx.path === '/book-consultation') {
      page = basePage('ContactPage', ctx);
      page.about = { '@id': CLINIC_ID };
      page.mainEntity = { '@id': CLINIC_ID };
      addContactActions(page);
    } else if (ctx.path.indexOf('/about/') === 0) {
      page = basePage('AboutPage', ctx);
      page.about = { '@id': CLINIC_ID };
      page.mainEntity = { '@id': CLINIC_ID };
    } else {
      page = basePage('WebPage', ctx);
      page.about = { '@id': CLINIC_ID };
      if (ctx.path === '/') {
        page.mainEntity = [{ '@id': CLINIC_ID }];
        if (treatmentCatalog) page.mainEntity.push(treatmentCatalog.reference);
      }
      addFaqs(graph, page, ctx);
    }

    addPrimaryImage(graph, page, ctx);
    addReviews(graph, page, ctx);
    addPageSections(graph, page, ctx);
    if (ctx.path === '/') addRelatedTreatments(graph, page, ctx);
    graph.push(page);
    breadcrumb(graph, ctx, middle);

    document.getElementById(SCHEMA_ID)?.remove();
    const script = document.createElement('script');
    script.id = SCHEMA_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generate, { once: true });
  } else {
    generate();
  }
})();
