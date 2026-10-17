/**
 * SAP Subscription Billing — Data Operations Console
 * Vanilla JS SPA controller — connects to existing BillServer.java REST API
 * API base: relative paths (served by the same Java server on port 8080)
 */

// ── Application State ────────────────────────────────────────────
const App = {
  services: [],           // From /api/services
  stats: null,            // From /api/stats
  currentPage: 'dashboard',
  currentServiceId: null, // Active service dashboard ID

  // Per-page local data caches
  billsData: [],
  billsFiltered: [],
  billsPage: 1,
  billsPageSize: 15,

  explorerData: [],
  explorerFiltered: [],
  explorerView: 'table',  // 'table' | 'json'

  svcData: [],            // Current service dashboard records
  svcPage: 1,
  svcPageSize: 15,

  svcCharts: { c1: null, c2: null },
  dashCharts: { status: null, volume: null },

  _syncInProgress: new Set(), // Prevents duplicate submissions
};

// ── API Client ───────────────────────────────────────────────────
const API = {
  _base: '',  // relative — same origin

  async _fetch(url, opts = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch(this._base + url, { ...opts, signal: controller.signal });
      const ct = res.headers.get('content-type') || '';
      const isJson = ct.includes('application/json');
      if (!res.ok) {
        const body = isJson ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
        const msg = (isJson && body.error) ? body.error : `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(msg);
      }
      return isJson ? res.json() : res.text();
    } finally {
      clearTimeout(timeout);
    }
  },

  getStats()            { return this._fetch('/api/stats'); },
  getServices()         { return this._fetch('/api/services'); },
  getFetchLog()         { return this._fetch('/api/fetch-log'); },
  getBills(params)      {
    const q = new URLSearchParams(params).toString();
    return this._fetch('/api/bills' + (q ? '?' + q : ''));
  },
  getBillById(id)       { return this._fetch('/api/bills/' + encodeURIComponent(id)); },
  getServiceData(id)    {
    const url = id === 'bills' ? '/api/bills' : '/api/data/' + encodeURIComponent(id);
    return this._fetch(url);
  },
  syncService(id) {
    return this._fetch('/api/sync/' + encodeURIComponent(id), { method: 'POST' });
  },
  addService(payload) {
    return this._fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  deleteService(id) {
    return this._fetch('/api/services/' + encodeURIComponent(id), { method: 'DELETE' });
  },
};

// ── Utilities ────────────────────────────────────────────────────
function escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeText(el, txt) {
  if (el) el.textContent = txt ?? '—';
}

function fmt(val, col) {
  if (val == null) return '<span class="muted">—</span>';
  const s = String(val);
  const lo = (col || '').toLowerCase();
  if (lo.includes('status') || lo.includes('state')) {
    return `<span class="badge ${statusBadgeClass(s)}">${escHtml(s)}</span>`;
  }
  if (lo.includes('amount') && !isNaN(Number(val))) {
    return `<span style="font-variant-numeric:tabular-nums">${Number(val).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>`;
  }
  if (typeof val === 'object') {
    return `<code style="font-size:11px;color:var(--text-muted)">${escHtml(JSON.stringify(val).slice(0,40))}${JSON.stringify(val).length > 40 ? '…' : ''}</code>`;
  }
  if (s.length > 42) return `<span title="${escHtml(s)}">${escHtml(s.slice(0,40))}…</span>`;
  return escHtml(s);
}

function statusBadgeClass(s) {
  const lo = s.toLowerCase();
  if (lo.includes('success') || lo.includes('active') || lo.includes('closed') || lo.includes('paid')) return 'badge-success';
  if (lo.includes('open') || lo.includes('pending') || lo.includes('process')) return 'badge-blue';
  if (lo.includes('warn') || lo.includes('partial')) return 'badge-warning';
  if (lo.includes('error') || lo.includes('fail') || lo.includes('cancel')) return 'badge-error';
  return 'badge-neutral';
}

function fmtColHeader(k) {
  return k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()).trim();
}

function fmtTimestamp(ts) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

function fmtTimeAgo(ts) {
  if (!ts) return '—';
  try {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return Math.floor(diff/86400000) + 'd ago';
  } catch { return ts; }
}

// ── Toast ────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-dot"></span><span class="toast-msg">${escHtml(msg)}</span><span class="toast-close" onclick="this.parentElement.remove()">&times;</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(6px)'; t.style.transition = 'all 0.25s ease'; setTimeout(() => t.remove(), 280); }, 4000);
}

// ── Modal helpers ────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

// ── Drawer ───────────────────────────────────────────────────────
function openDrawer(title, subtitle, bodyHtml) {
  safeText(document.getElementById('drawerTitle'), title);
  safeText(document.getElementById('drawerSubtitle'), subtitle);
  const b = document.getElementById('drawerBody');
  if (b) b.innerHTML = bodyHtml;
  document.getElementById('drawerBackdrop')?.classList.add('open');
  document.getElementById('detailDrawer')?.classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawerBackdrop')?.classList.remove('open');
  document.getElementById('detailDrawer')?.classList.remove('open');
}

// ── Structured Detail Drawer Renderer ───────────────────────────
function isIdOrCode(k) {
  const lo = String(k).toLowerCase();
  return lo === 'id' || lo.endsWith('id') || lo.endsWith('uuid') || lo.includes('token') || lo.includes('documentnumber');
}

function renderPrimitiveVal(v, k) {
  if (v == null) return '<span class="text-muted">—</span>';
  if (typeof v === 'boolean') {
    return `<span class="badge ${v ? 'badge-success' : 'badge-neutral'}">${v ? 'TRUE' : 'FALSE'}</span>`;
  }
  const str = String(v);
  const lo = String(k).toLowerCase();
  if (lo.includes('status')) {
    return `<span class="badge ${statusBadgeClass(str)}">${escHtml(str)}</span>`;
  }
  if (lo === 'currency') {
    return `<span class="badge badge-neutral mono">${escHtml(str)}</span>`;
  }
  if (lo.includes('amount') || lo.includes('price')) {
    const num = Number(v);
    if (!isNaN(num)) return `<strong>${num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>`;
  }
  if ((lo.includes('at') || lo.includes('date') || lo.includes('from') || lo.includes('until')) && str.includes('T')) {
    return `<span class="mono" title="${escHtml(str)}">${escHtml(fmtTimestamp(str))}</span>`;
  }
  return escHtml(str);
}

function formatSubTableCell(val, col) {
  if (val == null) return '<span class="text-muted">—</span>';
  if (typeof val === 'object') {
    if ('amount' in val) {
      return `<strong>${Number(val.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</strong> ${escHtml(val.currency || '')}`;
    }
    if ('value' in val && 'unit' in val) {
      return `<strong>${val.value}</strong> <span class="text-muted">${escHtml(val.unit)}</span>`;
    }
    if ('start' in val && 'end' in val) {
      const s = String(val.start).slice(0, 10);
      const e = String(val.end).slice(0, 10);
      return `<span class="mono" style="font-size:10.5px;">${s} → ${e}</span>`;
    }
    if (Array.isArray(val)) {
      if (!val.length) return '<span class="text-muted">—</span>';
      return val.map(p => {
        if (p && p.conditionType && p.conditionValue) {
          const cv = p.conditionValue;
          const amtStr = cv.amount ? `(${cv.amount} ${cv.currency || ''})` : '';
          return `<span class="badge badge-neutral" style="font-size:10px;">${escHtml(p.conditionType)} ${amtStr}</span>`;
        }
        return `<span class="badge badge-neutral" style="font-size:10px;">${escHtml(JSON.stringify(p).slice(0, 25))}</span>`;
      }).join(' ');
    }
    return `<code style="font-size:10px;">${escHtml(JSON.stringify(val).slice(0, 40))}</code>`;
  }
  if (typeof val === 'boolean') {
    return `<span class="badge ${val ? 'badge-success' : 'badge-neutral'}" style="font-size:10px;">${val ? 'TRUE' : 'FALSE'}</span>`;
  }
  if (String(col).toLowerCase().includes('type')) {
    return `<span class="badge badge-blue" style="font-size:10px;">${escHtml(String(val))}</span>`;
  }
  if (String(col).toLowerCase().includes('due') || String(col).toLowerCase().includes('date')) {
    return `<span class="mono" style="font-size:11px;">${escHtml(String(val).slice(0, 10))}</span>`;
  }
  return escHtml(String(val));
}

function renderSubArrayTable(key, arr) {
  if (!arr.length) return '';
  const first = arr[0];
  if (typeof first !== 'object' || first === null) {
    return `<div style="margin-top:8px;">
      <span style="font-size:11px; font-weight:600; color:var(--text-secondary);">${escHtml(fmtColHeader(key))}:</span>
      <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
        ${arr.map(v => `<span class="badge badge-neutral">${escHtml(String(v))}</span>`).join('')}
      </div>
    </div>`;
  }

  const allKeys = [...new Set(arr.flatMap(o => Object.keys(o)))];
  const preferredCols = ['metricId', 'billingType', 'monetaryAmount', 'quantity', 'dueAt', 'ratingPeriod', 'ratingType', 'pricingElements'];
  const cols = [...preferredCols.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !preferredCols.includes(k))].slice(0, 6);

  return `<div style="margin-top:10px;">
    <div style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-secondary); margin-bottom:6px; display:flex; align-items:center; gap:6px;">
      <span>${escHtml(fmtColHeader(key))}</span>
      <span class="badge badge-blue" style="font-size:10px;">${arr.length} ${arr.length === 1 ? 'item' : 'items'}</span>
    </div>
    <div style="overflow-x:auto; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg-surface);">
      <table class="data-table" style="font-size:11.5px; width:100%;">
        <thead>
          <tr>
            ${cols.map(c => `<th style="padding:6px 10px; font-size:10px;">${escHtml(fmtColHeader(c))}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${arr.map(row => `
            <tr>
              ${cols.map(c => `<td style="padding:6px 10px;">${formatSubTableCell(row[c], c)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function renderNestedObjectItem(item, idx, parentKey) {
  if (!item || typeof item !== 'object') {
    return `<div class="nested-item-card"><span class="text-muted">${escHtml(String(item))}</span></div>`;
  }

  const entries = Object.entries(item);
  const primitives = entries.filter(([, v]) => typeof v !== 'object' || v === null);
  const subArrays = entries.filter(([, v]) => Array.isArray(v) && v.length > 0);
  const subObjects = entries.filter(([, v]) => typeof v === 'object' && v !== null && !Array.isArray(v));

  const itemTitle = item.forecastTypeId || item.forecastId || item.itemId || item.metricId || item.id || item.code || item.name || `#${idx + 1}`;

  return `<div class="nested-item-card">
    <div class="nested-item-card-header">
      <span class="nested-item-badge">#${idx + 1}</span>
      <span class="nested-item-title">${escHtml(itemTitle)}</span>
    </div>
    <div class="nested-item-card-content">
      ${primitives.length ? `
        <div class="fields-list" style="margin-bottom:${subArrays.length || subObjects.length ? '10px' : '0'};">
          ${primitives.map(([k, v]) => `
            <div class="field-row">
              <span class="field-key" style="min-width:120px; max-width:120px;" title="${escHtml(k)}">${escHtml(fmtColHeader(k))}</span>
              <span class="field-val ${isIdOrCode(k) ? 'mono' : ''}">${renderPrimitiveVal(v, k)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${subObjects.map(([k, v]) => `
        <div style="background:var(--bg-surface-2); border:1px solid var(--border); border-radius:var(--r-sm); padding:8px 10px; margin-top:8px;">
          <div style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">${escHtml(fmtColHeader(k))}</div>
          <div class="fields-list">
            ${Object.entries(v).map(([subK, subV]) => `
              <div class="field-row">
                <span class="field-key" style="min-width:110px; max-width:110px;">${escHtml(fmtColHeader(subK))}</span>
                <span class="field-val ${isIdOrCode(subK) ? 'mono' : ''}">${renderPrimitiveVal(subV, subK)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}

      ${subArrays.map(([k, arr]) => renderSubArrayTable(k, arr)).join('')}
    </div>
  </div>`;
}

function renderComplexCard(key, val) {
  const isArr = Array.isArray(val);
  const label = fmtColHeader(key);

  if (isArr) {
    if (val.length === 0) {
      return `<div class="nested-card">
        <div class="nested-card-header">
          <span class="nested-card-title">${escHtml(label)}</span>
          <span class="badge badge-neutral">0 items</span>
        </div>
        <div style="padding:10px 14px; font-size:12px;" class="text-muted">Empty array []</div>
      </div>`;
    }

    if (typeof val[0] !== 'object' || val[0] === null) {
      return `<div class="nested-card">
        <div class="nested-card-header">
          <span class="nested-card-title">${escHtml(label)}</span>
          <span class="badge badge-blue">${val.length} items</span>
        </div>
        <div style="padding:10px 14px; display:flex; flex-wrap:wrap; gap:6px;">
          ${val.map(item => `<span class="badge badge-neutral">${escHtml(String(item))}</span>`).join('')}
        </div>
      </div>`;
    }

    return `<div class="nested-card">
      <div class="nested-card-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="nested-card-title">${escHtml(label)}</span>
          <span class="badge badge-blue">${val.length} ${val.length === 1 ? 'record' : 'records'}</span>
        </div>
      </div>
      <div style="padding:12px; display:flex; flex-direction:column; gap:10px;">
        ${val.map((item, idx) => renderNestedObjectItem(item, idx, key)).join('')}
      </div>
    </div>`;
  }

  const objEntries = Object.entries(val);
  if (!objEntries.length) {
    return `<div class="nested-card">
      <div class="nested-card-header">
        <span class="nested-card-title">${escHtml(label)}</span>
        <span class="badge badge-neutral">Empty</span>
      </div>
      <div style="padding:10px 14px; font-size:12px;" class="text-muted">Empty object {}</div>
    </div>`;
  }

  return `<div class="nested-card">
    <div class="nested-card-header">
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="nested-card-title">${escHtml(label)}</span>
        <span class="badge badge-neutral">Object</span>
      </div>
    </div>
    <div style="padding:10px 14px;">
      <div class="fields-list">
        ${objEntries.map(([k, v]) => `
          <div class="field-row">
            <span class="field-key" title="${escHtml(k)}">${escHtml(fmtColHeader(k))}</span>
            <span class="field-val ${isIdOrCode(k) ? 'mono' : ''}">${typeof v === 'object' && v !== null ? `<code style="font-size:11px">${escHtml(JSON.stringify(v))}</code>` : renderPrimitiveVal(v, k)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </div>`;
}

function buildRecordDetailHtml(record, contextTitle = 'Record Detail') {
  if (!record || typeof record !== 'object') {
    return `<div class="empty-state"><div class="empty-state-title">No data</div></div>`;
  }

  const entries = Object.entries(record).filter(([k]) => k !== 'rawJson' && k !== 'raw_json');
  const primitives = entries.filter(([, v]) => typeof v !== 'object' || v === null);
  const complex = entries.filter(([, v]) => typeof v === 'object' && v !== null);

  let html = '';

  if (primitives.length) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Scalar Fields (${primitives.length})</div>
      <div class="fields-list">
        ${primitives.map(([k, v]) => `
          <div class="field-row">
            <span class="field-key" title="${escHtml(k)}">${escHtml(fmtColHeader(k))}</span>
            <span class="field-val ${isIdOrCode(k) ? 'mono' : ''}">${renderPrimitiveVal(v, k)}</span>
          </div>
        `).join('')}
      </div>
    </div>`;
  }

  if (complex.length) {
    html += `<div class="drawer-section">
      <div class="drawer-section-title">Nested Structures & Collections (${complex.length})</div>
      <div class="nested-cards-container">
        ${complex.map(([k, v]) => renderComplexCard(k, v)).join('')}
      </div>
    </div>`;
  }

  const jsonStr = JSON.stringify(record, null, 2);
  html += `<div class="drawer-section">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <div class="drawer-section-title" style="margin-bottom:0">Raw JSON Payload</div>
      <button class="copy-btn-sm" onclick="copyToClipboard(${JSON.stringify(JSON.stringify(record))}, this)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        Copy JSON
      </button>
    </div>
    <pre class="json-pre">${escHtml(jsonStr)}</pre>
  </div>`;

  return html;
}

// ── Navigation ───────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  bills: 'Bills',
  services: 'Services',
  explorer: 'Data Explorer',
  synclogs: 'Sync Logs',
  setup: 'Service Setup',
  schema: 'Schema & Models',
  dbstatus: 'Database Status',
  apiref: 'API Reference',
};

function navigate(page, serviceId = null) {
  // Hide all view panes
  document.querySelectorAll('.view-pane').forEach(p => p.classList.remove('active'));
  // Deactivate all nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  if (page === 'service' && serviceId) {
    App.currentPage = 'service';
    App.currentServiceId = serviceId;
    document.getElementById('view-service-dashboard')?.classList.add('active');
    document.getElementById(`nav-svc-${serviceId}`)?.classList.add('active');
    safeText(document.getElementById('currentCrumb'), serviceId);
    openServiceDashboard(serviceId);
  } else {
    App.currentPage = page;
    App.currentServiceId = null;
    document.getElementById(`view-${page}`)?.classList.add('active');
    document.getElementById(`nav-${page}`)?.classList.add('active');
    safeText(document.getElementById('currentCrumb'), PAGE_TITLES[page] || page);
    onPageActivate(page);
  }

  document.getElementById('sidebar')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onPageActivate(page) {
  switch (page) {
    case 'dashboard': loadDashboard(); break;
    case 'bills':     loadBills(); break;
    case 'services':  loadServices(); break;
    case 'explorer':  populateExplorerSelect(); break;
    case 'synclogs':  loadSyncLogs(); populateSyncSelect(); break;
    case 'schema':    loadSchemaPage(); break;
    case 'dbstatus':  loadDbStatus(); break;
    // setup, apiref: static content, no async needed
  }
}

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
  document.getElementById('topbarRefreshBtn')?.addEventListener('click', () => {
    onPageActivate(App.currentPage);
    if (App.currentPage === 'service' && App.currentServiceId) openServiceDashboard(App.currentServiceId, true);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal('modalAddService'); closeModal('modalDeleteConfirm'); closeDrawer(); }
  });

  // Setup form -> live command preview
  ['setupServiceId','setupEndpoint'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateCmdPreview);
  });

  await loadInitialData();
  navigate('dashboard');
});

async function loadInitialData() {
  try {
    const [services, stats] = await Promise.all([
      API.getServices().catch(() => []),
      API.getStats().catch(() => null),
    ]);
    App.services = Array.isArray(services) ? services : [];
    App.stats = stats;
    renderSidebarServices();
    updateSidebarBadges();
    updateDbStatusIndicator();
  } catch (e) {
    console.error('Init error:', e);
  }
}

function updateSidebarBadges() {
  safeText(document.getElementById('sidebarServiceCount'), App.services.length);
}

function updateDbStatusIndicator() {
  const engine = App.stats?.dbEngine || null;
  const dot1 = document.getElementById('dbDot');
  const dot2 = document.getElementById('topbarDot');
  const nameEl = document.getElementById('dbNameText');
  const typeEl = document.getElementById('dbTypeText');
  const connTxt = document.getElementById('topbarConnText');

  if (engine) {
    const isPg = engine.toLowerCase().includes('postgresql') || engine.toLowerCase().includes('neon');
    const cls = isPg ? 'online' : 'unknown';
    [dot1, dot2].forEach(d => { if (d) { d.className = `status-dot ${cls}`; } });
    const short = isPg ? 'PostgreSQL' : (engine.includes('H2') ? 'H2 Embedded' : engine);
    safeText(nameEl, short);
    safeText(typeEl, isPg ? 'Cloud / Local DB' : 'Embedded Fallback');
    safeText(connTxt, short);
  } else {
    safeText(nameEl, 'Not connected');
    safeText(typeEl, 'Database');
    safeText(connTxt, 'Unavailable');
  }
}

function renderSidebarServices() {
  const nav = document.getElementById('dynamicServicesNav');
  const group = document.getElementById('dynamicServicesGroup');
  if (!nav || !group) return;
  if (!App.services.length) { group.style.display = 'none'; return; }
  group.style.display = '';
  nav.innerHTML = App.services.map(s => {
    const count = Number(s.recordCount || 0);
    return `
      <button class="nav-item" id="nav-svc-${escHtml(s.serviceId)}" onclick="navigate('service','${escHtml(s.serviceId)}')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        <span>${escHtml(s.displayName || s.serviceId)}</span>
        <span class="nav-badge">${count > 0 ? count.toLocaleString() : '0'}</span>
      </button>`;
  }).join('');
}

// ── DASHBOARD ────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [services, stats, logs] = await Promise.all([
      API.getServices().catch(() => App.services),
      API.getStats().catch(() => App.stats),
      API.getFetchLog().catch(() => []),
    ]);
    App.services = Array.isArray(services) ? services : App.services;
    App.stats = stats;
    renderSidebarServices();
    updateSidebarBadges();
    updateDbStatusIndicator();
    renderDashKpis();
    renderDashCharts();
    renderDashServices();
    renderDashSyncActivity(Array.isArray(logs) ? logs : []);
  } catch (e) {
    showToast('Dashboard load error: ' + e.message, 'error');
  }
}

function renderDashKpis() {
  const s = App.stats;
  const grid = document.getElementById('dashKpiGrid');
  if (!grid) return;
  const totalBills = s?.totalBills ?? '—';
  const totalServices = App.services.length;
  const totalRecords = App.services.reduce((a, sv) => a + Number(sv.recordCount || 0), 0);
  const lastSync = s?.lastSync;
  const lastSyncTime = lastSync ? fmtTimeAgo(lastSync.at) : 'Never';
  const lastSyncStatus = lastSync ? lastSync.status : 'No data';

  grid.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-icon blue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Total Bills</span>
        <span class="kpi-value">${totalBills !== '—' ? Number(totalBills).toLocaleString() : '—'}</span>
        <span class="kpi-caption">Stored billing records</span>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon blue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"></path></svg>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Registered Services</span>
        <span class="kpi-value">${totalServices}</span>
        <span class="kpi-caption">Dynamic POJO registries</span>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon green">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Total Stored Records</span>
        <span class="kpi-value">${totalRecords.toLocaleString()}</span>
        <span class="kpi-caption">Across all service tables</span>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon ${lastSync ? (lastSync.status === 'SUCCESS' ? 'green' : 'amber') : 'neutral'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </div>
      <div class="kpi-body">
        <span class="kpi-label">Last Synchronization</span>
        <span class="kpi-value" style="font-size:18px">${lastSyncTime}</span>
        <span class="kpi-caption">${escHtml(lastSyncStatus)}${lastSync ? ' · ' + Number(lastSync.count||0) + ' records' : ''}</span>
      </div>
    </div>
  `;

  // Update hero
  safeText(document.getElementById('heroServices'), totalServices);
  safeText(document.getElementById('heroRecords'), totalRecords.toLocaleString());
  safeText(document.getElementById('heroDb'), App.stats?.dbEngine || 'Unknown DB');
}

function renderDashCharts() {
  // Destroy existing
  if (App.dashCharts.status) { App.dashCharts.status.destroy(); App.dashCharts.status = null; }
  if (App.dashCharts.volume) { App.dashCharts.volume.destroy(); App.dashCharts.volume = null; }

  const COLORS = ['#0F62FE','#16803C','#B7791F','#D92D20','#667085','#6366f1','#10b981'];

  // Chart 1: Bill status distribution
  const ctx1 = document.getElementById('chartBillStatus')?.getContext('2d');
  if (ctx1) {
    const byStatus = App.stats?.byStatus || {};
    const labels = Object.keys(byStatus);
    const values = Object.values(byStatus);
    if (labels.length) {
      App.dashCharts.status = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data: values, backgroundColor: COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { color: '#697586', font: { family: 'Inter', size: 11 }, padding: 12 } },
            tooltip: { backgroundColor: '#172033', titleColor: '#fff', bodyColor: '#697586', padding: 10 }
          }
        }
      });
    } else {
      ctx1.canvas.parentElement.innerHTML = '<div class="chart-empty"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg><div>No billing data yet</div><div class="text-sm text-muted">Sync bills to see distribution</div></div>';
    }
  }

  // Chart 2: Service volumes
  const ctx2 = document.getElementById('chartServiceVolume')?.getContext('2d');
  if (ctx2 && App.services.length) {
    const labels = App.services.map(s => s.displayName || s.serviceId);
    const data = App.services.map(s => Number(s.recordCount || 0));
    App.dashCharts.volume = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Records', data, backgroundColor: COLORS.slice(0, data.length), borderRadius: 5, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: data.length > 3 ? 'y' : 'x',
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#172033', titleColor: '#fff', bodyColor: '#697586', padding: 10 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#697586', font: { size: 11 } } },
          y: { beginAtZero: true, grid: { color: '#E4E8EF' }, ticks: { color: '#697586', font: { size: 11 } } }
        }
      }
    });
  }
}

function renderDashServices() {
  const el = document.getElementById('dashServicesGrid');
  if (!el) return;
  if (!App.services.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"></circle><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"></path></svg></div><div class="empty-state-title">No Services Registered</div><div class="empty-state-desc">Register a SAP service to begin ingesting and exploring data.</div><button class="btn btn-primary" style="margin-top:12px" onclick="openAddServiceModal()">Register First Service</button></div>`;
    return;
  }
  el.innerHTML = `<div class="services-grid">${App.services.map(s => `
    <div class="service-card" onclick="navigate('service','${escHtml(s.serviceId)}')">
      <div class="service-card-top">
        <span class="service-id-badge">${escHtml(s.serviceId)}</span>
        <span class="service-count">${Number(s.recordCount||0).toLocaleString()} records</span>
      </div>
      <div class="service-card-name">${escHtml(s.displayName || s.serviceId)}</div>
      <div class="service-card-desc">${escHtml(s.description || 'SAP service data')}</div>
      <div class="service-card-footer"><span>Explore records</span><span>→</span></div>
    </div>`).join('')}</div>`;
}

function renderDashSyncActivity(logs) {
  const el = document.getElementById('dashSyncActivity');
  if (!el) return;
  if (!logs.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg></div><div class="empty-state-title">No Sync Activity</div><div class="empty-state-desc">Synchronize a service to see the audit trail here.</div></div>`;
    return;
  }
  el.innerHTML = logs.slice(0, 8).map(l => `
    <div class="activity-row">
      <span class="activity-time">${escHtml(fmtTimeAgo(l.fetchedAt))}</span>
      <span class="badge ${l.status === 'SUCCESS' ? 'badge-success' : 'badge-error'}" style="margin-right:8px">${escHtml(l.status)}</span>
      <span class="activity-msg">${escHtml(l.message || '—')}</span>
      <span class="activity-count">${Number(l.billCount||0).toLocaleString()}</span>
    </div>`).join('');
}

// ── BILLS ────────────────────────────────────────────────────────
let billsSearchTimer = null;

async function loadBills(force = false) {
  const status = document.getElementById('billsFilterStatus')?.value || '';
  const type   = document.getElementById('billsFilterType')?.value || '';
  const currency = document.getElementById('billsFilterCurrency')?.value || '';

  const container = document.getElementById('billsTableContainer');
  if (container) container.innerHTML = '<div class="spinner-center"><div class="spinner spinner-lg"></div></div>';

  try {
    const params = {};
    if (status) params.status = status;
    if (type) params.type = type;
    if (currency) params.currency = currency;

    const data = await API.getBills(params);
    App.billsData = Array.isArray(data) ? data : [];
    App.billsPage = 1;

    // Populate filter dropdowns from stats (only on first load)
    if (App.stats && force !== 'skipFilters') {
      populateBillsFilters();
    }
    renderBillsKpis();
    filterAndRenderBills();
  } catch (e) {
    if (container) container.innerHTML = `<div class="error-state"><div class="error-title">Failed to load bills</div><div class="error-desc">${escHtml(e.message)}</div><button class="btn btn-secondary" style="margin-top:12px" onclick="loadBills()">Retry</button></div>`;
  }
}

function populateBillsFilters() {
  const s = App.stats;
  if (!s) return;

  const statusSel = document.getElementById('billsFilterStatus');
  if (statusSel && statusSel.options.length <= 1 && s.byStatus) {
    Object.keys(s.byStatus).forEach(v => {
      if (v) statusSel.add(new Option(v, v));
    });
  }
  const typeSel = document.getElementById('billsFilterType');
  if (typeSel && typeSel.options.length <= 1 && s.byType) {
    Object.keys(s.byType).forEach(v => {
      if (v) typeSel.add(new Option(v, v));
    });
  }
  const currSel = document.getElementById('billsFilterCurrency');
  if (currSel && currSel.options.length <= 1 && s.currencies) {
    s.currencies.forEach(v => { if (v) currSel.add(new Option(v, v)); });
  }
}

function renderBillsKpis() {
  const s = App.stats;
  safeText(document.getElementById('billsKpiTotal'), s ? Number(s.totalBills).toLocaleString() : App.billsData.length.toLocaleString());
  const statuses = s?.byStatus ? Object.keys(s.byStatus) : [];
  safeText(document.getElementById('billsKpiStatus'), statuses.length || '—');
  safeText(document.getElementById('billsKpiStatusCap'), statuses.slice(0,3).join(', ') || 'No data');
  safeText(document.getElementById('billsKpiCurrencies'), s?.currencies?.length || '—');
  safeText(document.getElementById('billsKpiCurrencyCap'), s?.currencies?.slice(0,4).join(', ') || '');
  const ls = s?.lastSync;
  safeText(document.getElementById('billsKpiLastSync'), ls ? fmtTimeAgo(ls.at) : 'Never');
  safeText(document.getElementById('billsKpiLastSyncCap'), ls ? `${ls.status} · ${ls.count} records` : 'No sync recorded');
}

function onBillsSearch() {
  clearTimeout(billsSearchTimer);
  billsSearchTimer = setTimeout(() => { App.billsPage = 1; filterAndRenderBills(); }, 250);
}

function filterAndRenderBills() {
  const q = (document.getElementById('billsSearch')?.value || '').toLowerCase();
  App.billsFiltered = q
    ? App.billsData.filter(r => Object.values(r).some(v => v != null && String(v).toLowerCase().includes(q)))
    : App.billsData;
  renderBillsTable();
}

function clearBillsFilters() {
  ['billsFilterStatus','billsFilterType','billsFilterCurrency'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const si = document.getElementById('billsSearch');
  if (si) si.value = '';
  App.billsPage = 1;
  loadBills();
}

const BILLS_COLS = ['id','documentNumber','billStatus','billingType','currency','netAmount','grossAmount','billingDate','dueDate'];

function renderBillsTable() {
  const container = document.getElementById('billsTableContainer');
  if (!container) return;
  const data = App.billsFiltered;

  safeText(document.getElementById('billsTableMeta'), `${data.length} of ${App.billsData.length} records`);

  if (!data.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg></div><div class="empty-state-title">${App.billsData.length ? 'No matching records' : 'No bills stored'}</div><div class="empty-state-desc">${App.billsData.length ? 'Adjust your filters.' : 'Sync bills from SAP to populate this table.'}</div>${!App.billsData.length ? '<button class="btn btn-primary" style="margin-top:12px" onclick="syncService(\'bills\',this)">Sync Bills</button>' : ''}</div>`;
    document.getElementById('billsPagination').style.display = 'none';
    return;
  }

  const sample = data[0] || {};
  const cols = BILLS_COLS.filter(c => c in sample);
  if (!cols.length) cols.push(...Object.keys(sample).slice(0, 6));

  const totalPages = Math.ceil(data.length / App.billsPageSize) || 1;
  if (App.billsPage > totalPages) App.billsPage = totalPages;
  const start = (App.billsPage - 1) * App.billsPageSize;
  const rows = data.slice(start, start + App.billsPageSize);

  container.innerHTML = `<table class="data-table">
    <thead><tr>${cols.map(c => `<th>${fmtColHeader(c)}</th>`).join('')}<th class="col-actions">—</th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr>${cols.map(c => `<td class="${c==='id'?'mono':''}">${fmt(r[c],c)}</td>`).join('')}<td class="col-actions"><button class="btn-inspect" onclick="openBillDetail(${start+i})">View</button></td></tr>`).join('')}</tbody>
  </table>`;

  renderBillsPagination(data.length, totalPages);
}

function renderBillsPagination(total, totalPages) {
  const pag = document.getElementById('billsPagination');
  pag.style.display = totalPages <= 1 ? 'none' : 'flex';
  if (totalPages <= 1) return;
  safeText(document.getElementById('billsPageInfo'), `Page ${App.billsPage} of ${totalPages} (${total} total)`);
  const btns = document.getElementById('billsPageBtns');
  btns.innerHTML = '';
  const addBtn = (label, page, active = false) => {
    const b = document.createElement('button');
    b.className = `page-btn${active ? ' active' : ''}`;
    b.textContent = label;
    if (!active) b.onclick = () => { App.billsPage = page; renderBillsTable(); };
    btns.appendChild(b);
  };
  if (App.billsPage > 1) addBtn('←', App.billsPage - 1);
  for (let i = Math.max(1, App.billsPage - 2); i <= Math.min(totalPages, App.billsPage + 2); i++) addBtn(i, i, i === App.billsPage);
  if (App.billsPage < totalPages) addBtn('→', App.billsPage + 1);
}

async function openBillDetail(idx) {
  const record = App.billsFiltered[idx];
  if (!record) return;
  const id = record.id;

  // Try to fetch full detail; fall back to what we have
  let detail = record;
  if (id) {
    try { detail = await API.getBillById(id); } catch {}
  }

  const html = buildRecordDetailHtml(detail, 'Bill Record');
  openDrawer(id || `Bill #${idx + 1}`, `bill_status: ${detail.billStatus || '—'} · currency: ${detail.currency || '—'}`, html);
}

// ── SERVICES ─────────────────────────────────────────────────────
async function loadServices() {
  const c = document.getElementById('servicesTableContainer');
  if (c) c.innerHTML = '<div class="spinner-center"><div class="spinner spinner-lg"></div></div>';
  try {
    const services = await API.getServices();
    App.services = Array.isArray(services) ? services : [];
    renderSidebarServices();
    updateSidebarBadges();
    renderServicesTable();
  } catch (e) {
    if (c) c.innerHTML = `<div class="error-state"><div class="error-title">Failed to load services</div><div class="error-desc">${escHtml(e.message)}</div><button class="btn btn-secondary" style="margin-top:12px" onclick="loadServices()">Retry</button></div>`;
  }
}

function renderServicesTable() {
  const c = document.getElementById('servicesTableContainer');
  if (!c) return;
  const q = (document.getElementById('servicesSearch')?.value || '').toLowerCase();
  const data = q
    ? App.services.filter(s => [s.serviceId, s.displayName, s.description, s.tableName].some(f => f && f.toLowerCase().includes(q)))
    : App.services;

  safeText(document.getElementById('servicesTableMeta'), `${data.length} services`);

  if (!data.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"></circle></svg></div><div class="empty-state-title">${App.services.length ? 'No matching services' : 'No services registered'}</div><button class="btn btn-primary" style="margin-top:12px" onclick="openAddServiceModal()">Register Service</button></div>`;
    return;
  }

  c.innerHTML = `<table class="data-table">
    <thead><tr><th>Service ID</th><th>Display Name</th><th>Records</th><th>Table</th><th>Description</th><th class="col-actions">Actions</th></tr></thead>
    <tbody>${data.map(s => `<tr>
      <td><span class="badge badge-blue">${escHtml(s.serviceId)}</span></td>
      <td>${escHtml(s.displayName || '—')}</td>
      <td><strong>${Number(s.recordCount||0).toLocaleString()}</strong></td>
      <td class="mono text-muted">${escHtml(s.tableName || '—')}</td>
      <td class="muted">${escHtml((s.description || '').slice(0,60))}${(s.description||'').length>60?'…':''}</td>
      <td class="col-actions" style="width:120px;text-align:right">
        <button class="btn-inspect" onclick="navigate('service','${escHtml(s.serviceId)}')">Explore</button>
      </td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

// ── DATA EXPLORER ─────────────────────────────────────────────────
function populateExplorerSelect() {
  const sel = document.getElementById('explorerService');
  if (!sel) return;
  // Clear and repopulate
  while (sel.options.length > 1) sel.remove(1);
  App.services.forEach(s => sel.add(new Option(s.displayName || s.serviceId, s.serviceId)));
}

async function loadExplorerData() {
  const sel = document.getElementById('explorerService');
  const serviceId = sel?.value;
  if (!serviceId) return;

  const c = document.getElementById('explorerContent');
  if (c) c.innerHTML = '<div class="spinner-center"><div class="spinner spinner-lg"></div></div>';

  try {
    const data = await API.getServiceData(serviceId);
    App.explorerData = Array.isArray(data) ? data : [];
    App.explorerFiltered = App.explorerData;
    renderExplorerContent();
  } catch (e) {
    if (c) c.innerHTML = `<div class="error-state"><div class="error-title">Failed to load data</div><div class="error-desc">${escHtml(e.message)}</div></div>`;
  }
}

function renderExplorerTable() {
  const q = (document.getElementById('explorerSearch')?.value || '').toLowerCase();
  App.explorerFiltered = q
    ? App.explorerData.filter(r => Object.values(r).some(v => v != null && JSON.stringify(v).toLowerCase().includes(q)))
    : App.explorerData;
  renderExplorerContent();
}

function setExplorerView(mode) {
  App.explorerView = mode;
  document.getElementById('explorerViewTable')?.classList.toggle('active', mode === 'table');
  document.getElementById('explorerViewJson')?.classList.toggle('active', mode === 'json');
  renderExplorerContent();
}

function renderExplorerContent() {
  const c = document.getElementById('explorerContent');
  if (!c) return;
  const data = App.explorerFiltered;
  safeText(document.getElementById('explorerMeta'), `${data.length} of ${App.explorerData.length} records`);

  if (!data.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"></circle></svg></div><div class="empty-state-title">${App.explorerData.length ? 'No matching records' : 'No records stored'}</div></div>`;
    return;
  }

  if (App.explorerView === 'json') {
    const jsonStr = JSON.stringify(data, null, 2);
    c.innerHTML = `<div style="padding:16px"><button class="copy-btn-sm" onclick="copyToClipboard(${JSON.stringify(JSON.stringify(data))}, this)">Copy JSON (${data.length} records)</button><pre class="json-pre">${escHtml(jsonStr.slice(0, 50000))}${jsonStr.length > 50000 ? '\n… (truncated)' : ''}</pre></div>`;
    return;
  }

  // Discover columns from first few records
  const keySet = new Set();
  data.slice(0, 10).forEach(r => Object.keys(r).forEach(k => keySet.add(k)));
  const allKeys = [...keySet].filter(k => k !== 'rawJson');
  const prioritized = ['id','documentNumber','subscriptionId','billStatus','status','currency','amount','grossAmount','netAmount','billingDate','createdAt','validFrom'];
  const cols = [...prioritized.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !prioritized.includes(k) && typeof data[0]?.[k] !== 'object')].slice(0, 7);

  c.innerHTML = `<div class="table-container"><table class="data-table">
    <thead><tr>${cols.map(c => `<th>${fmtColHeader(c)}</th>`).join('')}<th class="col-actions">—</th></tr></thead>
    <tbody>${data.slice(0, 200).map((r, i) => `<tr>${cols.map(col => `<td class="${col==='id'?'mono':''}">${fmt(r[col],col)}</td>`).join('')}<td class="col-actions"><button class="btn-inspect" onclick="openExplorerDetail(${i})">View</button></td></tr>`).join('')}</tbody>
  </table>${data.length > 200 ? `<div style="padding:10px 16px;font-size:12px;color:var(--text-muted)">Showing first 200 of ${data.length} records. Use search to narrow results.</div>` : ''}</div>`;
}

function openExplorerDetail(idx) {
  const r = (App.explorerFiltered && App.explorerFiltered[idx]) || App.explorerData[idx];
  if (!r) return;
  const id = r.id || r.documentNumber || `Record #${idx+1}`;
  const html = buildRecordDetailHtml(r, 'Data Explorer Record');
  openDrawer(String(id), 'Record detail', html);
}

// ── SYNC LOGS ────────────────────────────────────────────────────
async function loadSyncLogs() {
  const c = document.getElementById('syncLogsContainer');
  if (c) c.innerHTML = '<div class="spinner-center"><div class="spinner spinner-lg"></div></div>';
  try {
    const logs = await API.getFetchLog();
    renderSyncLogs(Array.isArray(logs) ? logs : []);
  } catch (e) {
    if (c) c.innerHTML = `<div class="error-state"><div class="error-title">Failed to load logs</div><div class="error-desc">${escHtml(e.message)}</div><button class="btn btn-secondary" style="margin-top:12px" onclick="loadSyncLogs()">Retry</button></div>`;
  }
}

function renderSyncLogs(logs) {
  const c = document.getElementById('syncLogsContainer');
  if (!c) return;
  if (!logs.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline></svg></div><div class="empty-state-title">No sync logs recorded</div><div class="empty-state-desc">Trigger a synchronization to see the audit trail.</div></div>`;
    return;
  }
  c.innerHTML = `<div class="table-container"><table class="data-table">
    <thead><tr><th>Timestamp</th><th>Status</th><th>Records</th><th>Message</th></tr></thead>
    <tbody>${logs.map(l => `<tr>
      <td class="mono text-muted" style="white-space:nowrap">${escHtml(fmtTimestamp(l.fetchedAt))}</td>
      <td><span class="badge ${l.status==='SUCCESS'?'badge-success':'badge-error'}">${escHtml(l.status||'—')}</span></td>
      <td><strong>${Number(l.billCount||0).toLocaleString()}</strong></td>
      <td class="muted">${escHtml(l.message||'—')}</td>
    </tr>`).join('')}
    </tbody>
  </table></div>`;
}

function populateSyncSelect() {
  const sel = document.getElementById('syncServiceSelect');
  if (!sel) return;
  while (sel.options.length > 1) sel.remove(1);
  App.services.forEach(s => sel.add(new Option(s.displayName || s.serviceId, s.serviceId)));
}

async function handleSyncTrigger() {
  const sel = document.getElementById('syncServiceSelect');
  const id = sel?.value;
  if (!id) { showToast('Please select a service to sync.', 'warning'); return; }
  await syncService(id, document.getElementById('syncTriggerBtn'));
  loadSyncLogs();
}

async function handleSyncAll() {
  const btn = document.getElementById('syncAllBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px"></div> Syncing…'; }
  try {
    for (const s of App.services) {
      await API.syncService(s.serviceId).catch(e => console.warn('Sync warn:', s.serviceId, e.message));
    }
    showToast('All services synchronized.', 'success');
    await loadInitialData();
    loadSyncLogs();
  } catch (e) {
    showToast('Sync all error: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Sync All'; }
  }
}

// ── SERVICE SYNC (generic) ────────────────────────────────────────
async function syncService(serviceId, btn) {
  if (App._syncInProgress.has(serviceId)) return;
  App._syncInProgress.add(serviceId);
  const orig = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></div>Syncing…'; }
  try {
    const res = await API.syncService(serviceId);
    showToast(res.message || `Sync complete: ${res.count ?? 0} records.`, 'success');
    await loadInitialData();
    if (App.currentPage === 'dashboard') loadDashboard();
    if (App.currentPage === 'bills' || serviceId === 'bills') loadBills();
    if (App.currentPage === 'service' && App.currentServiceId === serviceId) openServiceDashboard(serviceId, true);
  } catch (e) {
    showToast('Sync failed: ' + e.message, 'error');
  } finally {
    App._syncInProgress.delete(serviceId);
    if (btn) { btn.disabled = false; btn.innerHTML = orig; }
  }
}

// ── SERVICE DASHBOARD ────────────────────────────────────────────
async function openServiceDashboard(serviceId, forceRefresh = false) {
  const desc = App.services.find(s => s.serviceId === serviceId) || { serviceId, displayName: serviceId, tableName: serviceId, description: '' };

  safeText(document.getElementById('svcDashBadge'), serviceId.toUpperCase());
  safeText(document.getElementById('svcDashTitle'), desc.displayName || serviceId);
  safeText(document.getElementById('svcDashDesc'), desc.description || `Synchronized SAP data for ${serviceId}`);
  safeText(document.getElementById('svcDashTable'), desc.tableName || serviceId);

  const ep = document.getElementById('svcDashEndpointLink');
  if (ep) { ep.href = desc.defaultEndpoint || '#'; ep.style.display = desc.defaultEndpoint ? '' : 'none'; }

  const del = document.getElementById('svcDashDeleteBtn');
  if (del) del.style.display = serviceId === 'bills' ? 'none' : '';

  const tc = document.getElementById('svcTableContainer');
  if (tc) tc.innerHTML = '<div class="spinner-center"><div class="spinner spinner-lg"></div></div>';

  try {
    const data = await API.getServiceData(serviceId);
    App.svcData = Array.isArray(data) ? data : [];
    App.svcPage = 1;
    safeText(document.getElementById('svcDashRecords'), `${App.svcData.length.toLocaleString()} records`);
    renderSvcKpis(desc);
    renderSvcCharts(desc);
    renderSvcTable();
  } catch (e) {
    if (tc) tc.innerHTML = `<div class="error-state"><div class="error-title">Failed to load data</div><div class="error-desc">${escHtml(e.message)}</div><button class="btn btn-secondary" style="margin-top:12px" onclick="openServiceDashboard('${escHtml(serviceId)}',true)">Retry</button></div>`;
  }
}

function renderSvcKpis(desc) {
  const g = document.getElementById('svcKpiGrid');
  if (!g) return;
  const data = App.svcData;
  const statuses = {};
  const currencies = {};
  let totalGross = 0;
  data.forEach(r => {
    const st = r.billStatus || r.status || r.state || r.lifecycleStatus || 'Active';
    statuses[st] = (statuses[st]||0)+1;
    const cur = r.currency || r.grossCurrency;
    if (cur) currencies[cur] = (currencies[cur]||0)+1;
    const g = Number(r.grossAmount || r.netAmount || r.amount || 0);
    if (!isNaN(g)) totalGross += g;
  });
  const topStatus = Object.entries(statuses).sort(([,a],[,b]) => b-a)[0];
  const COLORS = { c1:'blue', c2:'green', c3:'amber', c4:'neutral' };

  g.innerHTML = `
    <div class="kpi-card"><div class="kpi-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg></div><div class="kpi-body"><span class="kpi-label">Total Records</span><span class="kpi-value">${data.length.toLocaleString()}</span><span class="kpi-caption">In ${escHtml(desc.tableName||desc.serviceId)}</span></div></div>
    <div class="kpi-card"><div class="kpi-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></div><div class="kpi-body"><span class="kpi-label">${topStatus ? escHtml(topStatus[0]) : 'Status'}</span><span class="kpi-value">${topStatus ? topStatus[1].toLocaleString() : '—'}</span><span class="kpi-caption">Primary status</span></div></div>
    <div class="kpi-card"><div class="kpi-icon amber"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg></div><div class="kpi-body"><span class="kpi-label">Currencies</span><span class="kpi-value">${Object.keys(currencies).length || '—'}</span><span class="kpi-caption">${Object.keys(currencies).slice(0,3).join(', ')||'No currency data'}</span></div></div>
    <div class="kpi-card"><div class="kpi-icon neutral"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div><div class="kpi-body"><span class="kpi-label">${totalGross > 0 ? 'Gross Total' : 'Records'}</span><span class="kpi-value" style="font-size:${totalGross>0?'18px':'26px'}">${totalGross > 0 ? totalGross.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}) : data.length.toLocaleString()}</span><span class="kpi-caption">${totalGross > 0 ? 'Aggregated volume' : 'Total stored'}</span></div></div>
  `;
}

function renderSvcCharts(desc) {
  if (App.svcCharts.c1) { App.svcCharts.c1.destroy(); App.svcCharts.c1 = null; }
  if (App.svcCharts.c2) { App.svcCharts.c2.destroy(); App.svcCharts.c2 = null; }

  const data = App.svcData;
  if (!data.length) return;

  const COLORS = ['#0F62FE','#16803C','#B7791F','#D92D20','#667085','#6366f1'];

  // Chart 1: Status distribution doughnut
  const statusMap = {};
  data.forEach(r => { const s = r.billStatus||r.status||r.state||r.lifecycleStatus||'Active'; statusMap[s]=(statusMap[s]||0)+1; });
  const ctx1 = document.getElementById('svcChart1')?.getContext('2d');
  if (ctx1 && Object.keys(statusMap).length) {
    App.svcCharts.c1 = new Chart(ctx1, {
      type: 'doughnut',
      data: { labels: Object.keys(statusMap), datasets: [{ data: Object.values(statusMap), backgroundColor: COLORS.slice(0, Object.keys(statusMap).length), borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { color: '#697586', font: { family: 'Inter', size: 11 }, padding: 12 } }, tooltip: { backgroundColor: '#172033', titleColor: '#fff', bodyColor: '#697586', padding: 10, callbacks: { label(ctx) { const t = Object.values(statusMap).reduce((a,b)=>a+b,0); return ` ${ctx.label}: ${ctx.raw} (${((ctx.raw/t)*100).toFixed(1)}%)`; } } } } }
    });
  }

  // Chart 2: Secondary attribute bar
  const secMap = {};
  data.forEach(r => { const v = r.billingType||r.currency||r.marketId||r.customerType||r.templateType||'Standard'; secMap[v]=(secMap[v]||0)+1; });
  const ctx2 = document.getElementById('svcChart2')?.getContext('2d');
  const secKeys = Object.keys(secMap).slice(0, 8);
  if (ctx2 && secKeys.length) {
    App.svcCharts.c2 = new Chart(ctx2, {
      type: 'bar',
      data: { labels: secKeys, datasets: [{ label: 'Count', data: secKeys.map(k=>secMap[k]), backgroundColor: '#0F62FE', hoverBackgroundColor: '#0353E9', borderRadius: 4, borderSkipped: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#172033', titleColor: '#fff', bodyColor: '#697586', padding: 10 } }, scales: { x: { grid: { display: false }, ticks: { color: '#697586', font: { size: 11 } } }, y: { beginAtZero: true, grid: { color: '#E4E8EF' }, ticks: { color: '#697586', font: { size: 11 } } } } }
    });
  }
}

function renderSvcTable() {
  const c = document.getElementById('svcTableContainer');
  if (!c) return;
  const q = (document.getElementById('svcSearch')?.value || '').toLowerCase();
  const filtered = q
    ? App.svcData.filter(r => Object.values(r).some(v => v != null && JSON.stringify(v).toLowerCase().includes(q)))
    : App.svcData;
  App.svcFiltered = filtered;

  safeText(document.getElementById('svcTableMeta'), `${filtered.length} of ${App.svcData.length}`);

  if (!filtered.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-state-title">${App.svcData.length ? 'No matches' : 'No records'}</div>${!App.svcData.length ? `<button class="btn btn-primary" style="margin-top:12px" onclick="handleSvcSync()">Sync Now</button>` : ''}</div>`;
    renderSvcPagination(0, 1);
    return;
  }

  const sample = filtered[0] || {};
  const allKeys = [...new Set(filtered.slice(0,5).flatMap(r => Object.keys(r)))].filter(k => k !== 'rawJson');
  const prio = ['id','documentNumber','subscriptionId','billStatus','status','currency','grossAmount','netAmount','billingDate'];
  const cols = [...prio.filter(k => allKeys.includes(k)), ...allKeys.filter(k => !prio.includes(k) && typeof sample[k] !== 'object')].slice(0, 6);

  const totalPages = Math.ceil(filtered.length / App.svcPageSize) || 1;
  if (App.svcPage > totalPages) App.svcPage = totalPages;
  const start = (App.svcPage - 1) * App.svcPageSize;
  const rows = filtered.slice(start, start + App.svcPageSize);

  c.innerHTML = `<table class="data-table">
    <thead><tr>${cols.map(c=>`<th>${fmtColHeader(c)}</th>`).join('')}<th class="col-actions">—</th></tr></thead>
    <tbody>${rows.map((r,i) => `<tr>${cols.map(col=>`<td class="${col==='id'?'mono':''}">${fmt(r[col],col)}</td>`).join('')}<td class="col-actions"><button class="btn-inspect" onclick="openSvcDetail(${start+i})">View</button></td></tr>`).join('')}</tbody>
  </table>`;

  renderSvcPagination(filtered.length, totalPages);

  // attach search
  document.getElementById('svcSearch')?.addEventListener('input', () => { App.svcPage = 1; renderSvcTable(); }, { once: false });
}

function openSvcDetail(idx) {
  const r = (App.svcFiltered && App.svcFiltered[idx]) || App.svcData[idx];
  if (!r) return;
  const id = r.id || r.documentNumber || `Record #${idx+1}`;
  const html = buildRecordDetailHtml(r, `${App.currentServiceId || 'Service'} Record`);
  openDrawer(String(id), `${App.currentServiceId || 'Service'} record detail`, html);
}

function renderSvcPagination(total, totalPages) {
  const pag = document.getElementById('svcPagination');
  if (pag) pag.style.display = totalPages <= 1 ? 'none' : 'flex';
  if (totalPages <= 1) return;
  safeText(document.getElementById('svcPageInfo'), `Page ${App.svcPage} of ${totalPages}`);
  const btns = document.getElementById('svcPageBtns');
  if (!btns) return;
  btns.innerHTML = '';
  const add = (label, p, active=false) => { const b=document.createElement('button'); b.className=`page-btn${active?' active':''}`; b.textContent=label; if(!active) b.onclick=()=>{App.svcPage=p;renderSvcTable();}; btns.appendChild(b); };
  if (App.svcPage>1) add('←',App.svcPage-1);
  for(let i=Math.max(1,App.svcPage-2);i<=Math.min(totalPages,App.svcPage+2);i++) add(i,i,i===App.svcPage);
  if(App.svcPage<totalPages) add('→',App.svcPage+1);
}

async function handleSvcSync() {
  await syncService(App.currentServiceId, document.getElementById('svcDashSyncBtn'));
}

function handleSvcDelete() {
  const id = App.currentServiceId;
  if (!id || id === 'bills') return;
  safeText(document.getElementById('deleteServiceNameLabel'), `"${id}"`);
  openModal('modalDeleteConfirm');
}

async function handleConfirmDelete() {
  const id = App.currentServiceId;
  if (!id || id === 'bills') return;
  const btn = document.getElementById('confirmDeleteBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Deleting…'; }
  try {
    const res = await API.deleteService(id);
    showToast(res.message || `Service "${id}" deleted.`, 'success');
    closeModal('modalDeleteConfirm');
    await loadInitialData();
    navigate('services');
  } catch (e) {
    showToast('Delete failed: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Yes, Delete'; }
  }
}

// ── ADD SERVICE MODAL ────────────────────────────────────────────
function openAddServiceModal() {
  document.getElementById('addServiceForm')?.reset();
  openModal('modalAddService');
}

function fillModalPreset(chip) {
  document.getElementById('modalServiceId').value = chip.dataset.id || '';
  document.getElementById('modalDisplayName').value = chip.dataset.name || '';
  document.getElementById('modalEndpoint').value = chip.dataset.url || '';
  document.getElementById('modalDescription').value = chip.dataset.desc || '';
}

async function handleAddServiceSubmit(e) {
  e.preventDefault();
  const payload = {
    serviceId:   document.getElementById('modalServiceId').value.trim(),
    displayName: document.getElementById('modalDisplayName').value.trim(),
    endpoint:    document.getElementById('modalEndpoint').value.trim(),
    description: document.getElementById('modalDescription').value.trim(),
    syncNow:     document.getElementById('modalSyncNow').checked,
  };
  const btn = document.getElementById('addServiceSubmitBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></div>Registering…';
  try {
    const res = await API.addService(payload);
    showToast(res.message || `Service "${payload.serviceId}" registered.`, 'success');
    closeModal('modalAddService');
    await loadInitialData();
    navigate('service', res.serviceId || payload.serviceId);
  } catch (e) {
    showToast('Registration failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

// ── SERVICE SETUP PAGE ────────────────────────────────────────────
function fillSetupPreset(chip) {
  document.getElementById('setupServiceId').value = chip.dataset.id || '';
  document.getElementById('setupDisplayName').value = chip.dataset.name || '';
  document.getElementById('setupEndpoint').value = chip.dataset.url || '';
  document.getElementById('setupDescription').value = chip.dataset.desc || '';
  updateCmdPreview();
}

function updateCmdPreview() {
  const id = document.getElementById('setupServiceId')?.value.trim() || '<service_name>';
  const url = document.getElementById('setupEndpoint')?.value.trim() || '<service_url>';
  const idEl = document.getElementById('cmdArgId');
  const urlEl = document.getElementById('cmdArgUrl');
  if (idEl) idEl.textContent = id;
  if (urlEl) urlEl.textContent = url;
}

function clearSetupForm() {
  document.getElementById('setupForm')?.reset();
  updateCmdPreview();
}

async function handleSetupSubmit(e) {
  e.preventDefault();
  const payload = {
    serviceId:   document.getElementById('setupServiceId').value.trim(),
    displayName: document.getElementById('setupDisplayName').value.trim(),
    endpoint:    document.getElementById('setupEndpoint').value.trim(),
    description: document.getElementById('setupDescription').value.trim(),
    syncNow:     document.getElementById('setupSyncNow').checked,
  };
  const btn = document.getElementById('setupSubmitBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:12px;height:12px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:6px"></div>Registering…';
  try {
    const res = await API.addService(payload);
    showToast(res.message || `Service "${payload.serviceId}" registered.`, 'success');
    await loadInitialData();
    navigate('service', res.serviceId || payload.serviceId);
  } catch (e) {
    showToast('Registration failed: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

function copyCommand() {
  const id = document.getElementById('setupServiceId')?.value.trim() || '<service_name>';
  const url = document.getElementById('setupEndpoint')?.value.trim() || '<service_url>';
  const cmd = `auto_service_setup.bat ${id} ${url}`;
  copyToClipboard(cmd, document.getElementById('copyCmdBtn'));
}

// ── SCHEMA PAGE ───────────────────────────────────────────────────
async function loadSchemaPage() {
  const c = document.getElementById('schemaServicesContainer');
  if (!c) return;
  if (!App.services.length) {
    try { const sv = await API.getServices(); App.services = Array.isArray(sv)?sv:[]; } catch {}
  }
  if (!App.services.length) {
    c.innerHTML = '<div class="empty-state"><div class="empty-state-title">No services registered</div></div>';
    return;
  }
  c.innerHTML = `<table class="data-table">
    <thead><tr><th>Service ID</th><th>Display Name</th><th>POJO Class</th><th>Database Table</th><th>Records</th></tr></thead>
    <tbody>${App.services.map(s=>`<tr>
      <td><span class="badge badge-blue">${escHtml(s.serviceId)}</span></td>
      <td>${escHtml(s.displayName||'—')}</td>
      <td class="mono text-muted" style="font-size:11px">${escHtml(s.pojoClass||'—')}</td>
      <td class="mono">${escHtml(s.tableName||'—')}</td>
      <td><strong>${Number(s.recordCount||0).toLocaleString()}</strong></td>
    </tr>`).join('')}
    </tbody>
  </table>`;
}

// ── DATABASE STATUS PAGE ──────────────────────────────────────────
async function loadDbStatus() {
  const el = document.getElementById('dbActiveInfo');
  if (!el) return;
  try {
    const stats = await API.getStats();
    App.stats = stats;
    updateDbStatusIndicator();
    const engine = stats.dbEngine || 'Unknown';
    const isPg = engine.toLowerCase().includes('postgresql') || engine.toLowerCase().includes('neon');
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="kpi-icon ${isPg?'blue':'amber'}" style="width:44px;height:44px">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;color:var(--text-primary)">${escHtml(engine)}</div>
          <div style="font-size:12px;color:var(--text-secondary)">${isPg ? 'Primary database — active and accepting connections' : 'Fallback embedded database'}</div>
        </div>
        <span class="badge ${isPg?'badge-success':'badge-warning'}" style="margin-left:auto">${isPg?'PostgreSQL Active':'H2 Fallback'}</span>
      </div>
      <div class="info-box ${isPg?'green':'amber'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <div class="info-box-content">${isPg ? `Connected to PostgreSQL. This information is derived from the <strong>/api/stats</strong> endpoint which returns the active engine name from <strong>DatabaseManager.getDbEngineName()</strong>.` : `Using H2 Embedded fallback. PostgreSQL was unavailable when the server started. Data is persisted to <strong>./data/sap_bills_db</strong>.`}</div>
      </div>`;
  } catch (e) {
    el.innerHTML = `<div class="error-state"><div class="error-title">Cannot determine database status</div><div class="error-desc">${escHtml(e.message)}</div><button class="btn btn-secondary" style="margin-top:12px" onclick="loadDbStatus()">Retry</button></div>`;
  }
}

// ── API REFERENCE ─────────────────────────────────────────────────
function toggleEndpoint(header) {
  const body = header.nextElementSibling;
  if (!body) return;
  body.style.display = body.style.display === 'none' ? '' : 'none';
}

// ── CLIPBOARD ────────────────────────────────────────────────────
async function copyToClipboard(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) { const orig = btn.innerHTML; btn.innerHTML = '✓ Copied'; btn.classList.add('copied'); setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000); }
  } catch { showToast('Copy not supported. Select text manually.', 'warning'); }
}
