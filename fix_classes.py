import os

path = 'frontend/css/style.css'
with open(path, 'a', encoding='utf-8') as f:
    f.write("""

/* Floating Chat in Report */
.floating-chat { position: fixed; bottom: 30px; right: 30px; z-index: 999; }
.chat-btn { background: var(--primary); color: #fff; width: 60px; height: 60px; border-radius: 50%; border: none; font-size: 1.5rem; cursor: pointer; box-shadow: 0 4px 20px rgba(59, 130, 246, 0.5); display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.chat-btn:hover { transform: scale(1.1); }
.chat-window { position: absolute; bottom: 80px; right: 0; width: 350px; background: rgba(10, 10, 15, 0.85); backdrop-filter: blur(16px); border: 1px solid var(--glass-border); border-radius: 16px; display: none; flex-direction: column; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.chat-window.active { display: flex; animation: slideUp 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.chat-header { background: rgba(0,0,0,0.5); padding: 15px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center; }
.chat-body { padding: 15px; max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.chat-input { padding: 15px; border-top: 1px solid var(--glass-border); display: flex; gap: 10px; }
.chat-input input { flex: 1; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid var(--glass-border); border-radius: 8px; color: #fff; }
.chat-input input:focus { outline: none; border-color: var(--primary); }
.chat-msg { padding: 10px 14px; border-radius: 12px; font-size: 0.9rem; max-width: 85%; }
.chat-msg.bot { background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); align-self: flex-start; border-bottom-left-radius: 2px; }
.chat-msg.user { background: var(--primary); color: #fff; align-self: flex-end; border-bottom-right-radius: 2px; }

@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* Report Form Multi-step */
.form-section { display: none; }
.form-section.active { display: block; animation: fadeIn 0.4s ease forwards; }
.step-indicator { display: flex; justify-content: space-between; margin-bottom: 30px; position: relative; }
.step-indicator::before { content: ''; position: absolute; top: 15px; left: 0; width: 100%; height: 2px; background: rgba(255,255,255,0.05); z-index: 0; }
.step-item { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; color: var(--text-muted); font-size: 0.85rem; }
.step-circle { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-base); border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-weight: 600; transition: var(--transition); }
.step-item.active { color: var(--primary); }
.step-item.active .step-circle { border-color: var(--primary); background: rgba(59, 130, 246, 0.1); box-shadow: 0 0 10px var(--primary-glow); }
.step-item.completed { color: var(--text-secondary); }
.step-item.completed .step-circle { border-color: var(--low); background: rgba(34, 197, 94, 0.1); color: var(--low); }

/* Analysis Steps */
.agent-nodes { display: flex; flex-direction: column; gap: 20px; max-width: 600px; margin: 0 auto; position: relative; padding-left: 30px; }
.agent-nodes::before { content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: rgba(255,255,255,0.05); }
.step { display: flex; align-items: center; gap: 20px; opacity: 0.3; transition: var(--transition); position: relative; }
.step-icon { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-base); border: 2px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; position: absolute; left: -49px; transition: var(--transition); }
.step.active { opacity: 1; }
.step.active .step-icon { border-color: var(--primary); box-shadow: 0 0 15px var(--primary-glow); animation: pulseStep 1.5s infinite; color: var(--primary); }
.step.completed { opacity: 0.8; }
.step.completed .step-icon { border-color: var(--low); color: var(--low); }
@keyframes pulseStep { 0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); } 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); } }

/* RAG Pipeline */
.rag-demo-panel { background: rgba(0,0,0,0.2); padding: 24px; border-radius: 12px; border: 1px solid var(--border-glass); }
.rag-pipeline { display: flex; align-items: center; gap: 15px; justify-content: space-between; }
.rag-step { flex: 1; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: 8px; padding: 15px; display: flex; align-items: center; gap: 15px; opacity: 0.4; transition: var(--transition); }
.rag-step.active { opacity: 1; border-color: rgba(255,255,255,0.1); background: rgba(255,255,255,0.05); }
.rag-icon { width: 40px; height: 40px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-glass); }
.rag-line { height: 2px; width: 30px; background: var(--border-glass); }
.rag-line.active { background: var(--accent); box-shadow: 0 0 8px var(--accent); }

""")

print("Added specific classes to style.css")
