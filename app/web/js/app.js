require([
  'ojs/ojbootstrap', 'knockout', 'ojs/ojarraydataprovider',
  'ojs/ojknockout', 'ojs/ojnavigationlist', 'ojs/ojtable', 'ojs/ojbutton',
  'ojs/ojtoolbar', 'ojs/ojdialog', 'ojs/ojinputtext'
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
    { id: 'specs', label: 'Design & Spec', icon: '📐', type: 'soon' },
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
    self.navDP = new ArrayDataProvider(SCREENS.map(s => ({ id: s.id, label: s.label, icon: s.icon })), { keyAttributes: 'id' });
    self.selectedView = ko.observable('portfolio');

    self.currentType = ko.observable('cards');
    self.title = ko.observable(''); self.sub = ko.observable('');
    self.canAdd = ko.observable(false); self.addLabel = ko.observable('');
    self.tableColumns = ko.observableArray([]);
    self.tableDP = ko.observable(null);
    self.products = ko.observableArray([]);
    self.kpis = ko.observableArray([]);
    self.addFields = ko.observableArray([]);

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

    self.selectedView.subscribe(function (id) { if (id) self.loadScreen(id); });
  }

  Bootstrap.whenDocumentReady().then(function () {
    const vm = new VM();
    ko.applyBindings(vm, document.getElementById('globalBody'));
    ko.applyBindings(vm, document.getElementById('addDlg'));
    vm.loadScreen('portfolio');
    document.getElementById('globalBody').style.visibility = 'visible';
  });
});
