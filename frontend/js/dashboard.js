// js/dashboard.js

let categoryChartInstance = null;
let severityChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    loadIncidents();
    lucide.createIcons();
    
    document.getElementById('searchInput').addEventListener('input', loadIncidents);
    document.getElementById('filterStatus').addEventListener('change', loadIncidents);
});

function initCharts() {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";
    
    const ctxCategory = document.getElementById('categoryChart').getContext('2d');
    categoryChartInstance = new Chart(ctxCategory, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Incidents', data: [], backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, title: { display: true, text: 'Incidents by Category', color: '#f8fafc', font: { size: 14, weight: '500' } } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' }, border: { display: false } },
                x: { grid: { display: false }, border: { display: false } }
            }
        }
    });

    const ctxSeverity = document.getElementById('severityChart').getContext('2d');
    severityChartInstance = new Chart(ctxSeverity, {
        type: 'doughnut',
        data: { labels: ['Critical', 'High', 'Medium', 'Low'], datasets: [{ data: [0,0,0,0], backgroundColor: ['rgba(239, 68, 68, 0.6)', 'rgba(249, 115, 22, 0.6)', 'rgba(234, 179, 8, 0.6)', 'rgba(34, 197, 94, 0.6)'], borderColor: ['#ef4444', '#f97316', '#eab308', '#22c55e'], borderWidth: 1 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '75%',
            plugins: { legend: { position: 'right' }, title: { display: true, text: 'Severity Distribution', color: '#f8fafc', font: { size: 14, weight: '500' } } }
        }
    });
}

function loadIncidents() {
    const incidents = getIncidents();
    // sort by timestamp desc
    incidents.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    const tbody = document.getElementById('incidentTableBody');
    const emptyState = document.getElementById('emptyState');
    const search = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    
    let total = 0, pending = 0, criticalCount = 0, displayed = 0;
    
    // For charts
    const categoryCounts = {};
    const severityCounts = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };

    tbody.innerHTML = '';

    incidents.forEach(inc => {
        // Stats
        if(inc.status !== 'Resolved' && inc.status !== 'Rejected') {
            total++;
            if (inc.status === 'Pending Verification') pending++;
            if (inc.priority === 'Critical' || inc.severity === 'Critical') criticalCount++;
        }

        // Filters
        if (statusFilter && inc.status !== statusFilter) return;
        if (search && !(
            inc.id.toLowerCase().includes(search) || 
            inc.type.toLowerCase().includes(search) || 
            inc.location.toLowerCase().includes(search)
        )) return;

        // Populate Chart Data
        categoryCounts[inc.type] = (categoryCounts[inc.type] || 0) + 1;
        if(severityCounts[inc.severity] !== undefined) {
            severityCounts[inc.severity]++;
        } else {
            // map unknown to Low or handle differently
            severityCounts['Low']++;
        }

        displayed++;

        let statusClass = 'badge';
        if(inc.status === 'Resolved') statusClass += ' success';
        else if(inc.status === 'Pending Verification') statusClass += ' warning';
        else if(inc.status === 'Rejected') statusClass += ' critical';
        else statusClass += ' primary';

        const timeStr = new Date(inc.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family:monospace; font-weight:600;">${inc.id}</td>
            <td><div style="display:flex; align-items:center; gap:8px;"><i data-lucide="${getTypeIcon(inc.type)}" style="width:16px; color:var(--text-secondary);"></i> ${inc.type}</div></td>
            <td style="color:var(--text-secondary);"><i data-lucide="map-pin" style="width:14px;"></i> ${inc.location}</td>
            <td><span class="badge ${inc.severity.toLowerCase()}">${inc.severity}</span></td>
            <td><span class="${statusClass}">${inc.status}</span></td>
            <td style="color:var(--text-secondary); font-size:0.85rem;">${timeStr}</td>
            <td><a href="incident.html?id=${inc.id}" class="btn btn-secondary" style="padding: 6px 12px; font-size: 0.8rem;">Review <i data-lucide="arrow-right" style="width:14px;"></i></a></td>
        `;
        tbody.appendChild(tr);
    });

    if(displayed === 0) {
        emptyState.style.display = 'block';
        tbody.parentElement.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        tbody.parentElement.style.display = 'table';
    }

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statPending').innerText = pending;
    document.getElementById('statCritical').innerText = criticalCount;
    
    // Update Charts
    updateCharts(categoryCounts, severityCounts);

    lucide.createIcons();
}

function updateCharts(catCounts, sevCounts) {
    if(categoryChartInstance) {
        categoryChartInstance.data.labels = Object.keys(catCounts);
        categoryChartInstance.data.datasets[0].data = Object.values(catCounts);
        categoryChartInstance.update();
    }
    if(severityChartInstance) {
        severityChartInstance.data.datasets[0].data = [sevCounts['Critical'], sevCounts['High'], sevCounts['Medium'], sevCounts['Low']];
        severityChartInstance.update();
    }
}

function getTypeIcon(type) {
    if(type.includes('Fire')) return 'flame';
    if(type.includes('Accident')) return 'car-front';
    if(type.includes('Medical')) return 'heart-pulse';
    if(type.includes('Flood') || type.includes('Water')) return 'waves';
    if(type.includes('Hazard')) return 'zap';
    return 'alert-circle';
}
