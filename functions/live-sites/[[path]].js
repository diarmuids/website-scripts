const REPO_RAW_BASE =
  'https://raw.githubusercontent.com/diarmuids/website-scripts/main/sites/';

function contentTypeFor(path) {
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  return 'application/javascript; charset=utf-8';
}

export async function onRequest(context) {
  const pathParam = context.params.path;
  const parts = Array.isArray(pathParam) ? pathParam : [pathParam || ''];
  const path = parts.join('/');

  if (!/^[a-z0-9._/-]+\.(js|css)$/i.test(path) || path.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const rawUrl = REPO_RAW_BASE + path + '?t=' + Date.now();
  const response = await fetch(rawUrl, {
    cf: { cacheTtl: 0, cacheEverything: false },
    headers: {
      'Cache-Control': 'no-cache'
    }
  });

  if (!response.ok) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(response.body, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': contentTypeFor(path),
      'X-Website-Scripts-Source': 'github-raw-proxy'
    }
  });
}
