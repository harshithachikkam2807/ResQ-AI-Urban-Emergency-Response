// ai/agent-service.js
// Orchestrates the IBM BOB workflow

const AgentService = {
    async processReport(reportData, updateCallback) {
        try {
            updateCallback('step-receive', 'active');
            await new Promise(r => setTimeout(r, 500));
            updateCallback('step-receive', 'completed');

            updateCallback('step-classify', 'active');
            const graniteResult = await GraniteService.analyzeReport(reportData.description, reportData.type);
            updateCallback('step-classify', 'completed');
            
            updateCallback('step-extract', 'active');
            await new Promise(r => setTimeout(r, 600)); // simulated extraction
            updateCallback('step-extract', 'completed');

            updateCallback('step-rag', 'active');
            const ragResult = await RAGService.retrieveContext(reportData.description, reportData.type);
            updateCallback('step-rag', 'completed');

            updateCallback('step-severity', 'active');
            await new Promise(r => setTimeout(r, 500)); // already done by Granite, just showing in UI
            updateCallback('step-severity', 'completed');

            updateCallback('step-human', 'active');
            
            // Combine results
            return {
                ...reportData,
                ...graniteResult,
                ragGuidance: ragResult.groundedResponse,
                ragSource: ragResult.source
            };

        } catch (err) {
            console.error("Agent workflow failed:", err);
            throw err;
        }
    }
};
