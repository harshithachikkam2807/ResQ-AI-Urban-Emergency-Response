// js/analysis.js

import { analyzeIncident } from '../ai/granite-service.js';
import { getGuidance } from '../ai/rag-service.js';
import { saveIncident } from './storage.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Note: ensure lucide is available globally or imported if needed
    if (window.lucide) window.lucide.createIcons();

    // Recover pending incident
    const reportStr = sessionStorage.getItem('currentReport');
    if (!reportStr) {
        window.location.href = 'report.html';
        return;
    }

    const reportData = JSON.parse(reportStr);
    
    // UI Elements
    const statusText = document.getElementById('aiStatusText'); // Ensure this ID exists in HTML, or fallback
    function setStatus(msg) {
        if (statusText) statusText.innerText = msg;
    }

    function updateWorkflowStep(stepId, status) {
        const el = document.getElementById(stepId);
        if (el) {
            el.className = `step ${status}`;
        }
    }

    try {
        // Step 1: Granite Analysis
        setStatus("Extracting entities & redacting PII...");
        updateWorkflowStep('step-granite', 'active');
        const analysis = await analyzeIncident(reportData.description);
        
        setStatus("Classifying severity...");
        await new Promise(r => setTimeout(r, 800));
        updateWorkflowStep('step-granite', 'completed');
        
        // Step 2: RAG Retrieval
        setStatus("Retrieving relevant SOP via Hybrid RAG...");
        updateWorkflowStep('step-rag', 'active');
        const ragResult = await getGuidance(analysis);
        updateWorkflowStep('step-rag', 'completed');

        // Step 3: Priority & Human Verification prep
        setStatus("Finalizing priority and awaiting human verification...");
        updateWorkflowStep('step-priority', 'active');
        await new Promise(r => setTimeout(r, 800));
        updateWorkflowStep('step-priority', 'completed');

        // Combine for DB
        const finalResult = {
            type: analysis.extractedEntities.type,
            location: reportData.location || "Unknown",
            severity: analysis.severity,
            priority: analysis.priority,
            status: "Pending Verification",
            description: analysis.redacted ? "[REDACTED] " + reportData.description : reportData.description,
            peopleAffected: analysis.extractedEntities.people,
            summary: analysis.summary,
            explanation: analysis.explanation,
            confidence: analysis.confidence,
            ragGuidance: ragResult.guidance,
            ragSource: ragResult.source,
            lat: reportData.lat || null,
            lng: reportData.lng || null
        };
        
        // Save to DB
        const incId = saveIncident(finalResult);
        finalResult.id = incId;
        
        // Update UI
        const loader = document.getElementById('aiLoader');
        if (loader) loader.style.display = 'none';
        
        const results = document.getElementById('analysisResults');
        if (results) results.style.display = 'block';
        
        document.getElementById('incidentId').innerText = finalResult.id;
        document.getElementById('resType').innerText = finalResult.type;
        
        const sevEl = document.getElementById('resSeverity');
        sevEl.innerText = finalResult.severity;
        sevEl.className = `badge ${finalResult.severity.toLowerCase()}`;
        
        const priEl = document.getElementById('resPriority');
        priEl.innerText = finalResult.priority;
        priEl.className = `badge ${finalResult.priority.toLowerCase()}`;

        document.getElementById('resLocation').innerText = finalResult.location;
        document.getElementById('resPeople').innerText = finalResult.peopleAffected;
        document.getElementById('resSummary').innerText = finalResult.summary;
        document.getElementById('resExplanation').innerText = finalResult.explanation;
        document.getElementById('resRag').innerText = finalResult.ragGuidance;
        document.getElementById('resRagSource').innerText = finalResult.ragSource;
        
        // Dynamic confidence display
        if (finalResult.confidence) {
            const confBadge = `<br><br><strong style="color:var(--text-primary);">Confidence Score:</strong> <span class="badge ${finalResult.confidence > 85 ? 'success' : (finalResult.confidence > 50 ? 'warning' : 'critical')}">${finalResult.confidence}%</span>`;
            document.getElementById('resExplanation').insertAdjacentHTML('beforeend', confBadge);
        }

        sessionStorage.removeItem('currentReport'); // clear

    } catch (err) {
        console.error(err);
        alert("Error during AI analysis.");
    }
});
