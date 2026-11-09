// Control Tower — local dev harness + DuckDB backend (zero config).
//   npm install && npm run serve   ->  http://localhost:3000
//
// Every object type is a DuckDB table (id VARCHAR PRIMARY KEY, doc JSON-as-text),
// stored in app/data/controltower.duckdb and seeded from app/data/seed.json on
// first run. The UI reads/writes through the REST API below, so all data is
// persisted in local DuckDB. This mirrors how the VBCS app will talk to
// Business Object REST — swapping this harness for VBCS is a base-URL change.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DuckDBInstance } = require('@duckdb/node-api');

const ROOT = path.join(__dirname, 'app', 'web');
const DATA = path.join(__dirname, 'app', 'data');
const DBFILE = path.join(DATA, 'controltower.duckdb');
const PORT = process.env.PORT || 3000;

const COLLECTIONS = ['products', 'customers', 'releases', 'features', 'requests',
  'pipelines', 'ideas', 'versions', 'integrations', 'gates', 'spec'];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

let conn;
// serialize DB access (one connection, avoid overlapping queries)
let chain = Promise.resolve();
function withDb(fn) { const r = chain.then(fn, fn); chain = r.catch(() => {}); return r; }
const genId = () => 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function initDb() {
  if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });
  const inst = await DuckDBInstance.create(DBFILE);
  conn = await inst.connect();
  const seed = JSON.parse(fs.readFileSync(path.join(DATA, 'seed.json'), 'utf8'));
  for (const c of COLLECTIONS) {
    await conn.run(`create table if not exists "${c}"(id varchar primary key, doc varchar)`);
    const r = await conn.runAndReadAll(`select count(*)::int as n from "${c}"`);
    const n = r.getRowObjects()[0].n;
    if (n === 0 && Array.isArray(seed[c])) {
      for (const row of seed[c]) {
        const id = String(row.id != null ? row.id : genId());
        if (row.id == null) row.id = id;
        await conn.run(`insert into "${c}" values ($1,$2)`, [id, JSON.stringify(row)]);
      }
      console.log(`  seeded ${c}: ${seed[c].length} rows`);
    }
  }
}

async function list(coll) {
  const r = await conn.runAndReadAll(`select doc from "${coll}" order by id`);
  return r.getRowObjects().map(x => JSON.parse(x.doc));
}
async function getOne(coll, id) {
  const r = await conn.runAndReadAll(`select doc from "${coll}" where id = $1`, [String(id)]);
  const rows = r.getRowObjects();
  return rows.length ? JSON.parse(rows[0].doc) : null;
}
async function upsert(coll, obj) {
  const id = String(obj.id != null ? obj.id : genId());
  obj.id = id;
  await conn.run(`delete from "${coll}" where id = $1`, [id]);
  await conn.run(`insert into "${coll}" values ($1,$2)`, [id, JSON.stringify(obj)]);
  return obj;
}
async function patch(coll, id, body) {
  const cur = await getOne(coll, id) || { id: String(id) };
  const merged = Object.assign({}, cur, body, { id: String(id) });
  return upsert(coll, merged);
}
async function remove(coll, id) {
  await conn.run(`delete from "${coll}" where id = $1`, [String(id)]);
}

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let b = ''; req.on('data', c => { b += c; if (b.length > 2e6) req.destroy(); });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } });
  });
}

async function handleRest(req, res, parts) {
  const coll = parts[1];
  if (!COLLECTIONS.includes(coll)) return send(res, 404, { error: 'unknown collection: ' + coll });
  const id = parts[2] ? decodeURIComponent(parts[2]) : null;
  try {
    if (req.method === 'GET' && !id) return send(res, 200, await withDb(() => list(coll)));
    if (req.method === 'GET' && id) { const o = await withDb(() => getOne(coll, id)); return o ? send(res, 200, o) : send(res, 404, { error: 'not found' }); }
    if (req.method === 'POST') { const body = await readBody(req); return send(res, 201, await withDb(() => upsert(coll, body))); }
    if (req.method === 'PUT' && id) { const body = await readBody(req); return send(res, 200, await withDb(() => patch(coll, id, body))); }
    if (req.method === 'DELETE' && id) { await withDb(() => remove(coll, id)); return send(res, 200, { ok: true, id }); }
    return send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    return send(res, 500, { error: String(e && e.message || e) });
  }
}

function serveStatic(req, res) {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, 'index.html'), (e2, idx) => {
        if (e2) { res.writeHead(404); res.end('Not found'); }
        else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(idx); }
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const pathname = (req.url || '/').split('?')[0];
  const parts = pathname.split('/').filter(Boolean); // ['rest','products','id']
  if (parts[0] === 'rest') return handleRest(req, res, parts);
  serveStatic(req, res);
});

initDb().then(() => {
  server.listen(PORT, () => console.log(`Control Tower (DuckDB)  ->  http://localhost:${PORT}`));
}).catch(e => { console.error('DB init failed:', e); process.exit(1); });
