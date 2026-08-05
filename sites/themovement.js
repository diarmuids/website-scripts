// Last updated: 2026-08-05 15:00:40

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

  function publicPrice() {
    const content = cleanText(document.querySelector('.page_content') && document.querySelector('.page_content').textContent);
    const match = content.match(/non-members?\s*:\s*€\s*(\d+(?:[.,]\d{1,2})?)/i);
    return match ? match[1].replace(',', '.') : '';
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

  function faqEntities() {
    return Array.from(document.querySelectorAll('.fll-timetable .faq-list-item'))
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

  function scheduledEvents(schedules, url, price) {
    return schedules.map(function (schedule, index) {
      const eventId = url + '#class-' + slug(schedule.name + '-' + schedule.day + '-' + schedule.startTime) + '-' + (index + 1);
      return {
        '@type': 'Event',
        '@id': eventId,
        name: schedule.name,
        description: schedule.name + ' recurring class at The Movement Fitness Club.',
        url: url,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventSchedule: {
          '@type': 'Schedule',
          repeatFrequency: 'P1W',
          byDay: schemaDay(schedule.day),
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          scheduleTimezone: 'Europe/Dublin',
        },
        location: schedule.room
          ? { '@type': 'Place', name: schedule.room, containedInPlace: { '@id': BUSINESS_ID } }
          : { '@id': BUSINESS_ID },
        organizer: { '@id': BUSINESS_ID },
        offers: price
          ? { '@type': 'Offer', price: price, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url: url }
          : undefined,
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
    const price = publicPrice();
    const serviceId = url + '#service';

    const classEvents = scheduledEvents(schedules, url, price);
    const business = businessSchema(image);

    const service = {
      '@type': 'Service',
      '@id': serviceId,
      name: name,
      description: description || undefined,
      url: url,
      image: image || undefined,
      provider: { '@id': BUSINESS_ID },
      subjectOf: classEvents.map(function (event) {
        return { '@id': event['@id'] };
      }),
      areaServed: locality
        ? { '@type': 'Place', name: locality }
        : undefined,
      offers: price
        ? {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'EUR',
            description: 'Non-member price per class. Booking essential.',
            availability: 'https://schema.org/InStock',
            url: url,
          }
        : undefined,
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
      '@graph': [webPage, business, service, breadcrumb].concat(classEvents),
    };
  }

  function buildTimetableSchema() {
    const url = pageUrl();
    const name = cleanText(document.querySelector('h1') && document.querySelector('h1').textContent) || 'Class Timetable';
    const description = getMeta('meta[name="description"]');
    const image = primaryImage();
    const price = timetablePrice();
    const events = scheduledEvents(timetableSchedule(), url, price);
    const timetableId = url + '#timetable';
    const faqId = url + '#faq';
    const questions = faqEntities();

    const timetable = {
      '@type': 'ItemList',
      '@id': timetableId,
      name: 'The Movement Fitness Club weekly class timetable',
      description: description || undefined,
      numberOfItems: events.length,
      itemListElement: events.map(function (event, index) {
        return { '@type': 'ListItem', position: index + 1, item: { '@id': event['@id'] } };
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

    const graph = [webPage, businessSchema(image), timetable, breadcrumb].concat(events);
    if (questions.length) graph.push({ '@type': 'FAQPage', '@id': faqId, mainEntity: questions });
    return { '@context': 'https://schema.org', '@graph': graph };
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

  function addPageSchema() {
    addInfoPageSchema();
    addTimetableSchema();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addPageSchema, { once: true });
  } else {
    addPageSchema();
  }
})();
