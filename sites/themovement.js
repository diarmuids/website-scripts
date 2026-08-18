// Last updated: 2026-08-18 17:23:02

(function () {
  'use strict';

  const INFO_COLLECTION_ID = '6a72196fc934ca57e2d34082';
  const SCHEMA_SCRIPT_ID = 'the-movement-schema';
  const BUSINESS_ID = 'https://www.themovement.ie/#fitness-club';

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getMeta(selector) {
    const element = document.querySelector(selector);
    return element ? cleanText(element.getAttribute('content')) : '';
  }

  function absoluteUrl(value) {
    if (!value) return '';

    try {
      return new URL(value, window.location.href).href;
    } catch (error) {
      return '';
    }
  }

  function pageUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    return absoluteUrl(canonical && canonical.getAttribute('href')) || window.location.href.split('#')[0];
  }

  function pageName() {
    const heading = document.querySelector('.page_h1');
    return cleanText(heading ? heading.textContent : document.title.replace(/\s*\|.*$/, ''));
  }

  function areaServed() {
    const location = document.querySelector('.page_h1-location');
    return cleanText(location && location.textContent).replace(/^near\s+/i, '');
  }

  function primaryImage() {
    const metaImage = getMeta('meta[property="og:image"]');
    const pageImage = document.querySelector('.page_img[src]');
    return absoluteUrl(metaImage || (pageImage && pageImage.getAttribute('src')));
  }

  function classSchedule() {
    return Array.from(document.querySelectorAll('.class-time-list_item'))
      .map(function (item) {
        const details = item.querySelectorAll('.class-time-list_detail');
        const name = cleanText(details[0] && details[0].textContent);
        const day = cleanText(details[1] && details[1].textContent);
        const time = cleanText(details[2] && details[2].textContent);

        if (!name || !day || !time) return null;

        const timeParts = time.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
        if (!timeParts) return null;

        return {
          name: name,
          day: day,
          startTime: timeParts[1],
          endTime: timeParts[2],
        };
      })
      .filter(Boolean);
  }

  function schemaDay(day) {
    const days = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    const value = days[cleanText(day).toLowerCase()];
    return value ? 'https://schema.org/' + value : '';
  }

  function slug(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function serviceDescription() {
    const metaDescription = getMeta('meta[name="description"]');
    if (metaDescription) return metaDescription;

    const firstParagraph = document.querySelector('.page_content .w-richtext p');
    return cleanText(firstParagraph && firstParagraph.textContent);
  }

  function seoBlock(heading) {
    return Array.from(document.querySelectorAll('.seo_block')).find(function (item) {
      const title = item.querySelector('.seo_heading');
      return cleanText(title && title.textContent).toLowerCase() === heading.toLowerCase();
    });
  }

  function seoBlockText(heading) {
    const block = seoBlock(heading);
    return cleanText(block && block.textContent);
  }

  function publicOffers(url, details) {
    const costs = seoBlock('Costs');
    if (!costs) return [];

    const offers = Array.from(costs.querySelectorAll('li'))
      .map(function (item) {
        const text = cleanText(item.textContent);
        const match = text.match(/^(.+?)\s*:\s*€\s*(\d+(?:[.,]\d{1,2})?)/i);
        if (!match) return null;

        const label = cleanText(match[1]);
        const price = match[2].replace(',', '.');
        const isNonMember = /^non-members?$/i.test(label);
        return {
          '@type': 'Offer',
          name: isNonMember ? 'Non-member class admission' : label,
          price: price,
          priceCurrency: 'EUR',
          description: label + ' costs €' + price + '.' + (details.bookingEssential ? ' Booking essential.' : ''),
          category: isNonMember ? 'Non-member' : label,
          availability: 'https://schema.org/InStock',
          url: url,
        };
      })
      .filter(Boolean);

    if (details.membersFree) {
      offers.push({
        '@type': 'Offer',
        name: 'Member class admission',
        price: '0',
        priceCurrency: 'EUR',
        description: 'Classes are free for members.' + (details.bookingEssential ? ' Booking essential.' : ''),
        category: 'Member',
        availability: 'https://schema.org/InStock',
        url: url,
      });
    }

    return offers;
  }

  function bookingDetails() {
    const costs = seoBlockText('Costs');
    const booking = seoBlockText('Booking');

    return {
      membersFree: /free\s+for\s+members/i.test(costs),
      bookingEssential: /booking\s+essential/i.test(costs),
      membersUseApp: /members?\s*:\s*book\s+through\s+the\s+club\s+app/i.test(booking),
      nonMembersUseSocial: /non-members?\s*:\s*book\s+by\s+social\s+dm/i.test(booking),
      nonMembersUseEmail: /non-members?[\s\S]*email/i.test(booking),
      nonMembersUsePhone: /non-members?[\s\S]*(?:call|phone)/i.test(booking),
    };
  }

  function bookingChannels(details) {
    const channels = [];

    if (details.membersUseApp) {
      channels.push({
        '@type': 'ServiceChannel',
        name: 'Member booking',
        description: 'Members book through the club app.',
      });
    }

    if (details.nonMembersUseSocial || details.nonMembersUseEmail || details.nonMembersUsePhone) {
      channels.push({
        '@type': 'ServiceChannel',
        name: 'Non-member booking',
        description: 'Non-members book by social direct message, email, or phone.',
        servicePhone: details.nonMembersUsePhone
          ? { '@type': 'ContactPoint', telephone: '+3532643492', contactType: 'class bookings' }
          : undefined,
        serviceUrl: details.nonMembersUseEmail ? 'mailto:info@themovement.ie' : undefined,
      });
    }

    return channels;
  }

  function timetablePrice() {
    const content = cleanText(document.querySelector('.timetable_rich-text') && document.querySelector('.timetable_rich-text').textContent);
    const match = content.match(/(?:€|EUR)\s*(\d+(?:[.,]\d{1,2})?)\s+for\s+non-members/i);
    return match ? match[1].replace(',', '.') : '';
  }

  function timetableSchedule() {
    const row = document.querySelector('.time_wrapper .time_row:not(.tr-note)');
    if (!row) return [];

    const columns = Array.from(row.querySelectorAll(':scope > .time_col'));
    const timeColumn = columns.find(function (column) {
      return column.classList.contains('is-time');
    });
    if (!timeColumn) return [];

    const times = Array.from(timeColumn.querySelectorAll(':scope > .time_cell:not(.is-header)')).map(function (cell) {
      const match = cleanText(cell.textContent).match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
      return match ? { startTime: match[1], endTime: match[2] } : null;
    });

    const classes = [];
    columns.forEach(function (column) {
      if (column === timeColumn) return;

      const cells = Array.from(column.querySelectorAll(':scope > .time_cell'));
      const day = cleanText(cells.shift() && column.querySelector('.time_cell.is-header').textContent);
      if (!schemaDay(day)) return;

      cells.forEach(function (cell, index) {
        const copy = cell.cloneNode(true);
        copy.querySelectorAll('.time_detail').forEach(function (detail) {
          detail.remove();
        });
        const name = cleanText(copy.textContent);
        const time = times[index];
        if (!name || !time) return;

        classes.push({
          name: name,
          day: day,
          startTime: time.startTime,
          endTime: time.endTime,
          room: cell.classList.contains('is-white') ? 'Spin Studio' : 'Studio',
        });
      });
    });

    return classes;
  }

  function faqEntities(selector) {
    return Array.from(document.querySelectorAll(selector || '.fll-timetable .faq-list-item'))
      .map(function (item) {
        const question = cleanText(item.querySelector('.faq-question-text') && item.querySelector('.faq-question-text').textContent);
        const answer = cleanText(item.querySelector('.faq-answer') && item.querySelector('.faq-answer').textContent);
        if (!question || !answer) return null;
        return {
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer },
        };
      })
      .filter(Boolean);
  }

  function businessSchema(image) {
    return {
      '@type': 'ExerciseGym',
      '@id': BUSINESS_ID,
      name: 'The Movement Fitness Club',
      url: 'https://www.themovement.ie/',
      telephone: '+3532643492',
      email: 'info@themovement.ie',
      image: image || undefined,
      priceRange: '€12',
      sameAs: [
        'https://www.instagram.com/themovementmacroom/',
        'https://www.facebook.com/The-Movement-Macroom-1693712704182384/',
        'https://www.youtube.com/channel/UC1D6E0uLl9TTkfopAFl4Gew',
        'https://twitter.com/themovementmac',
      ],
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Hollands Lane, Off Main Street',
        addressLocality: 'Macroom',
        addressRegion: 'County Cork',
        addressCountry: 'IE',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 51.905281,
        longitude: -8.958505,
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '06:00', closes: '22:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '08:00', closes: '18:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '08:00', closes: '16:00' },
      ],
    };
  }

  function recurringSchedules(schedules, url) {
    return schedules.map(function (schedule, index) {
      const scheduleId = url + '#schedule-' + slug(schedule.name + '-' + schedule.day + '-' + schedule.startTime) + '-' + (index + 1);
      return {
        '@type': 'Schedule',
        '@id': scheduleId,
        name: schedule.name,
        description: schedule.name + ' weekly class schedule at The Movement Fitness Club.',
        url: url,
        repeatFrequency: 'P1W',
        byDay: schemaDay(schedule.day),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        scheduleTimezone: 'Europe/Dublin',
      };
    });
  }

  function buildSchema() {
    const url = pageUrl();
    const name = pageName();
    const description = serviceDescription();
    const image = primaryImage();
    const locality = areaServed();
    const schedules = classSchedule();
    const booking = bookingDetails();
    const offers = publicOffers(url, booking);
    const serviceId = url + '#service';

    const recurringClassSchedules = recurringSchedules(schedules, url);
    const business = businessSchema(image);
    const scheduleListId = url + '#class-schedules';
    const scheduleList = {
      '@type': 'ItemList',
      '@id': scheduleListId,
      name: name + ' weekly class schedule',
      numberOfItems: recurringClassSchedules.length,
      itemListElement: recurringClassSchedules.map(function (schedule, index) {
        return { '@type': 'ListItem', position: index + 1, item: { '@id': schedule['@id'] } };
      }),
    };

    const service = {
      '@type': 'Service',
      '@id': serviceId,
      name: name,
      description: description || undefined,
      url: url,
      image: image || undefined,
      provider: { '@id': BUSINESS_ID },
      subjectOf: recurringClassSchedules.length ? { '@id': scheduleListId } : undefined,
      areaServed: locality
        ? { '@type': 'Place', name: locality }
        : undefined,
      offers: offers,
      availableChannel: bookingChannels(booking),
    };

    const webPage = {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      description: description || undefined,
      primaryImageOfPage: image ? { '@type': 'ImageObject', url: image } : undefined,
      mainEntity: { '@id': serviceId },
      isPartOf: { '@type': 'WebSite', '@id': 'https://www.themovement.ie/#website', url: 'https://www.themovement.ie/', name: 'The Movement Fitness Club' },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': url + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.themovement.ie/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [webPage, business, service, breadcrumb, scheduleList].concat(recurringClassSchedules),
    };
  }

  function buildTimetableSchema() {
    const url = pageUrl();
    const name = cleanText(document.querySelector('h1') && document.querySelector('h1').textContent) || 'Class Timetable';
    const description = getMeta('meta[name="description"]');
    const image = primaryImage();
    const price = timetablePrice();
    const schedules = recurringSchedules(timetableSchedule(), url);
    const timetableId = url + '#timetable';
    const faqId = url + '#faq';
    const questions = faqEntities('.fll-timetable .faq-list-item');

    const timetable = {
      '@type': 'ItemList',
      '@id': timetableId,
      name: 'The Movement Fitness Club weekly class timetable',
      description: description || undefined,
      numberOfItems: schedules.length,
      itemListElement: schedules.map(function (schedule, index) {
        return { '@type': 'ListItem', position: index + 1, item: { '@id': schedule['@id'] } };
      }),
    };

    const webPage = {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      description: description || undefined,
      mainEntity: { '@id': timetableId },
      about: { '@id': BUSINESS_ID },
      isPartOf: { '@type': 'WebSite', '@id': 'https://www.themovement.ie/#website', url: 'https://www.themovement.ie/', name: 'The Movement Fitness Club' },
      hasPart: questions.length ? { '@id': faqId } : undefined,
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': url + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.themovement.ie/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };

    const graph = [webPage, businessSchema(image), timetable, breadcrumb].concat(schedules);
    if (questions.length) graph.push({ '@type': 'FAQPage', '@id': faqId, mainEntity: questions });
    return { '@context': 'https://schema.org', '@graph': graph };
  }

  function classServices(url, price) {
    return Array.from(document.querySelectorAll('.classes_list .classes_item'))
      .map(function (item, index) {
        const title = cleanText(item.querySelector('.classes_title > div:first-child') && item.querySelector('.classes_title > div:first-child').textContent);
        const description = cleanText(item.querySelector('.classes_description') && item.querySelector('.classes_description').textContent);
        const background = item.querySelector('.classes_bg');
        const style = background && background.getAttribute('style');
        const imageMatch = style && style.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i);
        const image = absoluteUrl(imageMatch && imageMatch[1]);
        if (!title) return null;

        return {
          '@type': 'Service',
          '@id': url + '#class-' + slug(title) + '-' + (index + 1),
          name: title,
          serviceType: 'Fitness class',
          description: description || undefined,
          image: image || undefined,
          provider: { '@id': BUSINESS_ID },
          areaServed: { '@type': 'City', name: 'Macroom' },
          offers: price
            ? {
                '@type': 'Offer',
                price: price,
                priceCurrency: 'EUR',
                description: 'Non-member price per class. Classes are free for members.',
                availability: 'https://schema.org/InStock',
                url: 'https://www.themovement.ie/timetable',
              }
            : undefined,
        };
      })
      .filter(Boolean);
  }

  function buildClassesSchema() {
    const url = pageUrl();
    const name = cleanText(document.querySelector('h1') && document.querySelector('h1').textContent) || 'Classes';
    const description = getMeta('meta[name="description"]');
    const image = primaryImage();
    const price = timetablePrice() || '12';
    const services = classServices(url, price);
    const catalogId = url + '#class-list';
    const faqId = url + '#faq';
    const questions = faqEntities('.content-section .faq-list-item');

    const catalog = {
      '@type': 'ItemList',
      '@id': catalogId,
      name: 'Fitness classes at The Movement Fitness Club',
      description: description || undefined,
      numberOfItems: services.length,
      itemListElement: services.map(function (service, index) {
        return { '@type': 'ListItem', position: index + 1, item: { '@id': service['@id'] } };
      }),
    };

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      description: description || undefined,
      mainEntity: { '@id': catalogId },
      about: { '@id': BUSINESS_ID },
      isPartOf: { '@type': 'WebSite', '@id': 'https://www.themovement.ie/#website', url: 'https://www.themovement.ie/', name: 'The Movement Fitness Club' },
      hasPart: questions.length ? { '@id': faqId } : undefined,
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': url + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.themovement.ie/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };

    const graph = [collectionPage, businessSchema(image), catalog, breadcrumb].concat(services);
    if (questions.length) graph.push({ '@type': 'FAQPage', '@id': faqId, mainEntity: questions });
    return { '@context': 'https://schema.org', '@graph': graph };
  }

  function packageOffers(url, serviceId) {
    const wrapper = document.querySelector('.time_wrapper.th-pt');
    if (!wrapper) return [];

    const quantityCells = wrapper.querySelectorAll('.tc-packages-row-header .time_cell.is-row-header');
    const quantities = Array.from(quantityCells).map(function (cell) {
      const match = cleanText(cell.textContent).match(/\d+/);
      return match ? Number(match[0]) : null;
    });

    const offers = [];
    wrapper.querySelectorAll('.time_row.is-new > .time_col.tc-pt').forEach(function (column) {
      const cells = Array.from(column.querySelectorAll(':scope > .time_cell'));
      const heading = cleanText(cells.shift() && column.querySelector('.time_cell.is-header').textContent);
      const durationMatch = heading.match(/(30|45)\s*minute/i);
      const duration = durationMatch ? Number(durationMatch[1]) : null;
      const audience = /non-member/i.test(heading) ? 'Non-member' : 'Member';

      cells.forEach(function (cell, index) {
        const priceMatch = cleanText(cell.textContent).match(/(\d+(?:[.,]\d{1,2})?)/);
        const quantity = quantities[index];
        if (!priceMatch || !quantity || !duration) return;

        const price = priceMatch[1].replace(',', '.');
        const offerName = quantity + ' × ' + duration + '-minute personal training sessions — ' + audience;
        offers.push({
          '@type': 'Offer',
          '@id': url + '#offer-' + quantity + '-' + duration + '-' + slug(audience),
          name: offerName,
          description: offerName + ' package at The Movement Fitness Club.',
          price: price,
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: url,
          category: audience,
          eligibleQuantity: { '@type': 'QuantitativeValue', value: quantity, unitText: 'personal training sessions' },
          itemOffered: { '@id': serviceId },
        });
      });
    });

    return offers;
  }

  function buildPackagesSchema() {
    const url = pageUrl();
    const name = cleanText(document.querySelector('h1') && document.querySelector('h1').textContent) || 'Personal Training Packages';
    const description = getMeta('meta[name="description"]');
    const image = primaryImage();
    const serviceId = url + '#personal-training';
    const catalogId = url + '#packages';
    const offers = packageOffers(url, serviceId);
    const pdfLink = document.querySelector('.bh-download-pdf a[href]');
    const pdfUrl = absoluteUrl(pdfLink && pdfLink.getAttribute('href'));

    const service = {
      '@type': 'Service',
      '@id': serviceId,
      name: 'Personal Training at The Movement Fitness Club',
      serviceType: 'Personal training',
      description: description || 'Personal training packages for members and non-members.',
      provider: { '@id': BUSINESS_ID },
      areaServed: { '@type': 'City', name: 'Macroom' },
      hasOfferCatalog: { '@id': catalogId },
    };

    const catalog = {
      '@type': 'OfferCatalog',
      '@id': catalogId,
      name: 'Personal Training Packages',
      numberOfItems: offers.length,
      itemListElement: offers.map(function (offer, index) {
        return { '@type': 'ListItem', position: index + 1, item: { '@id': offer['@id'] } };
      }),
    };

    const webPage = {
      '@type': 'WebPage',
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      description: description || undefined,
      mainEntity: { '@id': serviceId },
      about: { '@id': BUSINESS_ID },
      isPartOf: { '@type': 'WebSite', '@id': 'https://www.themovement.ie/#website', url: 'https://www.themovement.ie/', name: 'The Movement Fitness Club' },
      associatedMedia: pdfUrl ? { '@id': url + '#price-list-pdf' } : undefined,
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': url + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.themovement.ie/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };

    const graph = [webPage, businessSchema(image), service, catalog, breadcrumb].concat(offers);
    if (pdfUrl) {
      graph.push({
        '@type': 'MediaObject',
        '@id': url + '#price-list-pdf',
        name: 'Personal Training Packages price list',
        contentUrl: pdfUrl,
        encodingFormat: 'application/pdf',
      });
    }
    return { '@context': 'https://schema.org', '@graph': graph };
  }

  function buildFaqSchema() {
    const url = pageUrl();
    const name = cleanText(document.querySelector('h1') && document.querySelector('h1').textContent) || 'Frequently Asked Questions';
    const description = getMeta('meta[name="description"]');
    const image = primaryImage();
    const questions = faqEntities('.faq-row .faq-list-item');
    const breadcrumbId = url + '#breadcrumb';

    const faqPage = {
      '@type': 'FAQPage',
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      headline: name,
      description: description || undefined,
      mainEntity: questions,
      about: { '@id': BUSINESS_ID },
      breadcrumb: { '@id': breadcrumbId },
      isPartOf: { '@type': 'WebSite', '@id': 'https://www.themovement.ie/#website', url: 'https://www.themovement.ie/', name: 'The Movement Fitness Club' },
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.themovement.ie/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };

    return {
      '@context': 'https://schema.org',
      '@graph': [faqPage, businessSchema(image), breadcrumb],
    };
  }

  function classLocationPages() {
    return Array.from(document.querySelectorAll('.pages-list_list .pages-list_item a[href]'))
      .map(function (link, index) {
        const name = cleanText(link.textContent);
        const url = absoluteUrl(link.getAttribute('href'));
        if (!name || !url) return null;
        return {
          '@type': 'WebPage',
          '@id': url + '#webpage',
          url: url,
          name: name,
          position: index + 1,
          isPartOf: { '@id': 'https://www.themovement.ie/#website' },
          about: { '@id': BUSINESS_ID },
        };
      })
      .filter(Boolean);
  }

  function buildClassLocationsSchema() {
    const url = pageUrl();
    const name = cleanText(document.querySelector('h1') && document.querySelector('h1').textContent) || 'Class Locations';
    const description = getMeta('meta[name="description"]');
    const image = primaryImage();
    const pages = classLocationPages();
    const listId = url + '#service-area-pages';
    const breadcrumbId = url + '#breadcrumb';

    const collectionPage = {
      '@type': 'CollectionPage',
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      headline: name,
      description: description || undefined,
      mainEntity: { '@id': listId },
      about: { '@id': BUSINESS_ID },
      breadcrumb: { '@id': breadcrumbId },
      isPartOf: { '@type': 'WebSite', '@id': 'https://www.themovement.ie/#website', url: 'https://www.themovement.ie/', name: 'The Movement Fitness Club' },
    };

    const pageList = {
      '@type': 'ItemList',
      '@id': listId,
      name: 'Class and training pages by nearby area',
      numberOfItems: pages.length,
      itemListElement: pages.map(function (page) {
        return { '@type': 'ListItem', position: page.position, item: { '@id': page['@id'] } };
      }),
    };

    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': breadcrumbId,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.themovement.ie/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };

    pages.forEach(function (page) {
      delete page.position;
    });

    return {
      '@context': 'https://schema.org',
      '@graph': [collectionPage, businessSchema(image), pageList, breadcrumb].concat(pages),
    };
  }

  function addInfoPageSchema() {
    const root = document.documentElement;
    if (!root || root.getAttribute('data-wf-collection') !== INFO_COLLECTION_ID) return;
    if (!document.querySelector('.page_h1')) return;

    const previous = document.getElementById(SCHEMA_SCRIPT_ID);
    if (previous) previous.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(buildSchema());
    document.head.appendChild(script);
  }

  function addTimetableSchema() {
    if (window.location.pathname.replace(/\/+$/, '') !== '/timetable') return;
    if (!document.querySelector('.time_wrapper')) return;

    const previous = document.getElementById(SCHEMA_SCRIPT_ID);
    if (previous) previous.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(buildTimetableSchema());
    document.head.appendChild(script);
  }

  function addClassesSchema() {
    if (window.location.pathname.replace(/\/+$/, '') !== '/classes') return;
    if (!document.querySelector('.classes_list .classes_item')) return;

    const previous = document.getElementById(SCHEMA_SCRIPT_ID);
    if (previous) previous.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(buildClassesSchema());
    document.head.appendChild(script);
  }

  function addPackagesSchema() {
    if (window.location.pathname.replace(/\/+$/, '') !== '/packages') return;
    if (!document.querySelector('.time_wrapper.th-pt')) return;

    const previous = document.getElementById(SCHEMA_SCRIPT_ID);
    if (previous) previous.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(buildPackagesSchema());
    document.head.appendChild(script);
  }

  function addFaqSchema() {
    if (window.location.pathname.replace(/\/+$/, '') !== '/faq') return;
    if (!document.querySelector('.faq-row .faq-list-item')) return;

    const previous = document.getElementById(SCHEMA_SCRIPT_ID);
    if (previous) previous.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(buildFaqSchema());
    document.head.appendChild(script);
  }

  function addClassLocationsSchema() {
    if (window.location.pathname.replace(/\/+$/, '') !== '/class-locations') return;
    if (!document.querySelector('.pages-list_list .pages-list_item a[href]')) return;

    const previous = document.getElementById(SCHEMA_SCRIPT_ID);
    if (previous) previous.remove();

    const script = document.createElement('script');
    script.id = SCHEMA_SCRIPT_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(buildClassLocationsSchema());
    document.head.appendChild(script);
  }

  function addPageSchema() {
    addInfoPageSchema();
    addTimetableSchema();
    addClassesSchema();
    addPackagesSchema();
    addFaqSchema();
    addClassLocationsSchema();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPageSchema, { once: true });
  } else {
    addPageSchema();
  }
})();
