// js/incident.js

let currentIncidentId = null;

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (!id) {
        window.location.href = 'dashboard.html';
        return;
    }

    currentIncidentId = id;
    loadIncidentDetails(id);
});

function loadIncidentDetails(id) {
    const incident = getIncidentById(id);
    if (!incident) {
        alert("Incident not found.");
        window.location.href = 'dashboard.html';
        return;
    }

    document.getElementById('incId').innerText = incident.id;
    
    const statusBadge = document.getElementById('incStatus');
    statusBadge.innerText = incident.status;
    let statusClass = 'badge';
    if(incident.status === 'Resolved') statusClass += ' success';
    else if(incident.status === 'Pending Verification') statusClass += ' warning';
    else if(incident.status === 'Rejected') statusClass += ' critical';
    else statusClass += ' primary';
    statusBadge.className = statusClass;

    document.getElementById('incType').innerText = incident.type;
    document.getElementById('incLocation').innerText = incident.location;
    document.getElementById('incPeople').innerText = incident.peopleAffected;
    document.getElementById('incDesc').innerText = `"${incident.description}"`;
    
    document.getElementById('incSeverity').innerText = incident.severity;
    document.getElementById('incSeverity').className = `badge ${incident.severity.toLowerCase()}`;
    
    document.getElementById('incPriority').innerText = incident.priority;
    document.getElementById('incPriority').className = `badge ${incident.priority.toLowerCase()}`;

    document.getElementById('incSummary').innerText = incident.summary;
    document.getElementById('incExplanation').innerText = incident.explanation;
    
    // Check if we need to add confidence visually
    if(incident.confidence) {
        document.getElementById('incExplanation').insertAdjacentHTML('beforeend', `<br><br><strong style="color:var(--text-primary);">Confidence Score:</strong> <span class="badge ${incident.confidence > 85 ? 'success' : (incident.confidence > 50 ? 'warning' : 'critical')}">${incident.confidence}%</span>`);
    }
    
    document.getElementById('incRag').innerText = incident.ragGuidance;
    document.getElementById('incRagSource').innerText = incident.ragSource;

    if (incident.lat && incident.lng) {
        document.getElementById('mapLat').innerText = Number(incident.lat).toFixed(4);
        document.getElementById('mapLng').innerText = Number(incident.lng).toFixed(4);
    } else {
        document.getElementById('mapLat').innerText = (40 + Math.random()).toFixed(4);
        document.getElementById('mapLng').innerText = (-74 + Math.random()).toFixed(4);
    }

    // Timeline
    const tl = document.getElementById('timelineCont');
    tl.innerHTML = '';
    
    const d = new Date(incident.timestamp);
    const timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const events = [
        { time: timeStr, text: "Report Received via Citizen App", active: true },
        { time: addMins(d, 1), text: "Granite Triage Classification", active: true },
        { time: addMins(d, 1), text: "RAG Protocol Retrieval", active: true },
        { time: addMins(d, 2), text: "Priority Assigned, Awaiting HITL", active: incident.status === 'Pending Verification' }
    ];

    if (incident.status !== 'Pending Verification') {
        events.push({ time: addMins(d, 5), text: `Dispatcher Action: ${incident.status}`, active: true });
    }

    events.forEach(ev => {
        tl.innerHTML += `
            <div class="tl-item ${ev.active ? 'active' : ''}">
                <div class="tl-dot"></div>
                <div class="tl-time">${ev.time}</div>
                <div class="tl-content">${ev.text}</div>
            </div>
        `;
    });

    if (incident.status === 'Resolved' || incident.status === 'Rejected') {
        document.getElementById('verificationPanel').style.display = 'none';
    } else {
        document.getElementById('verificationPanel').style.display = 'block';
    }
}

function addMins(date, mins) {
    const nd = new Date(date.getTime() + mins*60000);
    return nd.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function showToast(message, type="success") {
    const cont = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    let icon = 'check-circle';
    if(type==='warning') icon = 'alert-circle';
    if(type==='critical') icon = 'x-circle';
    
    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    cont.appendChild(toast);
    lucide.createIcons();
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.updateStatus = function(newStatus) {
    if (updateIncidentStatus(currentIncidentId, newStatus)) {
        loadIncidentDetails(currentIncidentId);
        showToast(`Incident status updated to ${newStatus}`, newStatus==='Rejected'?'critical':'success');
    }
};
