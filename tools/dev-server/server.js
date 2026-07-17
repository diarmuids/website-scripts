const http = require('http');
const fs = require('fs');
const path = require('path');

const repo = path.resolve(__dirname, '..', '..');
const port = Number(process.env.PORT || 8787);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, max-age=0',
    ...headers
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (!pathname.startsWith('/sites/')) {
    send(res, 404, 'Not found');
    return;
  }

  const filePath = path.resolve(repo, pathname.slice(1));

  if (!filePath.startsWith(path.join(repo, 'sites') + path.sep)) {
    send(res, 404, 'Not found');
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, 404, 'Not found');
      return;
    }

    send(res, 200, content, {
      'Content-Type': types[path.extname(filePath)] || 'text/plain; charset=utf-8'
    });
  });
});

server.listen(port, () => {
  console.log(`Website Scripts dev server: http://localhost:${port}`);
});
