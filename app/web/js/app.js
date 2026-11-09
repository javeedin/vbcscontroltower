require([
  'ojs/ojbootstrap', 'knockout', 'ojs/ojarraydataprovider',
  'ojs/ojknockout', 'ojs/ojtable', 'ojs/ojbutton',
  'ojs/ojdialog', 'ojs/ojinputtext'
], function (Bootstrap, ko, ArrayDataProvider) {
  'use strict';

  // --- REST client against the local DuckDB backend ---
  const api = {
    list: (c) => fetch('/rest/' + c).then(r => r.json()),
    create: (c, o) => fetch('/rest/' + c, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) }).then(r => r.json()),
    del: (c, id) => fetch('/rest/' + c + '/' + encodeURIComponent(id), { method: 'DELETE' }).then(r => r.json())
  };

  const col = (headerText, field) => ({ headerText, field });

  // --- screens (nav + what each renders) ---
  const SCREENS = [
    { id: 'portfolio', label: 'Portfolio', icon: '▦', type: 'cards' },
    { id: 'ideas', label: 'Ideas & Backlog', icon: '💡', type: 'table', coll: 'ideas',
      cols: [col('Idea', 'title'), col('Value', 'value'), col('Effort', 'effort'), col('Score', 'score'), col('Status', 'status')],
      add: { label: '+ New idea', fields: [['title', 'Idea'], ['value', 'Value (Low/Med/High)'], ['effort', 'Effort (S/M/L)'], ['score', 'Score'], ['status', 'Status']] } },
    { id: 'board', label: 'Lifecycle Board', icon: '🧭', type: 'soon' },
    { id: 'specs', label: 'Design & Spec', icon: '📐', type: 'builder' },
    { id: 'releases', label: 'Releases', icon: '🚀', type: 'table', coll: 'releases',
      cols: [col('Product', 'product'), col('Version', 'version'), col('Target', 'target'), col('Train', 'train'), col('State', 'state'), col('Readiness %', 'readiness')],
      add: { label: '+ New release', fields: [['product', 'Product'], ['version', 'Version'], ['target', 'Target date'], ['train', 'Train'], ['state', 'State'], ['readiness', 'Readiness %']] } },
    { id: 'compare', label: 'Compare releases', icon: '⇄', type: 'soon' },
    { id: 'cicd', label: 'CI / CD', icon: '🔁', type: 'table', coll: 'pipelines',
      cols: [col('Product', 'product'), col('Pipeline', 'name'), col('Engine', 'engine'), col('Last run', 'last'), col('Duration', 'duration'), col('When', 'when'), col('Trigger', 'trigger')] },
    { id: 'readiness', label: 'Release Readiness', icon: '✅', type: 'soon' },
    { id: 'versions', label: 'Version Matrix', icon: '#', type: 'table', coll: 'versions',
      cols: [col('Product', 'product'), col('Web', 'web'), col('Mobile', 'mobile'), col('Desktop', 'desktop'), col('Integration', 'integration'), col('Suite', 'suite')] },
    { id: 'calendar', label: 'Calendar', icon: '📅', type: 'soon' },
    { id: 'customers', label: 'Customers', icon: '🏢', type: 'table', coll: 'customers',
      cols: [col('Customer', 'name'), col('Type', 'type'), col('Version', 'ver'), col('Release', 'rel'), col('Env', 'env'), col('Base', 'base'), col('Custom', 'custom'), col('Open req.', 'reqs')],
      add: { label: '+ Register customer', fields: [['name', 'Customer name'], ['type', 'Type (Internal/External)'], ['ver', 'Deployed version'], ['rel', 'Release'], ['env', 'Environment'], ['since', 'Live since']] } },
    { id: 'features', label: 'Features & demand', icon: '🧩', type: 'table', coll: 'features',
      cols: [col('Feature', 'name'), col('Module', 'module'), col('Type', 'type'), col('Introduced', 'intro'), col('Demand', 'demand')],
      transform: (rows) => rows.map(r => Object.assign({}, r, { demand: ((r.customers || []).length) + '/4' })) },
    { id: 'enhancements', label: 'Enhancements', icon: '📨', type: 'table', coll: 'requests',
      cols: [col('Customer', 'customer'), col('Request', 'title'), col('Type', 'kind'), col('Status', 'status'), col('Disposition', 'disposition'), col('Target', 'target')],
      add: { label: '+ Log request', fields: [['customer', 'Customer'], ['title', 'Request'], ['kind', 'Type'], ['status', 'Status'], ['disposition', 'Disposition'], ['target', 'Target release']] } },
    { id: 'integrations', label: 'Integrations', icon: '🔌', type: 'table', coll: 'integrations',
      cols: [col('Integration', 'name'), col('Status', 'status'), col('Detail', 'detail'), col('Last sync', 'lastSync')] },
    { id: 'admin', label: 'Admin · Products', icon: '⚙', type: 'table', coll: 'products',
      cols: [col('Product', 'name'), col('Description', 'tag'), col('Stack', 'stack'), col('Phase', 'phase'), col('Repo', 'repo')],
      add: { label: '+ Register product', fields: [['name', 'Product name'], ['tag', 'Description'], ['stack', 'Stack (VBCS/React/…)'], ['phase', 'Starting phase'], ['repo', 'Git repo']] } }
  ];
  const byId = {}; SCREENS.forEach(s => byId[s.id] = s);

  function readinessColor(p) {
    if (p == null || p === '' || isNaN(p)) return 'var(--oj-core-text-color-secondary)';
    p = +p; return p >= 80 ? 'var(--oj-core-success-3)' : p >= 60 ? 'var(--oj-core-warning-3)' : 'var(--oj-core-danger-3)';
  }

  function VM() {
    const self = this;
    self.screens = SCREENS;
    self.selectedView = ko.observable('portfolio');
    self.bannerTitle = ko.observable('Portfolio');
    self.bannerSub = ko.observable('');
    self.go = function (id) { self.selectedView(id); self.loadScreen(id); };
    self.navCollapsed = ko.observable(false);
    self.toggleNav = function () {
      self.navCollapsed(!self.navCollapsed());
      try { localStorage.setItem('ct-nav-collapsed', self.navCollapsed() ? '1' : '0'); } catch (e) {}
    };

    self.currentType = ko.observable('cards');
    self.title = ko.observable(''); self.sub = ko.observable('');
    self.canAdd = ko.observable(false); self.addLabel = ko.observable('');
    self.tableColumns = ko.observableArray([]);
    self.tableDP = ko.observable(null);
    self.products = ko.observableArray([]);
    self.kpis = ko.observableArray([]);
    self.addFields = ko.observableArray([]);

    // --- AI settings ---
    self.aiProvider = ko.observable('claude');
    self.aiKey = ko.observable('');
    self.aiModel = ko.observable('');
    self.aiBaseUrl = ko.observable('');
    self.aiConfigured = ko.observable(false);
    self.aiSaveStatus = ko.observable('');
    self.aiBtnText = ko.pureComputed(function () { return self.aiConfigured() ? '🤖 AI: on' : '🤖 AI: setup'; });
    self.refreshAiStatus = function () {
      return fetch('/ai/status').then(r => r.json()).then(function (s) {
        self.aiConfigured(!!s.configured);
        if (s.provider) self.aiProvider(s.provider);
        if (s.model) self.aiModel(s.model);
      }).catch(function () {});
    };
    self.openAiSettings = function () { self.aiSaveStatus(''); self.aiKey(''); document.getElementById('aiDlg').open(); };
    self.closeAiSettings = function () { document.getElementById('aiDlg').close(); };
    self.saveAiSettings = function () {
      self.aiSaveStatus('Saving…');
      fetch('/ai/config', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: self.aiProvider(), apiKey: self.aiKey(), model: self.aiModel(), baseUrl: self.aiBaseUrl() }) })
        .then(r => r.json()).then(function (s) {
          self.aiConfigured(!!s.configured);
          self.aiSaveStatus(s.configured ? 'Saved — AI is configured.' : 'Saved (no key set yet).');
          setTimeout(self.closeAiSettings, 800);
        }).catch(function (e) { self.aiSaveStatus('Error: ' + e); });
    };

    // --- Design & Spec (AI FDD interpreter) ---
    self.biTarget = ko.observable(''); self.biText = ko.observable(''); self.biStatus = ko.observable('');
    self.biResult = ko.observable(false); self.biResultTitle = ko.observable('');
    self.biFeatures = ko.observableArray([]); self.biPages = ko.observableArray([]); self.biFlows = ko.observableArray([]);
    self.biValidations = ko.observableArray([]); self.biConditions = ko.observableArray([]); self.biEntities = ko.observableArray([]);
    self.biVersions = ko.observableArray([]);
    let lastBlueprint = null, lastSource = '';

    self.loadVersions = function () {
      return api.list('blueprints').then(function (rows) {
        rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        self.biVersions(rows.map(function (r) {
          const feats = (r.blueprint && r.blueprint.features || []).length;
          return { label: (r.product || '(unassigned)') + ' · ' + (r.version || ''),
            meta: (r.source || '') + ' · ' + feats + ' features · ' + String(r.createdAt || '').slice(0, 16).replace('T', ' ') };
        }));
      }).catch(function () {});
    };

    self.analyzeDoc = function () {
      const text = self.biText();
      if (!text || !text.trim()) { self.biStatus('Paste or upload a document first.'); return; }
      self.biStatus('Analyzing…'); self.biResult(false);
      fetch('/ai/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: text }) })
        .then(r => r.json()).then(function (d) {
          if (d.error) { self.biStatus('Error: ' + d.error); return; }
          const bp = d.blueprint || {}; lastBlueprint = bp; lastSource = d.source || 'unknown';
          self.biFeatures(bp.features || []);
          self.biPages((bp.pages || []).map(p => p && p.name ? (p.name + (p.type ? ' (' + p.type + ')' : '')) : String(p)));
          self.biFlows((bp.flows || []).map(f => ([f.from, f.to].filter(Boolean).join(' → ') + (f.trigger ? ' · ' + f.trigger : '')) || String(f)));
          self.biValidations(bp.validations || []); self.biConditions(bp.conditions || []);
          self.biEntities((bp.entities || []).map(e => e && e.name ? (e.name + (e.fields && e.fields.length ? ': ' + e.fields.join(', ') : '')) : String(e)));
          self.biResultTitle('Extracted spec · source: ' + lastSource + (bp.productName ? ' · ' + bp.productName : ''));
          self.biResult(true);
          self.biStatus(lastSource.indexOf('ai') === 0 ? 'Done (AI).' : 'Done (heuristic — set up AI in the toolbar for deeper analysis).');
        }).catch(function (e) { self.biStatus('Error: ' + e); });
    };

    self.saveSpec = function () {
      if (!lastBlueprint) return;
      const target = self.biTarget() || lastBlueprint.productName || '(unassigned)';
      const n = self.biVersions().filter(v => v.label.indexOf(target + ' ') === 0).length + 1;
      const rec = { product: target, version: 'v' + n, source: lastSource, createdAt: new Date().toISOString(), blueprint: lastBlueprint };
      api.create('blueprints', rec).then(function () { self.loadVersions(); self.biStatus('Saved spec version ' + rec.version + ' for ' + target + '.'); });
    };

    let currentColl = null, currentScreen = null;

    function buildColumns(screen) {
      const cols = screen.cols.map(c => Object.assign({}, c));
      if (screen.add) {
        cols.push({
          headerText: '', sortable: 'disabled',
          renderer: function (ctx) {
            const a = document.createElement('a');
            a.href = '#'; a.textContent = 'Delete'; a.className = 'row-del';
            a.addEventListener('click', function (e) { e.preventDefault(); self.deleteRow(ctx.row && ctx.row.id); });
            return { insert: a };
          }
        });
      }
      return cols;
    }

    self.reloadTable = function () {
      if (!currentScreen || currentScreen.type !== 'table') return Promise.resolve();
      return api.list(currentColl).then(function (rows) {
        if (currentScreen.transform) rows = currentScreen.transform(rows);
        self.tableDP(new ArrayDataProvider(rows, { keyAttributes: 'id' }));
      });
    };

    self.loadPortfolio = function () {
      return api.list('products').then(function (rows) {
        rows.forEach(function (p) {
          p.ringText = (p.readiness == null) ? '—' : p.readiness + '%';
          p.barW = (p.readiness == null ? 0 : p.readiness) + '%';
          p.barC = readinessColor(p.readiness);
        });
        self.products(rows);
        const inBuild = rows.filter(p => ['Build', 'Test'].indexOf(p.phase) >= 0).length;
        const risks = rows.reduce((a, p) => a + (+p.risks || 0), 0);
        self.kpis([
          { n: rows.length, l: 'Products' },
          { n: inBuild, l: 'In build / test' },
          { n: rows.filter(p => p.phase === 'Release').length, l: 'Releasing' },
          { n: risks, l: 'Open risks' }
        ]);
      });
    };

    self.loadScreen = function (id) {
      const s = byId[id]; if (!s) return;
      currentScreen = s; currentColl = s.coll;
      self.currentType(s.type);
      self.title(s.label); self.sub('');
      self.bannerTitle(s.label);
      self.bannerSub(s.id === 'portfolio' ? 'Every product, every phase — at a glance'
        : s.id === 'specs' ? 'Upload or paste a document; AI extracts the design spec into DuckDB'
        : (s.coll ? 'Stored in DuckDB · live records' : ''));
      if (s.type === 'builder') { self.loadVersions(); return; }
      if (s.type === 'cards') { self.loadPortfolio(); return; }
      if (s.type === 'table') {
        self.canAdd(!!s.add);
        self.addLabel(s.add ? s.add.label : '');
        self.tableColumns(buildColumns(s));
        self.reloadTable();
      }
    };

    // --- add dialog ---
    self.openAdd = function () {
      if (!currentScreen || !currentScreen.add) return;
      self.addFields(currentScreen.add.fields.map(f => ({ key: f[0], label: f[1], value: ko.observable('') })));
      document.getElementById('addDlg').open();
    };
    self.closeAdd = function () { document.getElementById('addDlg').close(); };
    self.submitAdd = function () {
      const obj = {};
      self.addFields().forEach(f => { const v = f.value(); if (v !== '') obj[f.key] = v; });
      api.create(currentColl, obj).then(function () { self.closeAdd(); self.reloadTable(); });
    };

    self.deleteRow = function (id) {
      if (!id) return;
      api.del(currentColl, id).then(function () { self.reloadTable(); });
    };

    // navigation is driven by self.go(id) from the tab bar
  }

  Bootstrap.whenDocumentReady().then(function () {
    const vm = new VM();
    try { vm.navCollapsed(localStorage.getItem('ct-nav-collapsed') === '1'); } catch (e) {}
    ko.applyBindings(vm, document.getElementById('globalBody'));
    ko.applyBindings(vm, document.getElementById('addDlg'));
    ko.applyBindings(vm, document.getElementById('aiDlg'));
    vm.refreshAiStatus();
    const fi = document.getElementById('biFile');
    if (fi) fi.addEventListener('change', function (e) {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = function () { vm.biText(String(rd.result || '')); vm.biStatus('Loaded ' + f.name + ' (' + String(rd.result || '').length + ' chars)'); };
      rd.readAsText(f);
    });
    vm.loadScreen('portfolio');
    document.getElementById('globalBody').style.visibility = 'visible';
  });
});
