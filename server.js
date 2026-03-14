const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
};

const CACHE = {
  '/sw.js':          'no-cache, no-store, must-revalidate',
  '/cards-config.js':'public, max-age=86400',
  '/manifest.json':  'public, max-age=86400',
  '/icon.svg':       'public, max-age=604800',
  '/icon-192.png':   'public, max-age=604800',
  '/icon-512.png':   'public, max-age=604800',
};

function serve(res, filePath, pathname) {
  const ext   = path.extname(filePath).toLowerCase();
  const ctype = MIME[ext] || 'application/octet-stream';
  const cache = CACHE[pathname] || 'no-cache, no-store, must-revalidate';

  res.writeHead(200, { 'Content-Type': ctype, 'Cache-Control': cache });
  fs.createReadStream(filePath).pipe(res);
}

http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  const filePath = path.join(ROOT, pathname);

  // Serve the exact file if it exists
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serve(res, filePath, pathname);
  }

  // Fallback to index.html (SPA / unknown routes)
  serve(res, path.join(ROOT, 'index.html'), '/index.html');
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
});
