// Last updated: 2026-08-21 12:48:45

(() => {
  'use strict';

  const SCHEMA_ID = 'itchyfeet-portfolio-schema';
  const VIDEO_PROVIDER = /(?:vimeo\.com|youtube\.com|youtu\.be)/i;

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function absoluteUrl(value, baseUrl) {
    if (!value) return '';

    try {
      return new URL(value, baseUrl).href;
    } catch (error) {
      return '';
    }
  }

  function slug(value) {
    return cleanText(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function pageUrl() {
    const canonical = document.querySelector('link[rel="canonical"][href]');
    const url = new URL(canonical?.href || window.location.href);
    url.search = '';
    url.hash = '';
    return url.href;
  }

  function videoEmbedUrl(source) {
    try {
      const url = new URL(source);
      const vimeoMatch = url.pathname.match(/\/(\d+)/);

      if (/vimeo\.com$/i.test(url.hostname) && vimeoMatch) {
        return 'https://player.vimeo.com/video/' + vimeoMatch[1];
      }

      if (/youtu\.be$/i.test(url.hostname)) {
        return 'https://www.youtube.com/embed/' + url.pathname.slice(1);
      }

      if (/youtube\.com$/i.test(url.hostname)) {
        const videoId = url.searchParams.get('v') || url.pathname.match(/\/embed\/([^/]+)/)?.[1];
        return videoId ? 'https://www.youtube.com/embed/' + videoId : '';
      }
    } catch (error) {
      return '';
    }

    return '';
  }

  function buildSchema() {
    const projectItems = Array.from(document.querySelectorAll('.work_wrapper'));
    const serviceGroups = Array.from(document.querySelectorAll('.services_item'));
    const showreelSources = Array.from(document.querySelectorAll('.showreel_embed video source[src]'))
      .map(function (source) { return absoluteUrl(source.getAttribute('src'), window.location.href); })
      .filter(function (source, index, sources) { return source && sources.indexOf(source) === index; });
    if (!projectItems.length && !serviceGroups.length && !showreelSources.length) return;

    const url = pageUrl();
    const pathname = new URL(url).pathname;
    const siteUrl = new URL('/', url).href;
    const organizationId = siteUrl + '#organization';
    const personId = siteUrl + '#adrian-oconnell';
    const websiteId = siteUrl + '#website';
    const webpageId = url + '#webpage';
    const servicesListId = url + '#services';
    const videosListId = url + '#videos';
    const pageTitle = cleanText(document.title);
    const collectionName = cleanText(document.querySelector('.heading-style-h1.is-work')?.textContent);
    const collectionIntro = cleanText(document.querySelector('.work_intro-wrapper .text-rich-text')?.textContent);
    const metaDescription = cleanText(document.querySelector('meta[name="description"]')?.content);
    const description = collectionIntro || metaDescription;
    const collectionServiceId = collectionName && collectionIntro ? url + '#collection-service' : '';
    const isServiceLocationPage = /^\/page\/[^/]+\/?$/.test(pathname);
    const serviceAreaMatch = collectionName.match(/^(?:videographer|photographer)\s+(.+)$/i);
    const serviceArea = cleanText(serviceAreaMatch?.[1]);
    const email = document.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.replace(/^mailto:/i, '').split('?')[0]
      || 'adrian@itchyfeet.ie';
    const telephone = document.querySelector('a[href^="tel:"]')?.getAttribute('href')?.replace(/^tel:/i, '')
      || '+353 83 832 4832';
    const socialUrls = Array.from(document.querySelectorAll('a[href^="https://"]'))
      .map(function (link) { return absoluteUrl(link.getAttribute('href'), url); })
      .filter(function (link, index, links) {
        return /(?:instagram\.com|vimeo\.com)/i.test(link) && links.indexOf(link) === index;
      });
    if (!socialUrls.length) {
      socialUrls.push('https://www.instagram.com/itchyfeetcreative/', 'https://vimeo.com/user30372706');
    }

    const services = [];
    serviceGroups.forEach(function (group) {
      const groupName = cleanText(group.querySelector('.services_title')?.textContent);
      const serviceNames = Array.from(group.querySelectorAll('.services_sub-text'))
        .map(function (service) { return cleanText(service.textContent); })
        .filter(Boolean);

      if (!groupName || !serviceNames.length) return;

      serviceNames.forEach(function (serviceName) {
        services.push({ name: serviceName, category: groupName });
      });
    });

    const videos = projectItems.map(function (project, index) {
      const media = absoluteUrl(project.querySelector('[data-work]')?.getAttribute('data-work'), url);
      if (!VIDEO_PROVIDER.test(media)) return null;

      const title = cleanText(project.querySelector('.work_overlay:not(.is-what-i-do) .work_title')?.textContent);
      const category = cleanText(project.querySelector('.work_overlay:not(.is-what-i-do) .work_type')?.textContent);
      const role = cleanText(project.querySelector('.work_overlay:not(.is-what-i-do) .work_role')?.textContent);
      if (!title || title === '-') return null;

      const workLinkValue = project.querySelector('.work_page-link')?.getAttribute('href');
      const workLink = workLinkValue && workLinkValue !== '#'
        ? absoluteUrl(workLinkValue, url)
        : '';
      const thumbnail = absoluteUrl(project.querySelector('.work_image[src]')?.getAttribute('src'), url);
      const video = {
        '@type': 'VideoObject',
        '@id': url + '#video-' + (slug(title) || (index + 1)),
        name: title,
        description: [category, role].filter(Boolean).join('. '),
        url: workLink || media,
        contentUrl: media,
        creator: { '@id': personId },
        publisher: { '@id': organizationId },
        inLanguage: document.documentElement.lang || 'en'
      };
      const embedUrl = videoEmbedUrl(media);

      if (category) video.genre = category;
      if (role) video.keywords = role.split(/\s*\/\s*/).filter(Boolean);
      if (thumbnail) video.thumbnailUrl = thumbnail;
      if (embedUrl) video.embedUrl = embedUrl;
      return video;
    }).filter(Boolean);

    if (showreelSources.length && pathname === '/') {
      const headerText = cleanText(document.querySelector('.header_text.is-showreel')?.textContent);
      const thumbnail = absoluteUrl(document.querySelector('meta[property="og:image"]')?.getAttribute('content'), url);
      const showreel = {
        '@type': 'VideoObject',
        '@id': url + '#showreel',
        name: "Adrian O'Connell Showreel",
        description: headerText || description || 'Director, Cinematographer, Photographer, and Editor showreel.',
        url: url,
        contentUrl: showreelSources[0],
        creator: { '@id': personId },
        publisher: { '@id': organizationId },
        inLanguage: document.documentElement.lang || 'en'
      };

      if (thumbnail) showreel.thumbnailUrl = thumbnail;
      if (showreelSources.length > 1) {
        showreel.encoding = showreelSources.slice(1).map(function (source) {
          return {
            '@type': 'MediaObject',
            contentUrl: source,
            encodingFormat: 'video/mp4'
          };
        });
      }
      videos.push(showreel);
    }

    const graph = [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: 'Itchy Feet Creative',
        alternateName: 'Itchy Feet Productions',
        url: siteUrl,
        email: email,
        telephone: telephone,
        areaServed: { '@type': 'City', name: 'Dublin' },
        sameAs: socialUrls,
        founder: { '@id': personId }
      },
      {
        '@type': 'Person',
        '@id': personId,
        name: "Adrian O'Connell",
        url: siteUrl,
        email: email,
        telephone: telephone,
        jobTitle: 'Director, Cinematographer, Photographer, and Editor',
        worksFor: { '@id': organizationId },
        homeLocation: { '@type': 'City', name: 'Dublin' },
        sameAs: socialUrls
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: siteUrl,
        name: 'Itchy Feet Creative',
        publisher: { '@id': organizationId },
        inLanguage: document.documentElement.lang || 'en'
      },
      {
        '@type': isServiceLocationPage ? ['WebPage', 'ServicePage'] : 'CollectionPage',
        '@id': webpageId,
        url: url,
        name: pageTitle,
        description: description || undefined,
        isPartOf: { '@id': websiteId },
        mainEntity: [
          collectionServiceId ? { '@id': collectionServiceId } : null,
          services.length ? { '@id': servicesListId } : null,
          videos.length ? { '@id': videosListId } : null
        ].filter(Boolean),
        about: { '@id': organizationId },
        inLanguage: document.documentElement.lang || 'en'
      }
    ];

    if (services.length) {
      graph.push({
        '@type': 'ItemList',
        '@id': servicesListId,
        name: 'What I Do services',
        numberOfItems: services.length,
        itemListElement: services.map(function (service, index) {
          return {
            '@type': 'ListItem',
            position: index + 1,
            name: service.name,
            description: service.category + ' service'
          };
        })
      });
    }
    if (videos.length) {
      graph.push({
        '@type': 'ItemList',
        '@id': videosListId,
        name: 'Portfolio videos',
        numberOfItems: videos.length,
        itemListElement: videos.map(function (video, index) {
          return { '@type': 'ListItem', position: index + 1, item: { '@id': video['@id'] } };
        })
      });
    }

    if (collectionServiceId) {
      graph.push({
        '@type': 'Service',
        '@id': collectionServiceId,
        name: collectionName + ' creative services',
        serviceType: collectionName,
        description: collectionIntro,
        provider: { '@id': organizationId },
        areaServed: { '@type': 'City', name: serviceArea || 'Dublin' },
        url: url
      });
    }

    graph.push(...videos);
    return { '@context': 'https://schema.org', '@graph': graph };
  }

  function injectSchema() {
    const data = buildSchema();
    if (!data) return;

    document.getElementById(SCHEMA_ID)?.remove();
    const script = document.createElement('script');
    script.id = SCHEMA_ID;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.append(script);
  }

  function removeLoadingIndicator(wrapper) {
    const loadingIndicator = wrapper.querySelector('.work_loading');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }

  function clearGalleryLoaders() {
    document.querySelectorAll('.work_wrapper').forEach(function (wrapper) {
      const image = wrapper.querySelector('.work_image');
      if (!image) return;

      if (image.complete) {
        removeLoadingIndicator(wrapper);
        return;
      }

      image.addEventListener('load', function () { removeLoadingIndicator(wrapper); }, { once: true });
      image.addEventListener('error', function () { removeLoadingIndicator(wrapper); }, { once: true });
    });

    document.querySelectorAll('.showreel_wrapper').forEach(function (wrapper) {
      const video = wrapper.querySelector('video');
      if (!video) return;

      if (video.readyState > HTMLMediaElement.HAVE_NOTHING) {
        removeLoadingIndicator(wrapper);
        return;
      }

      video.addEventListener('loadeddata', function () { removeLoadingIndicator(wrapper); }, { once: true });
      video.addEventListener('error', function () { removeLoadingIndicator(wrapper); }, { once: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectSchema();
      clearGalleryLoaders();
    }, { once: true });
  } else {
    injectSchema();
    clearGalleryLoaders();
  }
})();

// $(document).ready(function () {

//   // -------------------------------
//   // SHOWREEL
//   // -------------------------------

//   $("[data-showreel]").each(function (index) {
//     const dataShowreel = $(this).attr("data-showreel");
//     $(this).attr({
//       "data-fancybox": "work",
//       "data-src": dataShowreel,
//       "data-caption": "",
//       "data-thumb": ""
//     });
//   });

//   let currentTimeMap = {};

//   $("[data-showreel]").on("click", function (e) {
//     const video = $(this).closest(".showreel_inner").find("video")[0];
//     if (!video) return;
//     const currentTime = Math.floor(video.currentTime);
//     const videoSrc = $(this).attr("data-showreel");
//     currentTimeMap[videoSrc] = currentTime;
//     $(this).attr("data-src", videoSrc);
//   });

//   // -------------------------------
//   // COMBINE WORK ITEMS
//   // -------------------------------

//   if ($('.work_random').text().includes("random")) {
//     $('.work_list-wrapper.is-multiple-list .work_item').appendTo(
//       '.work_list.is-one-list');

//     var items = $('.work_list.is-one-list .work_item');
//     items.sort(function () {
//       return Math.random() - 0.5;
//     });
//     $('.work_list.is-one-list').empty().append(items);
//   } else {
//     $('.work_list-wrapper.is-multiple-list .work_item').appendTo(
//       '.work_list.is-one-list');
//     $('.work_list-wrapper.is-multiple-list').remove();
//   }

//   if ($('.heading-style-h1.is-work').length) {
//     const headingText = $('.heading-style-h1.is-work').text();
//     $('.work_type.is-images').text(headingText);
//   }

//   $('.work_image.is-images').each(function () {
//     const altText = $(this).attr('alt');
//     console.log(altText)
//     const workTitle = $(this).closest('.work_inner').find('.work_title.is-images');

//     if (altText) {
//       workTitle.text(altText);
//     } else {
//       workTitle.remove();
//     }
//   });

//   // -------------------------------
//   // FANCBOX
//   // -------------------------------

//   var scrollWidth = window.innerWidth - $(window).width();
//   $(".work_wrapper").each(
//     function () {
//       if ($(this).attr("data-order") === "99") {
//         return;
//       }
//       let workSrc = $(this).find("[data-work]").attr("data-work");
//       if (!workSrc) {
//         workSrc = $(this).find(".work_image").attr("src");
//         if (workSrc) {
//           $(this).find("[data-work]").attr("data-work", workSrc);
//         }
//       }
//       // if (workSrc) {
//       //   workSrc += "?autoplay=1";
//       // }
//       const workTitle = $(this).find(".work_overlay:not(.is-what-i-do) .work_title").text()
//         .trim();
//       const workType = $(this).find(".work_overlay:not(.is-what-i-do) .work_type").text()
//         .trim();
//       const workRole = $(this).find(".work_overlay:not(.is-what-i-do) .work_role").text()
//         .trim();

//       const workPageLink = $(this).find(".work_page-link");
//       const pageLinkText = workPageLink.text().trim();
//       const pageLinkUrl = workPageLink.attr("href");

//       const titleSeparator = workTitle ? ` // ${workTitle}` : '';
//       const pageLinkHtml = pageLinkText ?
//         `See more <a href="${pageLinkUrl}">${pageLinkText}</a> work` : '';
//       console.log(pageLinkHtml)
//       const caption =
//         `<span style="font-weight: 400;">${workType}</span>${titleSeparator}<br>${pageLinkHtml}`;

//       $(this).attr({
//         "data-fancybox": "work",
//         "data-src": workSrc,
//         "data-caption": caption,
//         "data-thumb": ""
//       });
//     });

//   // INITIATE & CONFIGURE
//   $("[data-fancybox]").fancybox({
//     loop: false,
//     arrows: true,
//     infobar: false,
//     thumbs: {
//       autoStart: false
//     },
//     slideShow: {
//       autoStart: false,
//       speed: 3000
//     },
//     mobile: {
//       arrows: true,
//       thumbs: {
//         autoStart: false
//       }
//     },
//     buttons: [
//       "fullScreen",
//       "close"
//     ],
//     video: {
//       tpl: '<video class="fancybox-video" preload="none" loop controlsList="nodownload">' +
//         '<source src="{{src}}" type="{{format}}" />' +
//         "Your browser doesn't support HTML5 video" +
//         "</video>",
//       format: "",
//       autoStart: true
//     },
//     animationEffect: "zoom",
//     animationDuration: 500,
//     transitionEffect: "fade",
//     transitionDuration: 500,
//     clickContent: function (current, event) {
//       return current.type === "image" ? "next" : false;
//     },

//     beforeShow: function (instance, slide) {
//       $(".nav-bar").css("padding-right", scrollWidth);
//     },
//     afterShow: function (instance, current) {
//       const fancyboxVideo = $(".fancybox-slide--video video")[
//         0]; // Get Fancybox video element
//       if (fancyboxVideo) {
//         const storedTime = currentTimeMap[current.src] ||
//           0; // Retrieve stored timestamp
//         fancyboxVideo.currentTime = storedTime; // Set timestamp
//         fancyboxVideo.play(); // Ensure it plays from that time
//       }
//     },

//     afterClose: function (instance, slide) {
//       $(".nav-bar").css("padding-right", "0px");
//     }

//   });

//   // -------------------------------
//   // MASONRY GRID
//   // -------------------------------

//   $('.work_list').each(function () {
//     var $grid = $(this).masonry({
//       itemSelector: '.work_item',
//       columnWidth: '.work_item',
//       percentPosition: true,
//       gutter: 0, // Adjust as needed
//     });

//     $grid.masonry('layout');

//     var intervalTime = 500;

//     setInterval(function () {
//       $grid.masonry('layout');
//       $('.work_list').css('opacity', 1);
//     }, intervalTime);

//     $(window).on('resize', function () {
//       $grid.masonry('layout');
//     });
//   });

//   $('.work_item, .work_list').css('min-height', '0');

// });
