// Last updated: 2026-09-25 14:19:06

// Chanelle Pharma: new-build site script (sites/chanellepharma-new.js).
// Loaded by the new Webflow build's footer loader (dev.wsitefiles.com, falling back to wsitefiles.com).
// Background videos: [data-video] wrappers get a muted, looping, inline <video> over their poster <img>;
// the URL comes from a hidden child (.x_video-src, bound to the Video URL prop) or the data-video attribute.
(() => {
  const init = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // poster only
    document.querySelectorAll('[data-video]').forEach((wrap) => {
      const srcEl = wrap.querySelector('[class*="_video-src"]');
      const src = ((srcEl && srcEl.textContent) || '').trim() || wrap.getAttribute('data-video') || '';
      if (!/^https?:\/\//.test(src) || wrap.querySelector('video')) return; // empty prop = photo hero
      const poster = wrap.querySelector('img');
      const video = document.createElement('video');
      video.muted = true; video.loop = true; video.autoplay = true; video.playsInline = true;
      ['muted', 'loop', 'autoplay', 'playsinline'].forEach((a) => video.setAttribute(a, ''));
      video.setAttribute('aria-hidden', 'true');
      if (poster) video.poster = poster.currentSrc || poster.src;
      video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;';
      video.src = src;
      wrap.appendChild(video); // after the <img>, before the overlay siblings
      const playing = video.play();
      if (playing) playing.catch(() => {}); // autoplay blocked: the poster still shows
      const toggle = wrap.closest('section') && wrap.closest('section').querySelector('[data-video-toggle]');
      if (!toggle) return;
      toggle.style.display = 'flex';
      toggle.addEventListener('click', () => {
        if (video.paused) video.play(); else video.pause();
        toggle.setAttribute('aria-label', video.paused ? 'Play background video' : 'Pause background video');
      });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
