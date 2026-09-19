// Mock Hybrid RAG Pipeline

export async function getGuidance(incidentData) {
    // Simulate RAG vector search + LLM generation
    await new Promise(r => setTimeout(r, 1000));

    if (incidentData.severity === 'Unknown') {
        return {
            guidance: "No standard operating procedure could be retrieved due to insufficient incident classification. Dispatcher must manually review and contact caller for more details.",
            source: "SOP Manual - Section 1.2: Unclassified Reports",
            relevanceScore: 0
        };
    }

    const type = incidentData.extractedEntities.type.toLowerCase();

    if (type.includes('fire')) {
        return {
            guidance: "Immediate dispatch of minimum 2 Engine Companies. Evacuate 500ft radius. If chemical involvement suspected, escalate to HAZMAT protocol immediately.",
            source: "SOP-Fire-04: Structural & Urban Fires (NFPA Guidelines)",
            relevanceScore: 0.92
        };
    } else if (type.includes('medical')) {
        return {
            guidance: "Dispatch nearest Advanced Life Support (ALS) unit. Instruct caller to maintain airway and apply pressure to any bleeding until EMTs arrive. Do NOT administer medication.",
            source: "SOP-Med-02: Emergency Medical Dispatch Protocols",
            relevanceScore: 0.95
        };
    } else if (type.includes('flood') || type.includes('water')) {
        return {
            guidance: "Dispatch swift water rescue team. Do NOT allow civilian vehicles to cross moving water. Prepare for potential electrical grid shutdown in affected sector.",
            source: "SOP-Env-09: Severe Weather & Flooding",
            relevanceScore: 0.88
        };
    } else if (type.includes('traffic') || type.includes('accident')) {
        return {
            guidance: "Dispatch Police and EMS. If entrapment reported, dispatch Heavy Rescue. Secure the perimeter and redirect traffic to secondary arterials.",
            source: "SOP-Traffic-01: Multi-vehicle Collisions",
            relevanceScore: 0.91
        };
    }

    return {
        guidance: "Standard dispatch protocol. Send nearest available unit to assess the situation and request backup if necessary. Secure the scene.",
        source: "General SOP - First Response Guidelines",
        relevanceScore: 0.75
    };
}
