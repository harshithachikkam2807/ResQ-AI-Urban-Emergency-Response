// Mock AI Service simulating IBM Granite

export async function analyzeIncident(text) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1200));

    const lowerText = text.toLowerCase();
    
    // PII Redaction Simulation
    let redactedText = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[REDACTED PHONE]");
    redactedText = redactedText.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi, "[REDACTED EMAIL]");

    // Fallback: Insufficient data or hallucination defense
    if (text.trim().length < 15) {
        return {
            severity: 'Unknown',
            priority: 'Unknown',
            confidence: 35,
            summary: 'Insufficient data provided to classify the incident.',
            explanation: 'The provided text is too short. Refusing to guess severity to prevent hallucination.',
            extractedEntities: { type: 'Unknown', location: 'Unknown', people: 'Unknown' },
            redacted: true
        };
    }

    // Dynamic categorization logic
    let severity = 'Medium';
    let priority = 'P2';
    let type = 'Hazard';
    let people = 'Unknown';
    let conf = Math.floor(Math.random() * 15) + 80; // 80-94%

    if (lowerText.includes('fire') || lowerText.includes('smoke')) {
        severity = 'Critical';
        priority = 'P1';
        type = 'Fire';
        conf += 5;
    } else if (lowerText.includes('accident') || lowerText.includes('crash')) {
        severity = 'High';
        priority = 'P2';
        type = 'Traffic Accident';
    } else if (lowerText.includes('heart') || lowerText.includes('breathing') || lowerText.includes('blood')) {
        severity = 'Critical';
        priority = 'P1';
        type = 'Medical Emergency';
        conf += 4;
    } else if (lowerText.includes('flood') || lowerText.includes('water')) {
        severity = 'High';
        priority = 'P2';
        type = 'Flood';
    }

    if (lowerText.includes('trapped') || lowerText.includes('unconscious')) {
        severity = 'Critical';
        priority = 'P1';
        people = 'Immediate Danger';
    }

    // Refuse medical diagnosis (Safety boundary check)
    if (lowerText.includes('diagnosis') || lowerText.includes('prescribe') || lowerText.includes('treatment for')) {
        return {
            severity: 'Unknown',
            priority: 'Unknown',
            confidence: 99,
            summary: 'Medical diagnosis requested. Out of domain.',
            explanation: 'AI is explicitly instructed to refuse out-of-domain medical diagnoses. Dispatching EMTs, but no medical advice will be generated.',
            extractedEntities: { type: 'Medical Inquiry (Refused)', location: 'Unknown', people: 'Unknown' },
            redacted: true
        };
    }

    // Capped at 99
    if (conf > 99) conf = 99;

    return {
        severity,
        priority,
        confidence: conf,
        summary: `Detected ${type} with ${severity.toLowerCase()} severity.`,
        explanation: `IBM Granite classified this as ${severity} based on keywords indicating ${type.toLowerCase()}. PII redaction applied successfully.`,
        extractedEntities: {
            type,
            location: 'Extracted from text or GPS',
            people
        },
        redacted: redactedText !== text
    };
}
