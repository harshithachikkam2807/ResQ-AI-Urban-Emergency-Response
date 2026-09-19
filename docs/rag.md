# ResQ-AI Retrieval-Augmented Generation (RAG) Architecture

## 1. Why RAG is Non-Negotiable in Public Safety

In consumer conversational AI, minor factual hallucinations (such as misquoting a movie release date) are harmless. In municipal emergency dispatching, **an ungrounded hallucination can directly cause fatalities or catastrophic property loss**. 

Consider the operational stakes:
* If an AI model hallucinates that water is an acceptable extinguishing agent for a burning lithium-ion battery bank or a reactive metallic sodium spill, applying water will cause a catastrophic explosion.
* If an AI model miscalculates the toxic inhalation hazard (TIH) isolation perimeter for an anhydrous ammonia leak by 200 meters, thousands of civilians could suffer fatal respiratory edema.
* If an AI model invents a non-existent pediatric trauma capability at a local community hospital, critical pediatric patients will be routed to a facility incapable of emergency neurosurgery.

**Retrieval-Augmented Generation (RAG)** provides the essential architectural guarantee: **the foundation model is prohibited from relying on parametric training memory for tactical rules**. Instead, it acts as a high-speed reasoning engine over verified, certified, and legally binding municipal reference documents.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   THE RAG GROUNDING IMPERATIVE                         │
│                                                                        │
│  [ Incoming Emergency ] ──► [ Dense & Lexical Query ]                  │
│                                      │                                 │
│                                      ▼                                 │
│                    [ Certified Knowledge Store ]                       │
│                    • US DOT ERG 2024 Guide 128                         │
│                    • NFPA 1710 Section 5.2.4                           │
│                    • Hospital Trauma Registry                          │
│                                      │                                 │
│                                      ▼                                 │
│  [ Retrieved Protocol Chunks ] + [ Incident Facts ] ──► [ Granite 8B ] │
│                                                              │         │
│                                                              ▼         │
│                    [ Grounded Recommendation ]                         │
│                    "Per ERG Guide 128, maintain 800m                   │
│                     standoff. Deploy AR-AFFF foam."                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Knowledge Corpus Catalog

The ResQ-AI RAG corpus integrates five mission-critical public safety knowledge assets:

| Asset Identifier | Official Standard / Document | Authority | Primary Tactical Content |
| :--- | :--- | :--- | :--- |
| `KB-ERG-2024` | Emergency Response Guidebook 2024 | US Dept of Transportation (DOT) | 4,000+ hazardous materials substances, UN numbers, protective action distances, fire/spill containment protocols. |
| `KB-NFPA-1710` | Standard for Career Fire Department Deployment | National Fire Protection Association (NFPA) | Initial full alarm assignment criteria, structural fire attack staffing minimums (16-28 personnel), turnout time targets. |
| `KB-START-2023`| Simple Triage and Rapid Treatment (START) | NDLSF / US Public Health | Respiration, Perfusion, and Mental status (RPM) triage decision tree for mass-casualty sorting (Red, Yellow, Green, Black). |
| `KB-MUNI-TRAUMA`| Municipal Hospital & Trauma Capability Grid | Regional Healthcare Coalition | Real-time trauma center designations (Level 1-4), burn ICU beds, pediatric surgical suites, helipad availability. |
| `KB-FEMA-ICS` | Incident Command System Field Operations (ICS-420) | FEMA / US DHS | Incident command post staging perimeters, unified command structures, operational span of control. |

---

## 3. Document Chunking & Ingestion Strategy

Emergency reference manuals contain hierarchical structures (Chapters $\rightarrow$ Guides $\rightarrow$ Substances $\rightarrow$ Specific Distances). Naive text splitting by fixed character counts destroys crucial table boundaries and chemical warning notes.

ResQ-AI applies **Hierarchical Semantic Chunking**:
1. **Document Parsing**: Source manuals are parsed into Markdown with preserved table headers and section hierarchies.
2. **Chunk Sizing**: Chunks are constrained to **512 tokens** with a **64-token sliding overlap** to maintain contextual continuity across paragraph breaks.
3. **Structured Metadata Injection**: Every chunk is injected with contextual metadata stored directly in the vector database index:

```json
{
  "chunk_id": "erg2024_guide_128_chunk_02",
  "document_id": "KB-ERG-2024",
  "standard": "US DOT ERG 2024",
  "guide_number": 128,
  "hazard_class": "FLAMMABLE LIQUIDS (WATER-IMMISCIBLE)",
  "substances_covered": ["GASOLINE", "DIESEL", "PETROLEUM CRUDE OIL", "UN 1203"],
  "initial_isolation_m": 800,
  "evacuation_downwind_km": 1.6,
  "effective_date": "2024-01-01",
  "text": "GUIDE 128: FLAMMABLE LIQUIDS (WATER-IMMISCIBLE). FIRE: CAUTION - All these products have a very low flash point: Use of water spray when fighting fire may be inefficient. LARGE FIRE: Water spray, fog or alcohol-resistant foam. Do not use straight streams. SPILL OR LEAK: ELIMINATE all ignition sources. As an immediate precautionary measure, isolate spill or leak area for at least 800 meters in all directions."
}
```

---

## 4. Embedding Model & Vector Storage Architecture

* **Dense Vector Embedding Model**: `ibm/granite-embedding-125m-english`
  * Dimension: $D = 768$
  * Maximum Sequence Length: 512 tokens
  * Optimized for dense semantic representation of English regulatory and scientific text.
* **Vector Database**: **ChromaDB / Milvus**
  * Distance Metric: Cosine Similarity
  * Index Type: Hierarchical Navigable Small World (HNSW) graph index (`M=16`, `efConstruction=64`) for sub-5ms approximate nearest neighbor retrieval.

---

## 5. Hybrid Retrieval & Reciprocal Rank Fusion (RRF)

Public safety queries feature two distinct search behaviors:
1. **Exact Alphanumeric Queries**: Searching for specific hazardous chemical IDs or regulatory clauses (e.g., *"UN 1203"*, *"Guide 128"*, *"NFPA 1710 Section 5.2.4"*).
2. **Descriptive Semantic Queries**: Searching for situation-based procedures (e.g., *"how to extricate occupants when commercial vehicle is crushed under high-voltage electrical cable"*).

A pure vector search can miss exact alphanumeric codes if other semantic terms dominate the embedding space. A pure keyword search (BM25) fails when the caller uses colloquial terminology. 

ResQ-AI implements **Hybrid Dense-Sparse Retrieval with Reciprocal Rank Fusion (RRF)**:

```mermaid
flowchart TD
    Q[Incident Hazard Query] --> Dense[Granite Dense Vector Search\n(Cosine Similarity)]
    Q --> Sparse[Lexical BM25 Search\n(Exact Keyword Matching)]
    
    Dense --> R_Dense[Ranked Dense Candidates\n[D1, D2, D3, D4]]
    Sparse --> R_Sparse[Ranked BM25 Candidates\n[D2, D5, D1, D6]]
    
    R_Dense --> RRF[Reciprocal Rank Fusion Engine\nRRF(d) = Σ 1 / (60 + r(d))]
    R_Sparse --> RRF
    
    RRF --> TopK[Top-3 Certified Protocol Chunks\nwith Source Metadata]
    TopK --> LLM[Injected into IBM Granite 3.0 Prompt Context]
```

### Reciprocal Rank Fusion Formulation
$$RRF(d \in D) = \sum_{m \in \{\text{dense}, \text{bm25}\}} \frac{1}{k + r_m(d)}$$
Where:
* $r_m(d) \in \{1, 2, 3, \dots\}$ is the 1-based rank of document chunk $d$ in system $m$.
* $k = 60$ is the standard smoothing constant dampening the impact of high-ranking outliers.

---

## 6. Citation Grounding & Anti-Hallucination Verification

When retrieved context is assembled into the prompt for `ibm/granite-3.0-8b-instruct`, the agent is instructed to **cite every claim using bracketed document citations**:

### Prompt Context Template
```markdown
[OFFICIAL EMERGENCY PROTOCOLS RETRIEVED]
--------------------------------------------------
[KB-ERG-2024 | Guide 128 | UN 1203 Gasoline]:
"SPILL OR LEAK: Isolate spill or leak area for at least 800 meters in all directions. 
LARGE FIRE: Water spray, fog or alcohol-resistant aqueous film-forming foam (AR-AFFF).
Do not use straight streams."
--------------------------------------------------
[KB-NFPA-1710 | Section 5.2.4 | Initial Full Alarm Assignment]:
"Structural and hazardous spill incidents require minimum deployment of 
two engine companies, one ladder truck, and one designated safety officer."
--------------------------------------------------

TASK:
Synthesize the tactical response package. You MUST include explicit citations 
in the format [KB-DOC-ID, Section X] for every isolation distance, apparatus type, 
and suppression agent recommended.
```

### Verification via IBM Granite Guardian 3.0 8B
The complete generated response is passed to `ibm/granite-guardian-3.0-8b` alongside the retrieved chunks. Granite Guardian evaluates **Faithfulness and Context Relevance**:
* If any recommended perimeter distance (e.g., "isolate 800 meters") cannot be mapped to the retrieved context, the safety score drops below the 0.95 threshold.
* Upon threshold violation, the dispatch system displays an **Audit Warning** on the dispatcher cockpit, highlighting the ungrounded parameter in yellow and linking the official manual directly for manual verification.

---

## 7. Python Implementation Reference

```python
"""
ResQ-AI Hybrid RAG Search Engine Module
Combines dense embeddings via IBM Granite with BM25 sparse search.
"""
from typing import List, Dict, Any
import numpy as np

class HybridRAGEngine:
    def __init__(self, vector_store, bm25_index, k: int = 60):
        self.vector_store = vector_store
        self.bm25_index = bm25_index
        self.k = k

    def search(self, query: str, top_n: int = 3) -> List[Dict[str, Any]]:
        # 1. Dense Semantic Search
        dense_results = self.vector_store.similarity_search_with_score(query, k=10)
        dense_ranks = {doc.metadata["chunk_id"]: (idx + 1, doc) 
                       for idx, (doc, _) in enumerate(dense_results)}

        # 2. Sparse Lexical Search
        bm25_results = self.bm25_index.search(query, top_k=10)
        sparse_ranks = {doc["chunk_id"]: (idx + 1, doc) 
                        for idx, doc in enumerate(bm25_results)}

        # 3. Reciprocal Rank Fusion
        all_ids = set(dense_ranks.keys()) | set(sparse_ranks.keys())
        rrf_scores = {}

        for doc_id in all_ids:
            score = 0.0
            if doc_id in dense_ranks:
                rank = dense_ranks[doc_id][0]
                score += 1.0 / (self.k + rank)
            if doc_id in sparse_ranks:
                rank = sparse_ranks[doc_id][0]
                score += 1.0 / (self.k + rank)
            rrf_scores[doc_id] = score

        # Sort by composite RRF score
        sorted_ids = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
        
        top_chunks = []
        for doc_id, score in sorted_ids[:top_n]:
            doc = dense_ranks[doc_id][1] if doc_id in dense_ranks else sparse_ranks[doc_id][1]
            top_chunks.append({
                "chunk_id": doc_id,
                "rrf_score": round(score, 4),
                "text": getattr(doc, "page_content", doc.get("text", "")),
                "metadata": getattr(doc, "metadata", doc)
            })

        return top_chunks
```
