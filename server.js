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
  '/sw.js':           'no-cache, no-store, must-revalidate',
  '/cards-config.js': 'public, max-age=86400',
  '/manifest.json':   'public, max-age=86400',
  '/icon.svg':        'public, max-age=604800',
  '/icon-192.png':    'public, max-age=604800',
  '/icon-512.png':    'public, max-age=604800',
};

function serveFile(res, filePath, pathname) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Read error:', filePath, err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
      return;
    }
    const ext   = path.extname(filePath).toLowerCase();
    const ctype = MIME[ext] || 'application/octet-stream';
    const cache = CACHE[pathname] || 'no-cache, no-store, must-revalidate';
    res.writeHead(200, { 'Content-Type': ctype, 'Cache-Control': cache });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];
  console.log(req.method, pathname);

  // Security: prevent path traversal
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  // Serve the exact file if it exists
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) {
      return serveFile(res, filePath, pathname);
    }
    // Fallback: serve index.html for unknown routes
    serveFile(res, path.join(ROOT, 'index.html'), '/index.html');
  });
});

server.on('error', (err) => console.error('Server error:', err));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  console.log('Serving files from:', ROOT);
  // Log which HTML files are present at startup
  ['index.html', 'app.html', 'admin.html'].forEach(f => {
    const exists = fs.existsSync(path.join(ROOT, f));
    console.log(`  ${f}: ${exists ? 'OK' : 'MISSING'}`);
  });
});
