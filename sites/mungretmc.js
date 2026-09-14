// Last updated: 2026-09-14 19:55:13

(function () {
  'use strict';

  const SCHEMA_ID = 'mungret-medical-centre-schema';
  const SITE_URL = 'https://www.mungretmedicalcentre.ie';
  const ORGANIZATION_ID = SITE_URL + '/#medical-centre';
  const WEBSITE_ID = SITE_URL + '/#website';
  const LOGO_URL = 'https://cdn.prod.website-files.com/61f90bb02448edd5799cff74/68de5a98227915f8d021a1cc_mungre-medical-centre_logo.jpg';
  const DEFAULT_IMAGE_URL = 'https://cdn.prod.website-files.com/61f90bb02448edd5799cff74/6206a01d6c3a5a4245ac5528_OG%20Image.webp';

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function absoluteUrl(value) {
    if (!value) return '';
    try {
      return new URL(value, window.location.href).href;
    } catch (error) {
      return '';
    }
  }

  function metaContent(selector) {
    const element = document.querySelector(selector);
    return element ? cleanText(element.getAttribute('content')) : '';
  }

  function canonicalUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const url = absoluteUrl(canonical && canonical.getAttribute('href')) || window.location.href;
    return url.split('#')[0].split('?')[0].replace(/\/$/, '') || SITE_URL;
  }

  function pathname() {
    const path = window.location.pathname.replace(/\/+$/, '');
    return path || '/';
  }

  function pageName() {
    const heading = document.querySelector('main h1, h1');
    return cleanText(heading ? heading.textContent : document.title.replace(/\s*\|.*$/, ''));
  }

  function pageDescription() {
    const description = metaContent('meta[name="description"]');
    if (description) return description;
    const paragraph = document.querySelector('main p, .w-richtext p');
    return cleanText(paragraph && paragraph.textContent);
  }

  function primaryImage() {
    const image = document.querySelector('main img[src], .main-wrapper img[src]');
    return absoluteUrl(metaContent('meta[property="og:image"]')) ||
      absoluteUrl(image && image.getAttribute('src')) || DEFAULT_IMAGE_URL;
  }

  function clinic() {
    return {
      '@type': ['MedicalClinic', 'MedicalOrganization'],
      '@id': ORGANIZATION_ID,
      name: 'Mungret Medical Centre',
      alternateName: ['Mungret Medical', 'Mungret GP'],
      url: SITE_URL + '/',
      logo: { '@type': 'ImageObject', url: LOGO_URL },
      image: DEFAULT_IMAGE_URL,
      description: 'Mungret Medical Centre is a GP clinic in Mungret Village, Limerick, providing general practice, chronic disease management, travel medicine and occupational health services.',
      foundingDate: '2020',
      telephone: '+353-61-540-990',
      email: 'info@mungretmedicalcentre.ie',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Mungret Medical Centre, Mungret Village',
        addressLocality: 'Limerick',
        postalCode: 'V94 X004',
        addressCountry: 'IE',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 52.6358056, longitude: -8.6928333 },
      hasMap: 'https://www.google.com/maps/dir//52.6358056,-8.6928333',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+353-61-540-990',
        email: 'info@mungretmedicalcentre.ie',
        contactType: 'patient enquiries',
        availableLanguage: 'English',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '12:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '14:00',
          closes: '17:00',
        },
      ],
      medicalSpecialty: ['GeneralPractice', 'OccupationalMedicine'],
      founder: [
        {
          '@type': 'Person',
          name: 'Dr Brian McEllistrem',
          jobTitle: 'General Practitioner',
          url: SITE_URL + '/team-member/dr-brian-mcellistrem',
        },
        {
          '@type': 'Person',
          name: 'Dr Muireann Clifford',
          jobTitle: 'General Practitioner',
          url: SITE_URL + '/team-member/dr-muireann-clifford',
        },
      ],
      sameAs: [
        'https://www.facebook.com/people/Mungret-Medical-Centre/100083237376942/',
        'https://www.instagram.com/mungretmedicalcentre/',
        'https://www.linkedin.com/company/mungret-medical-centre/',
      ],
    };
  }

  function website() {
    return {
      '@type': 'WebSite',
      '@id': WEBSITE_ID,
      url: SITE_URL + '/',
      name: 'Mungret Medical Centre',
      publisher: { '@id': ORGANIZATION_ID },
      inLanguage: 'en-IE',
    };
  }

  function breadcrumb(url, name) {
    if (pathname() === '/') return null;
    return {
      '@type': 'BreadcrumbList',
      '@id': url + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
        { '@type': 'ListItem', position: 2, name: name, item: url },
      ],
    };
  }

  function pageType(path) {
    if (path === '/contact') return 'ContactPage';
    if (path === '/about') return 'AboutPage';
    if (path.startsWith('/team-member/')) return 'ProfilePage';
    if (path.startsWith('/service/')) return 'MedicalWebPage';
    if (/^\/news(?:-|\/)/.test(path) || path === '/practice-expansion') return 'NewsArticle';
    if (['/gp-services', '/occupational-health', '/occupational-health-online-forms'].includes(path)) return 'CollectionPage';
    return 'WebPage';
  }

  function pageEntity(url, name, description, image) {
    const type = pageType(pathname());
    const page = {
      '@type': type,
      '@id': url + '#webpage',
      url: url,
      name: cleanText(document.title) || name,
      headline: name,
      description: description,
      isPartOf: { '@id': WEBSITE_ID },
      about: { '@id': ORGANIZATION_ID },
      publisher: { '@id': ORGANIZATION_ID },
      primaryImageOfPage: { '@type': 'ImageObject', url: image },
      inLanguage: 'en-IE',
    };
    const crumbs = breadcrumb(url, name);
    if (crumbs) page.breadcrumb = { '@id': crumbs['@id'] };
    if (type === 'NewsArticle') page.mainEntityOfPage = { '@id': url + '#webpage' };
    return page;
  }

  function serviceEntity(url, name, description, image) {
    if (!pathname().startsWith('/service/')) return null;
    return {
      '@type': 'Service',
      '@id': url + '#service',
      name: name,
      description: description,
      url: url,
      image: image,
      provider: { '@id': ORGANIZATION_ID },
      serviceType: name,
      areaServed: { '@type': 'AdministrativeArea', name: 'Limerick' },
    };
  }

  function clinicianEntity(url, name, description, image) {
    if (!pathname().startsWith('/team-member/')) return null;
    return {
      '@type': ['Person', 'IndividualPhysician'],
      '@id': url + '#person',
      name: name,
      description: description,
      url: url,
      image: image,
      jobTitle: 'General Practitioner',
      worksFor: { '@id': ORGANIZATION_ID },
      medicalSpecialty: 'GeneralPractice',
    };
  }

  function linkedItems(url) {
    const path = pathname();
    if (!['/gp-services', '/occupational-health', '/occupational-health-online-forms'].includes(path)) return null;
    const links = Array.from(document.querySelectorAll('main a[href], .main-wrapper a[href]'))
      .map(function (link) {
        return { name: cleanText(link.textContent), url: absoluteUrl(link.getAttribute('href')) };
      })
      .filter(function (item) {
        return item.name && item.url.startsWith(SITE_URL + '/') && item.url !== url;
      })
      .filter(function (item, index, items) {
        return items.findIndex(function (candidate) { return candidate.url === item.url; }) === index;
      })
      .slice(0, 100);
    if (!links.length) return null;
    return {
      '@type': 'ItemList',
      '@id': url + '#item-list',
      numberOfItems: links.length,
      itemListElement: links.map(function (item, index) {
        return { '@type': 'ListItem', position: index + 1, name: item.name, url: item.url };
      }),
    };
  }

  function injectSchema() {
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (script) { script.remove(); });
    const url = canonicalUrl();
    const name = pageName() || 'Mungret Medical Centre';
    const clinicEntity = clinic();
    const description = pageDescription() || clinicEntity.description;
    const image = primaryImage();
    const page = pageEntity(url, name, description, image);
    const graph = [clinicEntity, website(), page];
    const crumbs = breadcrumb(url, name);
    const service = serviceEntity(url, name, description, image);
    const clinician = clinicianEntity(url, name, description, image);
    const items = linkedItems(url);
    if (crumbs) graph.push(crumbs);
    if (service) { graph.push(service); page.mainEntity = { '@id': service['@id'] }; }
    if (clinician) { graph.push(clinician); page.mainEntity = { '@id': clinician['@id'] }; }
    if (items) { graph.push(items); page.mainEntity = { '@id': items['@id'] }; }
    const script = document.createElement('script');
    script.id = SCHEMA_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
    document.head.appendChild(script);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSchema, { once: true });
  } else {
    injectSchema();
  }
})();
