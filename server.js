// Control Tower — local dev harness (zero dependencies).
// Serves the web app from app/web/ so you can run it like any app:
//   npm install && npm run serve  ->  http://localhost:3000
//
// This is the local DEV emulation. The real app is realized/deployed in VBCS
// (Business Objects + Service Connections + JET pages). The data is embedded
// seed data today; wiring the UI to a mock Business-Object REST layer is the
// next increment (see ROADMAP.md).

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'app', 'web');
const PORT = process.env.PORT || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';

  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) {           // path-traversal guard
    res.writeHead(403); return res.end('Forbidden');
  }

  fs.readFile(file, (err, data) => {
    if (err) {                            // fall back to the single-page app
      fs.readFile(path.join(ROOT, 'index.html'), (e2, idx) => {
        if (e2) { res.writeHead(404); res.end('Not found'); }
        else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(idx); }
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Control Tower dev server  ->  http://localhost:${PORT}`);
});
