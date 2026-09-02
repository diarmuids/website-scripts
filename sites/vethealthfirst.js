// Last updated: 2026-09-02 11:04:57

(() => {
  const LOGIN_ENDPOINT = 'https://api.memberstack.io/member/login';
  const PATCH_FLAG = '__vhfMemberstackLoginRecaptchaPatch';

  if (window[PATCH_FLAG] || typeof window.fetch !== 'function') {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  function isMemberstackLoginRequest(input) {
    const requestUrl = typeof input === 'string' ? input : input?.url;

    if (!requestUrl) {
      return false;
    }

    try {
      return new URL(requestUrl, window.location.href).href === LOGIN_ENDPOINT;
    } catch (_error) {
      return false;
    }
  }

  function isMemberstackRecaptchaEnabled() {
    return Boolean(document.querySelector('script[recaptcha-v3-script]'));
  }

  function waitForRecaptcha(timeoutMs = 8000) {
    return new Promise((resolve) => {
      const startedAt = Date.now();

      function check() {
        if (
          window.grecaptcha &&
          typeof window.grecaptcha.ready === 'function' &&
          typeof window.grecaptcha.execute === 'function'
        ) {
          resolve(window.grecaptcha);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          resolve(null);
          return;
        }

        window.setTimeout(check, 50);
      }

      check();
    });
  }

  function waitUntilRecaptchaReady(recaptcha) {
    return new Promise((resolve) => {
      recaptcha.ready(resolve);
    });
  }

  async function createLoginRecaptchaToken() {
    const recaptcha = await waitForRecaptcha();

    if (!recaptcha) {
      return '';
    }

    await waitUntilRecaptchaReady(recaptcha);

    const configuredWidgetIds = Object.keys(window.___grecaptcha_cfg?.clients || {})
      .map(Number)
      .filter(Number.isInteger);
    const widgetIds = [...new Set([0, ...configuredWidgetIds])];

    for (const widgetId of widgetIds) {
      try {
        const token = await recaptcha.execute(widgetId, { action: undefined });

        if (token) {
          return token;
        }
      } catch (_error) {
        // Try the next rendered widget, if one exists.
      }
    }

    return '';
  }

  window.fetch = async function patchedMemberstackFetch(input, init) {
    if (
      !isMemberstackLoginRequest(input) ||
      !init ||
      typeof init.body !== 'string' ||
      !isMemberstackRecaptchaEnabled()
    ) {
      return originalFetch(input, init);
    }

    try {
      const body = JSON.parse(init.body);

      if (!body.rctoken) {
        const recaptchaToken = await createLoginRecaptchaToken();

        if (recaptchaToken) {
          return originalFetch(input, {
            ...init,
            body: JSON.stringify({ ...body, rctoken: recaptchaToken }),
          });
        }
      }
    } catch (_error) {
      // Let Memberstack handle its original request and error messaging.
    }

    return originalFetch(input, init);
  };

  window[PATCH_FLAG] = true;
})();

