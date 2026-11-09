// Control Tower — local dev harness + DuckDB backend + AI FDD Interpreter.
//   npm install && npm run serve   ->  http://localhost:3000
//
// Data: every object type is a DuckDB table (id, doc) in app/data/controltower.duckdb,
//       seeded from app/data/seed.json. REST CRUD at /rest/:collection.
// AI:   /ai/config (save provider+key), /ai/status, /ai/analyze (doc -> design spec).
//       The API key is stored server-side in app/data/.secrets.json (gitignored) and
//       the LLM is called from here, so the key never reaches the browser or git.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DuckDBInstance } = require('@duckdb/node-api');

const ROOT = path.join(__dirname, 'app', 'web');
const DATA = path.join(__dirname, 'app', 'data');
const DBFILE = path.join(DATA, 'controltower.duckdb');
const SECRETS = path.join(DATA, '.secrets.json');
const PORT = process.env.PORT || 3000;

const COLLECTIONS = ['products', 'customers', 'releases', 'features', 'requests',
  'pipelines', 'ideas', 'versions', 'integrations', 'gates', 'spec', 'blueprints'];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

let conn;
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
    if (r.getRowObjects()[0].n === 0 && Array.isArray(seed[c])) {
      for (const row of seed[c]) {
        const id = String(row.id != null ? row.id : genId());
        if (row.id == null) row.id = id;
        await conn.run(`insert into "${c}" values ($1,$2)`, [id, JSON.stringify(row)]);
      }
      console.log(`  seeded ${c}: ${seed[c].length} rows`);
    }
  }
}

async function list(coll) { const r = await conn.runAndReadAll(`select doc from "${coll}" order by id`); return r.getRowObjects().map(x => JSON.parse(x.doc)); }
async function getOne(coll, id) { const r = await conn.runAndReadAll(`select doc from "${coll}" where id = $1`, [String(id)]); const rows = r.getRowObjects(); return rows.length ? JSON.parse(rows[0].doc) : null; }
async function upsert(coll, obj) { const id = String(obj.id != null ? obj.id : genId()); obj.id = id; await conn.run(`delete from "${coll}" where id = $1`, [id]); await conn.run(`insert into "${coll}" values ($1,$2)`, [id, JSON.stringify(obj)]); return obj; }
async function patch(coll, id, body) { const cur = await getOne(coll, id) || { id: String(id) }; return upsert(coll, Object.assign({}, cur, body, { id: String(id) })); }
async function remove(coll, id) { await conn.run(`delete from "${coll}" where id = $1`, [String(id)]); }

function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); }
function readBody(req) { return new Promise((resolve) => { let b = ''; req.on('data', c => { b += c; if (b.length > 8e6) req.destroy(); }); req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { resolve({}); } }); }); }

// ---------- secrets (AI config) ----------
function loadSecrets() { try { return JSON.parse(fs.readFileSync(SECRETS, 'utf8')); } catch (e) { return {}; } }
function saveSecrets(s) { fs.writeFileSync(SECRETS, JSON.stringify(s, null, 2)); }

const DEFAULT_MODEL = { claude: 'claude-3-5-sonnet-latest', openai: 'gpt-4o-mini', gemini: 'gemini-1.5-flash', compatible: 'gpt-4o-mini', oci: '' };

async function callLLM(cfg, prompt) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90000);
  const model = cfg.model || DEFAULT_MODEL[cfg.provider] || '';
  try {
    if (cfg.provider === 'claude') {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', signal: ctrl.signal,
        headers: { 'x-api-key': cfg.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ? (d.error.message || JSON.stringify(d.error)) : ('HTTP ' + r.status));
      return d.content.map(c => c.text || '').join('');
    }
    if (cfg.provider === 'gemini') {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`,
        { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ? d.error.message : ('HTTP ' + r.status));
      return d.candidates[0].content.parts.map(p => p.text || '').join('');
    }
    if (cfg.provider === 'openai' || cfg.provider === 'compatible') {
      const base = cfg.provider === 'compatible' ? (cfg.baseUrl || '').replace(/\/$/, '') : 'https://api.openai.com/v1';
      const r = await fetch(base + '/chat/completions', { method: 'POST', signal: ctrl.signal,
        headers: { 'Authorization': 'Bearer ' + cfg.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({ model, temperature: 0, messages: [{ role: 'user', content: prompt }] }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error ? d.error.message : ('HTTP ' + r.status));
      return d.choices[0].message.content;
    }
    throw new Error(cfg.provider === 'oci' ? 'OCI GenAI needs OCI request signing — use an OpenAI-compatible proxy endpoint for now.' : 'Unknown provider: ' + cfg.provider);
  } finally { clearTimeout(t); }
}

const EXTRACT_PROMPT = (text) =>
  'You are a software design analyst. Read the requirements / FDD document below and extract a structured design spec. ' +
  'Return ONLY valid JSON (no markdown, no code fences) with exactly this shape: ' +
  '{"productName":string,"features":[string],"pages":[{"name":string,"type":string}],"flows":[{"from":string,"to":string,"trigger":string}],' +
  '"entities":[{"name":string,"fields":[string]}],"validations":[string],"conditions":[string],"integrations":[string]}. ' +
  'Be thorough but concise. Document:\n\n' + text.slice(0, 120000);

function parseJsonLoose(s) {
  if (!s) throw new Error('empty AI response');
  let t = s.trim().replace(/^```(json)?/i, '').replace(/```$/,'').trim();
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

// Heuristic fallback when no AI key is configured (so the flow works offline).
function heuristicExtract(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const bullets = lines.filter(l => /^([-*•]|\d+[.)])\s+/.test(l)).map(l => l.replace(/^([-*•]|\d+[.)])\s+/, ''));
  const has = (l, re) => re.test(l);
  const uniq = (a) => Array.from(new Set(a)).slice(0, 30);
  const headings = lines.filter(l => /^#{1,4}\s+/.test(l)).map(l => l.replace(/^#{1,4}\s+/, ''));
  return {
    productName: (headings[0] || 'Untitled'),
    features: uniq(bullets.filter(l => !has(l, /valid|must|required|if |when /i))).map(s => s.slice(0, 120)),
    pages: uniq(lines.filter(l => has(l, /\b(page|screen|view|dashboard|form|list|report)\b/i)))
      .map(l => ({ name: l.replace(/^([-*•]|\d+[.)])\s+/, '').slice(0, 80), type: 'screen' })),
    flows: uniq(lines.filter(l => has(l, /→|->|then|navigat|flow|redirect/i))).map(l => ({ from: '', to: l.slice(0, 100), trigger: '' })),
    entities: uniq(lines.filter(l => has(l, /\b(entity|table|object|field|attribute|record)\b/i))).map(l => ({ name: l.slice(0, 80), fields: [] })),
    validations: uniq(lines.filter(l => has(l, /\b(valid|required|mandatory|must|unique|format|min|max)\b/i))).map(s => s.slice(0, 160)),
    conditions: uniq(lines.filter(l => has(l, /\b(if|when|unless|only if|otherwise|condition)\b/i))).map(s => s.slice(0, 160)),
    integrations: uniq(lines.filter(l => has(l, /\b(api|rest|integration|webhook|oic|fusion|endpoint)\b/i))).map(s => s.slice(0, 120))
  };
}

async function handleAi(req, res, parts) {
  const action = parts[1];
  try {
    if (action === 'status' && req.method === 'GET') {
      const s = loadSecrets();
      return send(res, 200, { configured: !!s.apiKey, provider: s.provider || 'claude', model: s.model || '' });
    }
    if (action === 'config' && req.method === 'POST') {
      const b = await readBody(req);
      const s = { provider: b.provider || 'claude', model: b.model || '', baseUrl: b.baseUrl || '' };
      if (b.apiKey) s.apiKey = b.apiKey;                 // keep existing key if not re-entered
      else { const old = loadSecrets(); if (old.apiKey) s.apiKey = old.apiKey; }
      saveSecrets(s);
      return send(res, 200, { configured: !!s.apiKey, provider: s.provider, model: s.model });
    }
    if (action === 'analyze' && req.method === 'POST') {
      const b = await readBody(req);
      const text = (b.text || '').toString();
      if (!text.trim()) return send(res, 400, { error: 'No document text provided.' });
      const cfg = loadSecrets();
      if (cfg.apiKey) {
        try {
          const raw = await callLLM(cfg, EXTRACT_PROMPT(text));
          const bp = parseJsonLoose(raw);
          return send(res, 200, { source: 'ai:' + (cfg.provider), model: cfg.model || DEFAULT_MODEL[cfg.provider], blueprint: bp });
        } catch (e) {
          return send(res, 502, { error: 'AI call failed: ' + (e.message || e) });
        }
      }
      return send(res, 200, { source: 'heuristic', blueprint: heuristicExtract(text) });
    }
    return send(res, 404, { error: 'unknown ai action' });
  } catch (e) { return send(res, 500, { error: String(e && e.message || e) }); }
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
  } catch (e) { return send(res, 500, { error: String(e && e.message || e) }); }
}

function serveStatic(req, res) {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.join(ROOT, path.normalize(p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { fs.readFile(path.join(ROOT, 'index.html'), (e2, idx) => { if (e2) { res.writeHead(404); res.end('Not found'); } else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(idx); } }); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parts = (req.url || '/').split('?')[0].split('/').filter(Boolean);
  if (parts[0] === 'ai') return handleAi(req, res, parts);
  if (parts[0] === 'rest') return handleRest(req, res, parts);
  serveStatic(req, res);
});

initDb().then(() => server.listen(PORT, () => console.log(`Control Tower (DuckDB + AI)  ->  http://localhost:${PORT}`)))
  .catch(e => { console.error('DB init failed:', e); process.exit(1); });
