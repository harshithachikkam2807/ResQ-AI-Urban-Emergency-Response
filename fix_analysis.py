import os
import re

path = 'frontend/analysis.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

script_replacement = """
    <script src="js/storage.js"></script>
    <script type="module">
        import { analyzeIncident } from '../ai/granite-service.js';
        import { getGuidance } from '../ai/rag-service.js';
        
        lucide.createIcons();
        
        document.addEventListener('DOMContentLoaded', async () => {
            const reportStr = sessionStorage.getItem('currentReport');
            if (!reportStr) { window.location.href = 'report.html'; return; }
            const reportData = JSON.parse(reportStr);

            const nRec = document.getElementById('node-receive');
            const nCls = document.getElementById('node-classify');
            const nRag = document.getElementById('node-rag');
            const nSev = document.getElementById('node-severity');
            const nHum = document.getElementById('node-human');
            
            // Add status text above nodes if it doesn't exist
            let statusEl = document.getElementById('aiStatusMsg');
            if (!statusEl) {
                const nodesContainer = document.querySelector('.agent-nodes');
                statusEl = document.createElement('h3');
                statusEl.id = 'aiStatusMsg';
                statusEl.style.cssText = 'text-align: center; margin-bottom: 30px; font-weight: 500; color: var(--primary);';
                nodesContainer.parentNode.insertBefore(statusEl, nodesContainer);
            }

            try {
                // Workflow Simulation
                statusEl.innerText = "Ingesting citizen report data...";
                nRec.classList.add('active');
                await new Promise(r => setTimeout(r, 800));
                nRec.classList.replace('active', 'completed');
                
                statusEl.innerText = "Extracting entities & redacting PII...";
                nCls.classList.add('active');
                const graniteResult = await analyzeIncident(reportData.description);
                nCls.classList.replace('active', 'completed');

                statusEl.innerText = "Retrieving relevant SOP via Hybrid RAG...";
                nRag.classList.add('active');
                const ragResult = await getGuidance(graniteResult);
                nRag.classList.replace('active', 'completed');

                statusEl.innerText = "Classifying severity & prioritizing...";
                nSev.classList.add('active');
                await new Promise(r => setTimeout(r, 800));
                nSev.classList.replace('active', 'completed');

                statusEl.innerText = "Finalizing dossier for human review...";
                nHum.classList.add('active');
                await new Promise(r => setTimeout(r, 500));

                const finalResult = { 
                    ...reportData, 
                    ...graniteResult, 
                    type: graniteResult.extractedEntities.type,
                    ragGuidance: ragResult.guidance, 
                    ragSource: ragResult.source,
                    peopleAffected: graniteResult.extractedEntities.people
                };
                
                // Save to localStorage
                const existing = JSON.parse(localStorage.getItem('resq_incidents') || '[]');
                finalResult.id = 'INC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                finalResult.status = "Pending Verification";
                finalResult.timestamp = new Date().toISOString();
                existing.push(finalResult);
                localStorage.setItem('resq_incidents', JSON.stringify(existing));

                // Show Results
                document.getElementById('processingView').style.display = 'none';
                document.getElementById('resultsView').style.display = 'block';
                
                document.getElementById('resId').innerText = finalResult.id;
                document.getElementById('resType').innerText = finalResult.type;
                document.getElementById('resLoc').innerText = finalResult.location || "Unknown";
                document.getElementById('resPeople').innerText = finalResult.peopleAffected || "Unknown";
                
                const sev = document.getElementById('resSev');
                sev.innerText = finalResult.severity;
                sev.className = `badge ${finalResult.severity.toLowerCase()}`;
                
                const pri = document.getElementById('resPri');
                pri.innerText = finalResult.priority;
                pri.className = `badge ${finalResult.priority.toLowerCase()}`;
                
                document.getElementById('resExp').innerHTML = finalResult.explanation + (finalResult.confidence ? `<br><br><strong style="color:var(--text-primary);">Confidence Score:</strong> <span class="badge ${finalResult.confidence > 85 ? 'success' : (finalResult.confidence > 50 ? 'warning' : 'critical')}">${finalResult.confidence}%</span>` : '');
                
                document.getElementById('ragQuery').innerText = `SELECT chunks FROM vector_db WHERE type='${finalResult.type}' AND sim(desc) > 0.85`;
                document.getElementById('ragSource').innerText = finalResult.ragSource;
                document.getElementById('ragAns').innerText = finalResult.ragGuidance;

                sessionStorage.removeItem('currentReport');

            } catch(e) {
                console.error(e);
                alert("Processing failed. Please check console.");
            }
        });
    </script>
</body>
"""

# Replace from <script src="js/storage.js"></script> to </body>
content = re.sub(r'<script src="js/storage\.js"></script>.*?</body>', script_replacement, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated analysis.html")
