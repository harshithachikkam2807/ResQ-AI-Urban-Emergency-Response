// storage.js - Simple local storage wrapper

const STORAGE_KEY = 'urban_emergency_incidents';

async function seedDataIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        try {
            const response = await fetch('../data/sample-incidents.json');
            if (response.ok) {
                const sampleData = await response.json();
                // Map the complex schema to our simpler frontend schema if necessary, or just use it directly.
                const formattedData = sampleData.map(inc => ({
                    id: inc.id,
                    type: inc.category,
                    location: inc.location.address || 'Unknown Location',
                    lat: inc.location.coordinates?.[0],
                    lng: inc.location.coordinates?.[1],
                    peopleAffected: inc.impact?.casualties + inc.impact?.injuries || 0,
                    description: inc.description,
                    status: inc.status === 'Open' ? 'Pending Verification' : inc.status,
                    severity: inc.severity,
                    priority: inc.severity === 'Critical' ? 'Critical' : 'High', // Rough mapping
                    timestamp: inc.timestamp,
                    summary: inc.title,
                    explanation: "Pre-loaded demo data.",
                    ragGuidance: inc.actionPlan || "Follow standard protocols.",
                    ragSource: inc.relatedKnowledgeDoc || "Demo DB"
                }));
                localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedData));
            }
        } catch (e) {
            console.error("Failed to seed data", e);
        }
    }
}

// Call on load
seedDataIfEmpty();

function getIncidents() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveIncident(incident) {
    const incidents = getIncidents();
    // Add timestamp and ID if new
    if (!incident.id) {
        incident.id = 'INC-' + Math.floor(1000 + Math.random() * 9000);
        incident.timestamp = new Date().toISOString();
        incident.status = 'Pending Verification';
    }
    incidents.push(incident);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
    return incident.id;
}

function updateIncidentStatus(id, newStatus) {
    const incidents = getIncidents();
    const index = incidents.findIndex(i => i.id === id);
    if (index !== -1) {
        incidents[index].status = newStatus;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
        return true;
    }
    return false;
}

function getIncidentById(id) {
    const incidents = getIncidents();
    return incidents.find(i => i.id === id);
}

// Check if demo mode is on
function isDemoMode() {
    return localStorage.getItem('demoMode') !== 'false'; // default true
}

function setDemoMode(isDemo) {
    localStorage.setItem('demoMode', isDemo);
}
