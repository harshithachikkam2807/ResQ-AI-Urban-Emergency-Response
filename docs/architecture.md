# ResQ-AI System Architecture Specification

## 1. Architectural Philosophy & Principles

The ResQ-AI architecture is engineered specifically for **safety-critical, fault-tolerant municipal emergency dispatching**. Public safety answering points (PSAPs) cannot tolerate non-deterministic failures, ungrounded hallucinations, or opaque black-box recommendations. As such, ResQ-AI is designed around five foundational architectural pillars:

1. **Safety-First Determinism**: Generative foundation models (IBM Granite) are strictly bound to structured output schemas (JSON/Pydantic) and audited by a dedicated safety model (IBM Granite Guardian) before presentation to users.
2. **Knowledge-Grounded Retrieval (RAG)**: Zero ungrounded clinical, tactical, or hazardous materials guidance. Every recommendation must link to verified municipal SOPs, NFPA standards, or the US DOT HazMat ERG 2024.
3. **Decoupled Agentic Mesh**: Monolithic prompts are replaced with specialized micro-agents coordinated by an **IBM BOB** state machine. Each agent possesses a single bounded context (Triage, Protocol Retrieval, Dispatch Optimization, Tactical Comms).
4. **Human-In-The-Loop (HITL) Imperative**: AI proposes; certified human telecommunicators dispose. The system accelerates human decision-making rather than replacing human authority.
5. **Graceful Degradation & Resilience**: If network connectivity to external LLM endpoints is severed, the system automatically falls back to an in-memory deterministic rule-based heuristic engine with zero downtime.

---

## 2. End-to-End System Topology

```mermaid
flowchart TB
    subgraph INGEST["1. INGESTION & DATA SANITIZATION LAYER"]
        E_AUDIO["911 Voice Stream (SIP Trunk)"] --> ASR["Automated Speech Recognition (Whisper / IBM Watson ASR)"]
        E_APP["Citizen Mobile SOS (REST/JSON)"] --> SANITIZER
        E_IOT["Urban IoT Sensors (MQTT / Webhook)"] --> SANITIZER
        ASR --> SANITIZER["PII Anonymization & Sanitization Engine\n(Presidio / Regex Scrubbing)"]
        SANITIZER --> NORMALIZER["Event Normalization & Validation\n(Pydantic Event Schema)"]
    end

    subgraph BOB_CORE["2. IBM BOB MULTI-AGENT ORCHESTRATION ENGINE"]
        NORMALIZER --> SUPERVISOR["BOB Agent Supervisor & Workflow Controller"]
        
        subgraph WORKERS["Specialized Worker Agent Mesh"]
            AG_TRIAGE["Incident Triage Agent\n(IBM Granite 3.0 8B Instruct)"]
            AG_RAG["Protocol RAG Agent\n(Granite Embeddings + Vector DB)"]
            AG_DISP["Dynamic Dispatch Optimization Agent\n(Spatial Heuristic Engine)"]
            AG_COMMS["Tactical Comms & Alert Agent\n(IBM Granite 3.0 8B Instruct)"]
        end
        
        SUPERVISOR --> AG_TRIAGE
        SUPERVISOR --> AG_RAG
        SUPERVISOR --> AG_DISP
        SUPERVISOR --> AG_COMMS
        
        AG_TRIAGE -.-> AG_RAG
        AG_RAG -.-> AG_DISP
        AG_DISP -.-> AG_COMMS
        
        subgraph SAFETY["Safety & Verification Boundary"]
            AG_VERIFY["Verification & Policy Agent\n(IBM Granite Guardian 3.0 8B)"]
        end
        
        AG_TRIAGE --> AG_VERIFY
        AG_RAG --> AG_VERIFY
        AG_DISP --> AG_VERIFY
        AG_COMMS --> AG_VERIFY
    end

    subgraph KNOWLEDGE["3. KNOWLEDGE & TELEMETRY STORES"]
        VDB[("Vector Knowledge Base (Milvus / Chroma)\n• HazMat ERG 2024\n• NFPA 1710/1221\n• FEMA ICS Protocols")]
        AG_RAG <--> VDB
        FLEET_DB[("Live Municipal Fleet Telemetry\n• Fire Engines & Ladders\n• ALS/BLS Ambulances\n• Police Cruisers")]
        AG_DISP <--> FLEET_DB
        HOSP_DB[("Hospital Trauma Grid\n• Level 1-4 Trauma Bays\n• Burn ICU Beds")]
        AG_DISP <--> HOSP_DB
    end

    subgraph HITL_TIER["4. HUMAN-IN-THE-LOOP DISPATCHER TIER"]
        AG_VERIFY --> WS_GATEWAY["WebSocket Real-Time Event Gateway"]
        WS_GATEWAY <--> DISP_UI["Dispatcher Web Cockpit\n• Real-Time GIS Map (Leaflet/MapLibre)\n• Incident Triage Card & Acuity\n• Grounded SOP Citations\n• 1-Click Dispatch Approval / Override"]
        DISP_UI --> DISPATCHER{"Certified Dispatcher\n(Human Telecommunicator)"}
    end

    subgraph ACTUATION["5. ACTUATION & EXTERNAL INTEGRATION LAYER"]
        DISPATCHER -- "Approved Dispatch Plan" --> ACT_BUS["Secure Action Execution Bus"]
        ACT_BUS --> CAD_GW["Municipal CAD Interface (NENA i3 / APCO P25)"]
        ACT_BUS --> MDT_GW["First Responder MDT Broadcast"]
        ACT_BUS --> REV911_GW["Civilian Reverse-911 Alert (CAP/SMS)"]
        ACT_BUS --> FHIR_GW["Hospital Trauma Pre-Notification (HL7/FHIR)"]
    end
```

---

## 3. Subsystem Layer Specifications

### 3.1 Layer 1: Ingestion & Data Sanitization Layer
* **Protocol Support**:
  * SIP/RTP Voice Streams converted via low-latency speech-to-text (ASR) producing streaming timestamped transcripts.
  * HTTPS/REST citizen web reports with geolocations, photographs, and casualty checklists.
  * MQTT/Webhook payloads from urban sensors (acoustic gunshot detection, flood depth gauges, industrial chemical sniffer nodes).
* **PII Redaction Pipeline**:
  * Ingested text is processed through an in-memory token-scrubber.
  * Phone numbers, social security numbers, full legal names, and exact private residential unit identifiers are transformed into ephemeral privacy-preserving tokens (`[PERSON_1]`, `[PHONE_MASKED]`).
  * Tactical geospatial data (street names, cross-streets, landmarks, hazardous facility codes) is explicitly preserved.

### 3.2 Layer 2: IBM BOB Multi-Agent Orchestration Layer
Orchestrated via IBM BOB (Build on BOB / watsonx workflow pattern), the agent engine maintains an explicit directed acyclic graph (DAG) state machine:

```mermaid
stateDiagram-v2
    [*] --> IngestEvent
    IngestEvent --> SanitizePII
    SanitizePII --> RunTriageAgent
    
    state ForkParallel {
        [*] --> RunProtocolRAG
        [*] --> QueryFleetTelemetry
    }
    
    RunTriageAgent --> ForkParallel
    ForkParallel --> RunDispatchOptimization
    RunDispatchOptimization --> RunTacticalComms
    RunTacticalComms --> GraniteGuardianVerification
    
    state GuardianCheck <<choice>>
    GraniteGuardianVerification --> GuardianCheck
    GuardianCheck --> SurfaceToDispatcher: Guardrail Passed (Score >= 0.95)
    GuardianCheck --> FallbackDegradedMode: Guardrail Failed / Inconsistent
    
    SurfaceToDispatcher --> HumanReview
    
    state HumanReviewDecision <<choice>>
    HumanReview --> HumanReviewDecision
    HumanReviewDecision --> ExecuteDispatch: Dispatcher Approves
    HumanReviewDecision --> ManualEditDispatch: Dispatcher Overrides
    
    ExecuteDispatch --> [*]
    ManualEditDispatch --> ExecuteDispatch
```

### 3.3 Layer 3: Knowledge Base & RAG Subsystem
* **Storage Engine**: Embedded persistent vector database (ChromaDB / Milvus) paired with a high-speed BM25 inverted lexical index.
* **Embeddings**: `ibm/granite-embedding-125m-english` generating 768-dimensional normalized dense vectors.
* **Corpus Segmentation**: 
  * Granular chunking: 512 tokens with 64-token overlap.
  * Rich metadata headers: `{doc_id, standard, section, hazard_type, initial_isolation_distance_m, updated_at}`.
* **Query Routing**:
  * Semantic search retrieves conceptual matches (e.g., "how to extinguish electric vehicle fire").
  * Lexical BM25 search retrieves exact alphanumeric standard identifiers (e.g., "UN 1017 Chlorine", "NFPA 1710 Section 5.2").
  * Results are fused via Reciprocal Rank Fusion (RRF).

### 3.4 Layer 4: Presentation & Human-in-the-Loop Cockpit
* **Frontend Technology**: High-performance single-page web cockpit built with modern semantic HTML5, Tailwind CSS, Leaflet/MapLibre GIS mapping, and asynchronous WebSockets.
* **Dispatcher Capabilities**:
  * Multi-incident radar feed sorted by clinical severity.
  * Grounded reasoning panel showing exact text excerpts from retrieved SOPs.
  * Interactive unit assignment map with estimated arrival time (ETA) isochrones.
  * Instant 1-click confirmation or granular apparatus re-assignment controls.

### 3.5 Layer 5: Downstream Actuation & Gateway Layer
* **NENA i3 / CAD Integration**: Formats approved dispatch instructions into standard APCO/NENA compliant JSON/XML payloads for legacy Computer-Aided Dispatch platforms (Hexagon, Motorola, CentralSquare).
* **Responder MDT Broadcast**: Sends formatted tactical briefs directly to first responder ruggedized vehicle displays.
* **Civilian Alert Gateway**: Outputs standardized Common Alerting Protocol (CAP v1.2) XML feeds for wireless emergency alerts (WEA) and reverse-911 SMS broadcasters.

---

## 4. Formal Data Contracts & JSON Schemas

All inter-agent communication in ResQ-AI is governed by strict Pydantic schemas:

### 4.1 Ingested Emergency Event Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "EmergencyEvent",
  "type": "object",
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "source_type": { "type": "string", "enum": ["911_CALL", "CITIZEN_SOS", "IOT_SENSOR", "MUNICIPAL_CCTV"] },
    "raw_transcript": { "type": "string" },
    "sanitized_transcript": { "type": "string" },
    "location": {
      "type": "object",
      "properties": {
        "address": { "type": "string" },
        "cross_street": { "type": "string" },
        "latitude": { "type": "number" },
        "longitude": { "type": "number" },
        "zone_id": { "type": "string" }
      },
      "required": ["latitude", "longitude"]
    }
  },
  "required": ["event_id", "timestamp", "source_type", "sanitized_transcript", "location"]
}
```

### 4.2 Triage Agent Output Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "TriageAssessment",
  "type": "object",
  "properties": {
    "incident_category": { 
      "type": "string", 
      "enum": ["STRUCTURE_FIRE", "HAZMAT_SPILL", "MASS_CASUALTY", "ACTIVE_THREAT", "FLASH_FLOOD", "CARDIAC_ARREST", "VEHICLE_COLLISION"] 
    },
    "severity_level": { "type": "string", "enum": ["PRIORITY_1_CRITICAL", "PRIORITY_2_URGENT", "PRIORITY_3_DELAYED", "PRIORITY_4_MINOR"] },
    "severity_score": { "type": "integer", "minimum": 0, "maximum": 100 },
    "trapped_individuals": { "type": "integer", "minimum": 0 },
    "estimated_casualties": { "type": "integer", "minimum": 0 },
    "identified_hazards": {
      "type": "array",
      "items": { "type": "string" }
    },
    "clinical_justification": { "type": "string" }
  },
  "required": ["incident_category", "severity_level", "severity_score", "trapped_individuals", "estimated_casualties", "identified_hazards", "clinical_justification"]
}
```

### 4.3 Dispatch Plan Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DispatchRecommendation",
  "type": "object",
  "properties": {
    "dispatch_id": { "type": "string", "format": "uuid" },
    "recommended_units": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "unit_id": { "type": "string" },
          "unit_type": { "type": "string", "enum": ["ENGINE", "LADDER", "RESCUE_SQUAD", "AMBULANCE_ALS", "AMBULANCE_BLS", "HAZMAT_TENDER", "POLICE_PATROL"] },
          "station_id": { "type": "string" },
          "estimated_arrival_sec": { "type": "integer" },
          "assigned_role": { "type": "string" }
        },
        "required": ["unit_id", "unit_type", "station_id", "estimated_arrival_sec", "assigned_role"]
      }
    },
    "target_hospital": {
      "type": "object",
      "properties": {
        "hospital_id": { "type": "string" },
        "name": { "type": "string" },
        "trauma_level": { "type": "integer", "minimum": 1, "maximum": 4 },
        "available_trauma_bays": { "type": "integer" },
        "eta_minutes": { "type": "number" }
      }
    },
    "perimeter_isolation_radius_meters": { "type": "number" },
    "sops_referenced": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "document_id": { "type": "string" },
          "section": { "type": "string" },
          "citation_text": { "type": "string" }
        }
      }
    }
  },
  "required": ["dispatch_id", "recommended_units", "perimeter_isolation_radius_meters", "sops_referenced"]
}
```

---

## 5. Sequence Diagram: Emergency Event Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Caller as 911 Caller / Citizen
    participant Ingest as Ingestion & PII Engine
    participant BOB as IBM BOB Supervisor
    participant Triage as Triage Agent (Granite 8B)
    participant RAG as Protocol RAG (Vector DB)
    participant Dispatch as Dispatch Agent (Optimizer)
    participant Comms as Tactical Comms Agent
    participant Guard as Granite Guardian Safety
    actor Dispatcher as Human Dispatcher (Console)
    participant Responders as First Responders (MDT)

    Caller->>Ingest: Emergency Audio / Text Stream
    Ingest->>Ingest: Scrub PII (Names, Phone numbers)
    Ingest->>BOB: Normalized EmergencyEvent JSON
    
    BOB->>Triage: Execute Clinical & Severity Triage
    Triage-->>BOB: TriageAssessment (Priority 1, HazMat UN 1203)
    
    par Protocol Retrieval and Fleet Analysis
        BOB->>RAG: Query ERG 2024 & NFPA for UN 1203 + Tanker
        RAG-->>BOB: ERG Guide 128 (Isolation: 800m, Foam: AR-AFFF)
    and
        BOB->>Dispatch: Query Available Units & Isochrones
        Dispatch-->>BOB: Matched Units (Eng-4, HazMat-1, Med-12, Lad-2)
    end
    
    BOB->>Comms: Generate MDT Brief & Reverse-911 Text
    Comms-->>BOB: MDT Radio Copy & Civilian SMS
    
    BOB->>Guard: Verify Factual Grounding & Policy Adherence
    Guard-->>BOB: Safety Score: 0.99 (Passed Verification)
    
    BOB->>Dispatcher: Render Live Recommendation Card on Cockpit
    Note over Dispatcher: Dispatcher reviews map, citations, and units (Avg 6-10s)
    
    alt Dispatcher Approves
        Dispatcher->>BOB: 1-Click "Approve Dispatch"
        BOB->>Responders: Transmit CAD Alert & MDT Routing
    else Dispatcher Modifies
        Dispatcher->>BOB: Swap Med-12 for Med-04 & Approve
        BOB->>Responders: Transmit Modified CAD Dispatch
    end
```

---

## 6. Resilience, Fault Tolerance & High Availability

| Failure Mode | Detection Mechanism | Automated Mitigation Strategy |
| :--- | :--- | :--- |
| **External LLM Cloud API Latency Spike (> 4.0s)** | In-flight request deadline timer | Automatically aborts remote call and triggers local quantized Granite container or cached heuristic fallback. |
| **Vector DB Index Degradation** | Health check probe ping every 5s | Direct fallback to static in-memory BM25 index of core emergency protocols. |
| **Malformed LLM JSON Payload** | Pydantic validation error exception | Automated BOB repair loop: re-prompts model with validation error or falls back to rule-based parser. |
| **Granite Guardian Flagged Hallucination** | Guardrail confidence score $< 0.95$ | Mark recommendation as `UNVERIFIED_AI`, suppress automated unit pre-selection, and alert dispatcher to perform manual lookup. |
| **Total Telecommunication Blackout** | Local PSAP edge deployment | ResQ-AI runs entirely within an air-gapped on-premise local area network (LAN) using edge-hosted Granite models. |

---

## 7. Infrastructure Deployment & Scalability

ResQ-AI is packaged as a cloud-native, microservices-based application deployable across **Red Hat OpenShift on IBM Cloud** or on-premises municipal edge infrastructure:

* **Container Architecture**:
  * `resq-ai-gateway`: Reverse proxy, SSL termination, rate limiting, and WebSocket connection pool.
  * `resq-ai-orchestrator`: Python FastAPI / IBM BOB workflow state machine service.
  * `resq-ai-vectorstore`: ChromaDB / Milvus distributed vector storage cluster.
  * `resq-ai-frontend`: Nginx container serving static responsive UI assets with real-time WebSocket bindings.
* **Resource Footprint**:
  * Granite 3.0 8B model instances can run on 1x NVIDIA A10G (24GB VRAM) or IBM Cloud watsonx serverless endpoint.
  * Total microservice footprint (excluding LLM weights): $< 2$ vCPUs, $< 4$ GB RAM, allowing deployment on standard municipal server racks.
