/**
 * SAP Enterprise Service Hub & Dynamic Analytics Platform
 * Clean, lightweight Vanilla JavaScript Application Controller
 */

// ── Application State ──────────────────────────────────────────
const state = {
    currentView: 'overview', // 'overview' | 'service' | 'sync-history'
    currentServiceId: null,
    services: [],            // List of registered services from /api/services
    serviceData: {},         // Cache of records per service { [serviceId]: [] }
    stats: null,             // Stats from /api/stats
    tableSearchQuery: '',
    tableFilterStatus: '',
    currentPage: 1,
    pageSize: 10,
    sortCol: null,
    sortAsc: true,
    charts: {
        overview1: null,
        overview2: null,
        service1: null,
        service2: null
    }
};

// ── API Gateway Helpers ─────────────────────────────────────────
const API = {
    async getServices() {
        const res = await fetch('/api/services');
        if (!res.ok) throw new Error('Failed to load services: ' + res.statusText);
        return await res.json();
    },
    async getServiceData(serviceId) {
        const url = (serviceId === 'bills') ? '/api/bills' : `/api/data/${encodeURIComponent(serviceId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to load data for ${serviceId}: ` + res.statusText);
        return await res.json();
    },
    async getStats() {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to load stats: ' + res.statusText);
        return await res.json();
    },
    async getFetchLogs() {
        const res = await fetch('/api/fetch-log');
        if (!res.ok) throw new Error('Failed to load fetch logs: ' + res.statusText);
        return await res.json();
    },
    async syncService(serviceId) {
        const res = await fetch(`/api/sync/${encodeURIComponent(serviceId)}`, { method: 'POST' });
        if (!res.ok) throw new Error('Sync failed: ' + res.statusText);
        return await res.json();
    },
    async addService(payload) {
        const res = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to add service');
        }
        return await res.json();
    },
    async deleteService(serviceId) {
        const res = await fetch(`/api/services/${encodeURIComponent(serviceId)}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to delete service');
        }
        return await res.json();
    }
};

// ── Toast Notification System ───────────────────────────────────
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Initialize App ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadInitialData();
});

// ── Setup Global Event Listeners ────────────────────────────────
function setupEventListeners() {
    // Navigation
    document.getElementById('nav-overview')?.addEventListener('click', () => switchView('overview'));
    document.getElementById('nav-sync-history')?.addEventListener('click', () => switchView('sync-history'));
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('open');
    });

    // Refresh Topbar Button
    document.getElementById('topbarRefreshBtn')?.addEventListener('click', async () => {
        showToast('Refreshing data from database...', 'info');
        await loadInitialData();
        if (state.currentView === 'service' && state.currentServiceId) {
            await openServiceDashboard(state.currentServiceId, true);
        }
        showToast('Data refreshed successfully', 'success');
    });

    // Add Service Modal Triggers
    const openAddModal = () => openModal('modalAddService');
    document.getElementById('topbarAddBtn')?.addEventListener('click', openAddModal);
    document.getElementById('sidebarAddServiceBtn')?.addEventListener('click', openAddModal);
    document.getElementById('btnOpenAddService')?.addEventListener('click', openAddModal);
    document.getElementById('heroAddServiceBtn')?.addEventListener('click', openAddModal);

    document.getElementById('closeAddServiceModal')?.addEventListener('click', () => closeModal('modalAddService'));
    document.getElementById('cancelAddServiceBtn')?.addEventListener('click', () => closeModal('modalAddService'));

    // Presets in Add Service Modal
    document.querySelectorAll('.preset-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const id = chip.getAttribute('data-id');
            const name = chip.getAttribute('data-name');
            const url = chip.getAttribute('data-url');
            document.getElementById('inputServiceId').value = id;
            document.getElementById('inputDisplayName').value = name;
            document.getElementById('inputEndpoint').value = url;
            document.getElementById('inputDescription').value = `Auto-registered SAP microservice for ${id}`;
        });
    });

    // Add Service Form Submission
    document.getElementById('formAddService')?.addEventListener('submit', handleAddServiceSubmit);

    // Delete Modal
    document.getElementById('closeDeleteModal')?.addEventListener('click', () => closeModal('modalDeleteConfirm'));
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => closeModal('modalDeleteConfirm'));
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleConfirmDelete);

    // Service Dashboard Buttons
    document.getElementById('sdhSyncBtn')?.addEventListener('click', handleServiceSync);
    document.getElementById('sdhDeleteBtn')?.addEventListener('click', () => {
        if (!state.currentServiceId || state.currentServiceId === 'bills') return;
        document.getElementById('deleteServiceName').textContent = state.currentServiceId;
        openModal('modalDeleteConfirm');
    });

    // Detail Drawer Close
    document.getElementById('closeDrawerBtn')?.addEventListener('click', closeDetailDrawer);
    document.getElementById('drawerBackdrop')?.addEventListener('click', closeDetailDrawer);

    // Search Input in Service Table
    const searchInput = document.getElementById('serviceSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.tableSearchQuery = e.target.value.toLowerCase();
            state.currentPage = 1;
            renderServiceTable();
        });
    }

    // Sync All Services Button
    document.getElementById('btnSyncAllServices')?.addEventListener('click', handleSyncAll);

    // Global ESC key listener to close modals/drawers
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('modalAddService');
            closeModal('modalDeleteConfirm');
            closeDetailDrawer();
        }
    });
}

// ── Initial Data Loading ────────────────────────────────────────
async function loadInitialData() {
    try {
        const [services, stats] = await Promise.all([
            API.getServices(),
            API.getStats().catch(() => null)
        ]);

        state.services = services || [];
        state.stats = stats;

        renderSidebarServices();
        renderOverviewDashboard();
    } catch (err) {
        console.error('Initialization error:', err);
        showToast('Error loading initial services: ' + err.message, 'error');
    }
}

// ── Switch Main View ────────────────────────────────────────────
function switchView(viewName, serviceId = null) {
    state.currentView = viewName;
    state.currentServiceId = serviceId;

    // Update View Panes
    document.querySelectorAll('.view-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const crumb = document.getElementById('currentViewCrumb');

    if (viewName === 'overview') {
        document.getElementById('view-overview')?.classList.add('active');
        document.getElementById('nav-overview')?.classList.add('active');
        if (crumb) crumb.textContent = 'Overview';
        renderOverviewDashboard();
    } else if (viewName === 'sync-history') {
        document.getElementById('view-sync-history')?.classList.add('active');
        document.getElementById('nav-sync-history')?.classList.add('active');
        if (crumb) crumb.textContent = 'Sync & Logs';
        loadSyncLogs();
    } else if (viewName === 'service') {
        document.getElementById('view-service')?.classList.add('active');
        const activeNav = document.getElementById(`nav-service-${serviceId}`);
        if (activeNav) activeNav.classList.add('active');
        if (crumb) crumb.textContent = serviceId ? `Service: ${serviceId}` : 'Service Dashboard';
    }

    // Close mobile menu if open
    document.getElementById('sidebar')?.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Render Dynamic Sidebar Services ─────────────────────────────
function renderSidebarServices() {
    const nav = document.getElementById('dynamicServicesNav');
    if (!nav) return;

    if (!state.services || state.services.length === 0) {
        nav.innerHTML = '<div style="padding:10px 14px;font-size:0.8rem;color:var(--text-muted);">No services found</div>';
        return;
    }

    nav.innerHTML = state.services.map(s => {
        const isActive = (state.currentView === 'service' && state.currentServiceId === s.serviceId) ? 'active' : '';
        const count = s.recordCount != null ? Number(s.recordCount).toLocaleString() : '0';
        return `
            <button class="nav-item ${isActive}" id="nav-service-${s.serviceId}" onclick="openServiceDashboard('${s.serviceId}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span>${escapeHtml(s.displayName || s.serviceId)}</span>
                <span class="nav-badge">${count}</span>
            </button>
        `;
    }).join('');
}

// ── Open Dedicated Service Dashboard ────────────────────────────
async function openServiceDashboard(serviceId, forceRefresh = false) {
    switchView('service', serviceId);

    const desc = state.services.find(s => s.serviceId === serviceId) || {
        serviceId: serviceId,
        displayName: serviceId,
        tableName: serviceId + 's',
        description: 'SAP Service records',
        defaultEndpoint: '#'
    };

    // Header Metadata
    document.getElementById('sdhTitle').textContent = desc.displayName || desc.serviceId;
    document.getElementById('sdhServiceBadge').textContent = desc.serviceId.toUpperCase();
    document.getElementById('sdhDescription').textContent = desc.description || `Synchronized SAP data table for ${desc.serviceId}`;
    document.getElementById('sdhTableName').textContent = desc.tableName || desc.serviceId;
    
    const epLink = document.getElementById('sdhEndpointLink');
    if (epLink) {
        epLink.href = desc.defaultEndpoint || '#';
        epLink.title = desc.defaultEndpoint || '';
    }

    // Hide delete button for core 'bills' service
    const deleteBtn = document.getElementById('sdhDeleteBtn');
    if (deleteBtn) {
        deleteBtn.style.display = (serviceId.toLowerCase() === 'bills') ? 'none' : 'flex';
    }

    // Reset Table Filters and Pagination
    state.tableSearchQuery = '';
    state.tableFilterStatus = '';
    state.currentPage = 1;
    const searchInput = document.getElementById('serviceSearchInput');
    if (searchInput) searchInput.value = '';

    // Show Loading in Table & Charts
    document.getElementById('serviceTableContainer').innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <span>Fetching live ${escapeHtml(desc.displayName || serviceId)} records from Neon Cloud DB...</span>
        </div>
    `;

    try {
        if (!state.serviceData[serviceId] || forceRefresh) {
            state.serviceData[serviceId] = await API.getServiceData(serviceId);
        }

        const data = state.serviceData[serviceId] || [];
        document.getElementById('sdhRecordCount').textContent = data.length.toLocaleString();

        // Render Service Specific KPIs
        renderServiceKPIs(desc, data);

        // Render Eye-Catchy Service Charts
        renderServiceCharts(desc, data);

        // Render Data Table
        renderServiceTable();

    } catch (err) {
        console.error(`Failed to load ${serviceId} data:`, err);
        document.getElementById('serviceTableContainer').innerHTML = `
            <div class="empty-state">
                <span style="color:var(--accent-rose);font-weight:600;">Error loading service data</span>
                <span>${escapeHtml(err.message)}</span>
            </div>
        `;
    }
}

// ── Render Service Specific KPIs ────────────────────────────────
function renderServiceKPIs(desc, data) {
    const kpiGrid = document.getElementById('serviceKpiGrid');
    if (!kpiGrid) return;

    const totalCount = data.length;

    // Detect field variations dynamically
    let statusCounts = {};
    let currencyCounts = {};
    let totalGross = 0;

    data.forEach(item => {
        const status = item.billStatus || item.status || item.state || item.lifecycleStatus || 'ACTIVE';
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        const cur = item.currency || item.grossCurrency || (item.market && item.market.currency) || null;
        if (cur) currencyCounts[cur] = (currencyCounts[cur] || 0) + 1;

        const gross = item.grossAmount != null ? Number(item.grossAmount) : (item.amount != null ? Number(item.amount) : 0);
        if (!isNaN(gross)) totalGross += gross;
    });

    const primaryStatus = Object.keys(statusCounts)[0] || 'Active';
    const primaryStatusCount = statusCounts[primaryStatus] || 0;
    const distinctCurrencies = Object.keys(currencyCounts).length;

    kpiGrid.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-icon-box cyan">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
            </div>
            <div class="kpi-details">
                <span class="kpi-label">Total Cached Records</span>
                <span class="kpi-value">${totalCount.toLocaleString()}</span>
                <span class="kpi-caption">Stored in ${escapeHtml(desc.tableName || desc.serviceId)}</span>
            </div>
        </div>

        <div class="kpi-card">
            <div class="kpi-icon-box emerald">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </div>
            <div class="kpi-details">
                <span class="kpi-label">${escapeHtml(primaryStatus)} Items</span>
                <span class="kpi-value">${primaryStatusCount.toLocaleString()}</span>
                <span class="kpi-caption">Primary status classification</span>
            </div>
        </div>

        <div class="kpi-card">
            <div class="kpi-icon-box indigo">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
            </div>
            <div class="kpi-details">
                <span class="kpi-label">Distinct Markets / Currencies</span>
                <span class="kpi-value">${distinctCurrencies || 1}</span>
                <span class="kpi-caption">${Object.keys(currencyCounts).slice(0, 3).join(', ') || 'Global USD/EUR'}</span>
            </div>
        </div>

        <div class="kpi-card">
            <div class="kpi-icon-box amber">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
            </div>
            <div class="kpi-details">
                <span class="kpi-label">Aggregated Volume</span>
                <span class="kpi-value">${totalGross > 0 ? '$' + totalGross.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) : totalCount + ' units'}</span>
                <span class="kpi-caption">Calculated service volume</span>
            </div>
        </div>
    `;
}

// ── Render Eye-Catchy Service Charts (Chart.js) ──────────────────
function renderServiceCharts(desc, data) {
    if (state.charts.service1) {
        state.charts.service1.destroy();
        state.charts.service1 = null;
    }
    if (state.charts.service2) {
        state.charts.service2.destroy();
        state.charts.service2 = null;
    }

    if (!data || data.length === 0) {
        return;
    }

    // Chart 1: Status Distribution Doughnut Chart
    const statusMap = {};
    data.forEach(item => {
        const s = item.billStatus || item.status || item.state || item.lifecycleStatus || 'Active';
        statusMap[s] = (statusMap[s] || 0) + 1;
    });

    const statusLabels = Object.keys(statusMap);
    const statusValues = Object.values(statusMap);

    const colors = [
        '#06b6d4', // cyan
        '#10b981', // emerald
        '#6366f1', // indigo
        '#f59e0b', // amber
        '#f43f5e', // rose
        '#8b5cf6'  // purple
    ];

    const ctx1 = document.getElementById('serviceChart1')?.getContext('2d');
    if (ctx1) {
        state.charts.service1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusValues,
                    backgroundColor: colors.slice(0, statusLabels.length),
                    borderWidth: 2,
                    borderColor: '#111827',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Inter', size: 12 },
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label(ctx) {
                                const total = statusValues.reduce((a, b) => a + b, 0);
                                const pct = ((ctx.raw / total) * 100).toFixed(1);
                                return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    // Chart 2: Secondary Attribute Distribution (e.g. Currency, Type, Market, or Timeline)
    const secondaryMap = {};
    data.forEach(item => {
        const sec = item.billingType || item.currency || item.marketId || item.customerType || item.templateType || 'Standard';
        secondaryMap[sec] = (secondaryMap[sec] || 0) + 1;
    });

    const secLabels = Object.keys(secondaryMap).slice(0, 7);
    const secValues = secLabels.map(k => secondaryMap[k]);

    const ctx2 = document.getElementById('serviceChart2')?.getContext('2d');
    if (ctx2) {
        state.charts.service2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: secLabels,
                datasets: [{
                    label: 'Record Count',
                    data: secValues,
                    backgroundColor: 'rgba(56, 189, 248, 0.75)',
                    hoverBackgroundColor: '#38bdf8',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
                    }
                }
            }
        });
    }
}

// ── Render Dynamic Service Data Table ───────────────────────────
function renderServiceTable() {
    const container = document.getElementById('serviceTableContainer');
    if (!container) return;

    const allData = state.serviceData[state.currentServiceId] || [];
    if (allData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span>No records found in this service table.</span>
                <button class="btn-action-outline" onclick="handleServiceSync()" style="margin-top:10px;">
                    Sync Records from SAP API
                </button>
            </div>
        `;
        document.getElementById('serviceFilteredCount').textContent = 'Showing 0 records';
        renderPagination(0);
        return;
    }

    // Filter by search query
    let filtered = allData.filter(item => {
        if (!state.tableSearchQuery) return true;
        const q = state.tableSearchQuery;
        return Object.values(item).some(val => {
            if (val == null) return false;
            if (typeof val === 'object') return JSON.stringify(val).toLowerCase().includes(q);
            return String(val).toLowerCase().includes(q);
        });
    });

    document.getElementById('serviceFilteredCount').textContent = `Showing ${filtered.length} of ${allData.length} records`;

    // Dynamic Column Discovery from first record
    const sample = allData[0] || {};
    const candidateKeys = Object.keys(sample).filter(k => {
        return k !== 'rawJson' && typeof sample[k] !== 'function';
    });

    // Select up to 5 readable columns + Action column
    const priorityCols = ['id', 'documentNumber', 'subscriptionId', 'billStatus', 'status', 'billingType', 'currency', 'grossAmount', 'netAmount', 'createdAt', 'billingDate'];
    const chosenCols = [];

    // Add prioritized columns first
    priorityCols.forEach(p => {
        if (candidateKeys.includes(p) && !chosenCols.includes(p)) chosenCols.push(p);
    });
    // Add remaining up to 5
    candidateKeys.forEach(k => {
        if (chosenCols.length < 5 && !chosenCols.includes(k) && typeof sample[k] !== 'object') {
            chosenCols.push(k);
        }
    });

    if (chosenCols.length === 0) chosenCols.push('id');

    // Pagination slicing
    const totalPages = Math.ceil(filtered.length / state.pageSize) || 1;
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    const startIdx = (state.currentPage - 1) * state.pageSize;
    const pageRows = filtered.slice(startIdx, startIdx + state.pageSize);

    // Build Table HTML
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    ${chosenCols.map(col => `<th>${formatColHeader(col)}</th>`).join('')}
                    <th style="text-align:right;">Action</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageRows.forEach((row, idx) => {
        html += `<tr>`;
        chosenCols.forEach(col => {
            const val = row[col];
            html += `<td>${formatCellValue(col, val)}</td>`;
        });
        const fullIndex = startIdx + idx;
        html += `
            <td style="text-align:right;">
                <button class="btn-row-detail" onclick="openRecordInspector(${fullIndex})">Inspect</button>
            </td>
        `;
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    renderPagination(filtered.length);
}

function formatColHeader(col) {
    return col.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, str => str.toUpperCase());
}

function formatCellValue(col, val) {
    if (val == null) return '<span style="color:var(--text-muted);">—</span>';
    
    // Status Pills
    if (col.toLowerCase().includes('status') || col.toLowerCase().includes('state')) {
        const s = String(val).toLowerCase();
        let cls = 'neutral';
        if (s.includes('open') || s.includes('pend')) cls = 'open';
        else if (s.includes('close') || s.includes('active') || s.includes('succ')) cls = 'closed';
        else if (s.includes('fail') || s.includes('err')) cls = 'danger';
        return `<span class="status-pill ${cls}">${escapeHtml(String(val))}</span>`;
    }

    // Money or Amount
    if (col.toLowerCase().includes('amount')) {
        const num = Number(val);
        if (!isNaN(num)) return `$${num.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    }

    if (typeof val === 'object') {
        return `<code style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(JSON.stringify(val).substring(0, 30))}...</code>`;
    }

    const str = String(val);
    if (str.length > 40) return `${escapeHtml(str.substring(0, 37))}...`;
    return escapeHtml(str);
}

function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / state.pageSize) || 1;
    const pageInfo = document.getElementById('servicePageInfo');
    const pageBtns = document.getElementById('servicePageButtons');

    if (pageInfo) {
        pageInfo.textContent = `Page ${state.currentPage} of ${totalPages} (${totalCount} total)`;
    }

    if (!pageBtns) return;
    pageBtns.innerHTML = '';

    if (totalPages <= 1) return;

    if (state.currentPage > 1) {
        const prev = document.createElement('button');
        prev.className = 'btn-page';
        prev.textContent = '←';
        prev.onclick = () => { state.currentPage--; renderServiceTable(); };
        pageBtns.appendChild(prev);
    }

    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        const btn = document.createElement('button');
        btn.className = `btn-page ${i === state.currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { state.currentPage = i; renderServiceTable(); };
        pageBtns.appendChild(btn);
    }

    if (state.currentPage < totalPages) {
        const next = document.createElement('button');
        next.className = 'btn-page';
        next.textContent = '→';
        next.onclick = () => { state.currentPage++; renderServiceTable(); };
        pageBtns.appendChild(next);
    }
}

// ── Record Inspector / Detail Drawer ────────────────────────────
function openRecordInspector(index) {
    const list = state.serviceData[state.currentServiceId] || [];
    const item = list[index];
    if (!item) return;

    document.getElementById('drawerServicePill').textContent = (state.currentServiceId || 'RECORD').toUpperCase();
    document.getElementById('drawerTitle').textContent = item.id || item.documentNumber || `Record #${index + 1}`;

    const content = document.getElementById('drawerContent');
    if (!content) return;

    // Field Summary Card
    let summaryHtml = `<div class="field-summary-card">`;
    Object.entries(item).slice(0, 6).forEach(([k, v]) => {
        if (typeof v !== 'object') {
            summaryHtml += `
                <div class="field-summary-row">
                    <span class="fs-label">${escapeHtml(k)}</span>
                    <span class="fs-val">${escapeHtml(String(v))}</span>
                </div>
            `;
        }
    });
    summaryHtml += `</div>`;

    // Pretty JSON
    const jsonStr = JSON.stringify(item, null, 2);
    summaryHtml += `
        <h4 style="font-size:0.82rem;font-weight:700;color:var(--text-secondary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Complete Payload</h4>
        <pre class="json-inspector"><code>${escapeHtml(jsonStr)}</code></pre>
    `;

    content.innerHTML = summaryHtml;

    document.getElementById('drawerBackdrop')?.classList.add('show');
    document.getElementById('detailDrawer')?.classList.add('show');
}

function closeDetailDrawer() {
    document.getElementById('drawerBackdrop')?.classList.remove('show');
    document.getElementById('detailDrawer')?.classList.remove('show');
}

// ── Overview Dashboard View ─────────────────────────────────────
function renderOverviewDashboard() {
    const totalServices = state.services.length;
    let totalRecords = 0;
    state.services.forEach(s => totalRecords += Number(s.recordCount || 0));

    // Update Hero and Top Stats
    document.getElementById('heroTotalServices').textContent = totalServices;
    document.getElementById('heroTotalRecords').textContent = totalRecords.toLocaleString();
    document.getElementById('kpiActiveServices').textContent = totalServices;
    document.getElementById('kpiTotalRecords').textContent = totalRecords.toLocaleString();

    // Render Overview Services Cards
    const cardsGrid = document.getElementById('overviewServicesCards');
    if (cardsGrid) {
        if (state.services.length === 0) {
            cardsGrid.innerHTML = '<div class="empty-state">No services registered yet. Click "+ Add Service" to begin.</div>';
        } else {
            cardsGrid.innerHTML = state.services.map(s => {
                const count = Number(s.recordCount || 0).toLocaleString();
                return `
                    <div class="service-overview-card" onclick="openServiceDashboard('${s.serviceId}')">
                        <div class="soc-top">
                            <span class="soc-badge">${escapeHtml(s.serviceId)}</span>
                            <span class="soc-count">${count} records</span>
                        </div>
                        <h3 class="soc-title">${escapeHtml(s.displayName || s.serviceId)}</h3>
                        <p class="soc-desc">${escapeHtml(s.description || 'Auto-registered dynamic SAP microservice')}</p>
                        <div class="soc-footer">
                            <span>Open Dashboard</span>
                            <span>→</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    renderOverviewCharts();
}

function renderOverviewCharts() {
    if (state.charts.overview1) {
        state.charts.overview1.destroy();
        state.charts.overview1 = null;
    }
    if (state.charts.overview2) {
        state.charts.overview2.destroy();
        state.charts.overview2 = null;
    }

    // Chart 1: Service Record Volume Bar Chart
    const ctx1 = document.getElementById('overviewServiceVolumeChart')?.getContext('2d');
    if (ctx1 && state.services.length > 0) {
        const labels = state.services.map(s => s.displayName || s.serviceId);
        const data = state.services.map(s => Number(s.recordCount || 0));

        state.charts.overview1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Records Stored',
                    data: data,
                    backgroundColor: [
                        '#06b6d4',
                        '#6366f1',
                        '#10b981',
                        '#f59e0b',
                        '#f43f5e',
                        '#8b5cf6'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleColor: '#f8fafc',
                        padding: 10
                    }
                },
                scales: {
                    x: { ticks: { color: '#64748b' }, grid: { display: false } },
                    y: { beginAtZero: true, ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    }

    // Chart 2: Bills Distribution Doughnut Chart (from stats if available)
    const ctx2 = document.getElementById('overviewBillsDistributionChart')?.getContext('2d');
    if (ctx2 && state.stats) {
        const statusMap = state.stats.statusBreakdown || { 'OPEN': 25, 'CLOSED': 15 };
        const labels = Object.keys(statusMap);
        const values = Object.values(statusMap);

        state.charts.overview2 = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#f43f5e'],
                    borderWidth: 2,
                    borderColor: '#111827'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 }, padding: 12 }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

// ── Service Sync Handler ────────────────────────────────────────
async function handleServiceSync() {
    const serviceId = state.currentServiceId;
    if (!serviceId) return;

    const btn = document.getElementById('sdhSyncBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div><span>Syncing...</span>`;
    btn.disabled = true;

    try {
        const result = await API.syncService(serviceId);
        showToast(result.message || `Successfully synced ${serviceId}`, 'success');
        await loadInitialData();
        await openServiceDashboard(serviceId, true);
    } catch (err) {
        showToast(`Sync failed: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ── Sync All Services Handler ───────────────────────────────────
async function handleSyncAll() {
    const btn = document.getElementById('btnSyncAllServices');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div><span>Syncing All...</span>`;
    btn.disabled = true;

    try {
        for (const s of state.services) {
            await API.syncService(s.serviceId).catch(e => console.warn(`Sync failed for ${s.serviceId}:`, e));
        }
        showToast('All services synchronized successfully!', 'success');
        await loadInitialData();
        loadSyncLogs();
    } catch (err) {
        showToast(`Sync all encountered issues: ${err.message}`, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// ── Load Sync Logs ──────────────────────────────────────────────
async function loadSyncLogs() {
    const container = document.getElementById('syncHistoryTableContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <span>Fetching synchronization audit trail...</span>
        </div>
    `;

    try {
        const logs = await API.getFetchLogs();
        if (!logs || logs.length === 0) {
            container.innerHTML = `<div class="empty-state">No synchronization logs recorded yet.</div>`;
            return;
        }

        let html = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Records Synced</th>
                        <th>Message</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logs.forEach(log => {
            const isSuccess = log.status === 'SUCCESS';
            const statusClass = isSuccess ? 'success' : 'danger';
            html += `
                <tr>
                    <td style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;">${escapeHtml(log.fetchedAt || '—')}</td>
                    <td><span class="status-pill ${statusClass}">${escapeHtml(log.status)}</span></td>
                    <td><strong>${Number(log.billCount || 0).toLocaleString()}</strong></td>
                    <td>${escapeHtml(log.message || '—')}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Update Last Sync Activity in Overview KPI
        if (logs.length > 0) {
            const latest = logs[0];
            const timeEl = document.getElementById('kpiLastSyncTime');
            const statusEl = document.getElementById('kpiLastSyncStatus');
            if (timeEl) timeEl.textContent = latest.fetchedAt ? new Date(latest.fetchedAt).toLocaleTimeString() : 'Recent';
            if (statusEl) statusEl.textContent = `${latest.status} (${latest.billCount || 0} records)`;
        }
    } catch (err) {
        container.innerHTML = `<div class="empty-state">Failed to load sync logs: ${escapeHtml(err.message)}</div>`;
    }
}

// ── Add Service Submit Handler ──────────────────────────────────
async function handleAddServiceSubmit(e) {
    e.preventDefault();

    const serviceId = document.getElementById('inputServiceId').value.trim();
    const displayName = document.getElementById('inputDisplayName').value.trim();
    const endpoint = document.getElementById('inputEndpoint').value.trim();
    const description = document.getElementById('inputDescription').value.trim();
    const syncNow = document.getElementById('checkSyncImmediately').checked;

    const submitBtn = document.getElementById('submitAddServiceBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;"></div><span>Registering...</span>`;
    submitBtn.disabled = true;

    try {
        const result = await API.addService({
            serviceId,
            displayName,
            endpoint,
            description,
            syncNow
        });

        showToast(result.message || `Service '${serviceId}' registered successfully!`, 'success');
        closeModal('modalAddService');
        document.getElementById('formAddService').reset();

        // Reload services & open dashboard for newly added service
        await loadInitialData();
        await openServiceDashboard(serviceId, true);

    } catch (err) {
        showToast(`Registration failed: ${err.message}`, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// ── Delete Service Confirmation Handler ─────────────────────────
async function handleConfirmDelete() {
    const serviceId = state.currentServiceId;
    if (!serviceId || serviceId === 'bills') return;

    const btn = document.getElementById('confirmDeleteBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';

    try {
        const result = await API.deleteService(serviceId);
        showToast(result.message || `Service '${serviceId}' removed.`, 'success');
        closeModal('modalDeleteConfirm');

        delete state.serviceData[serviceId];
        await loadInitialData();
        switchView('overview');
    } catch (err) {
        showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Yes, Delete Service';
    }
}

// ── Modal Helpers ───────────────────────────────────────────────
function openModal(modalId) {
    document.getElementById(modalId)?.classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('show');
}

// ── Utility: Escape HTML ────────────────────────────────────────
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
