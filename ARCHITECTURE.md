\# Manthan v1 — Architecture Contract



\## 0. Purpose



This document defines the \*\*structural, behavioral, and data boundaries\*\* of the Manthan system.



Manthan is a \*\*deterministic decision infrastructure\*\*.



> Same Decision Input → Same Decision Outcome



No component in this repository may violate this principle.



\---



\## 1. System Layers



\### 1.1 Core (Deterministic Evaluation Layer)



\*\*Folders:\*\*



\* `/core`

\* `/schema`

\* `/rules`



\*\*Responsibilities:\*\*



\* Validate Decision Input

\* Enforce schema correctness

\* Check completeness

\* Apply decision rules

\* Produce Decision Outcome (ALLOW | BLOCK | ESCALATE | REJECT)



\*\*Constraints:\*\*



\* MUST be pure and deterministic

\* MUST NOT depend on external services

\* MUST NOT use AI/ML

\* MUST NOT mutate inputs

\* MUST NOT access raw system data



\---



\### 1.2 Signals \& Intelligence Layer (Pre-processing)



\*\*Folders:\*\*



\* `/signals`

\* `/classification`

\* `/ai`



\*\*Responsibilities:\*\*



\* Transform raw events into structured signals

\* Assist in classification and enrichment

\* Generate Draft Proposals (AI)



\*\*Constraints:\*\*



\* MUST NOT perform decision evaluation

\* MUST NOT modify rules or schema

\* MUST NOT directly produce Decision Outcome

\* AI outputs MUST be treated as untrusted suggestions



\---



\### 1.3 Event \& Ingestion Layer



\*\*Folders:\*\*



\* `/events`

\* `/webhook`



\*\*Responsibilities:\*\*



\* Receive external events (e.g., GitHub webhooks)

\* Normalize inputs

\* Trigger decision pipeline



\*\*Constraints:\*\*



\* MUST NOT apply business rules

\* MUST NOT bypass schema validation

\* MUST NOT construct partial or implicit inputs



\---



\### 1.4 Decision Input Construction Boundary



\*\*Definition:\*\*

The system constructs \*\*Decision Input\*\* using:



\* User Input (confirmed truth)

\* System Data (derived signals only)



\*\*Constraints:\*\*



\* MUST include only schema-defined fields

\* MUST exclude raw system data

\* MUST be minimal, structured, and auditable

\* Missing required fields → ESCALATE

\* Invalid fields → REJECT



\---



\### 1.5 Execution Layer (Post-decision)



\*\*Folder:\*\*



\* `/execution`



\*\*Responsibilities:\*\*



\* Map Decision Outcome → system actions



\*\*Constraints:\*\*



\* MUST NOT influence decision outcome

\* MUST NOT re-evaluate decisions

\* MUST act only on final Decision Outcome



\---



\### 1.6 Testing, Simulation \& Audit



\*\*Folders:\*\*



\* `/tests`

\* `/simulation`

\* `/coverage`



\*\*Responsibilities:\*\*



\* Validate determinism

\* Replay decision scenarios

\* Detect regressions



\*\*Constraints:\*\*



\* MUST use fixed inputs

\* MUST verify outcome consistency

\* MUST NOT depend on external state



\---



\### 1.7 Data Layer



\*\*Folder:\*\*



\* `/data`



\*\*Responsibilities:\*\*



\* Store structured, minimal, derived data



\*\*Constraints:\*\*



\* MUST NOT expose raw internal system data

\* MUST NOT bypass schema

\* MUST NOT introduce hidden inputs into decisions



\---



\### 1.8 Cost \& Observability Layer



\*\*Folder:\*\*



\* `/cost`



\*\*Responsibilities:\*\*



\* Track evaluation cost

\* Provide observability



\*\*Constraints:\*\*



\* MUST NOT affect decision outcome

\* MUST remain read-only relative to evaluation



\---



\### 1.9 Documentation Layer



\*\*Folders:\*\*



\* `/docs`

\* `/docs-site`



\*\*Responsibilities:\*\*



\* Define system behavior (docs)

\* Present product interface (docs-site)



\*\*Constraints:\*\*



\* MUST reflect actual system behavior

\* MUST NOT define logic independently of code



\---



\## 2. Decision Pipeline (Immutable Flow)



All decisions MUST follow this exact order:



1\. Schema Validation

2\. Completeness Check

3\. Rule Evaluation

4\. Decision Outcome



\*\*Outcomes:\*\*



\* ALLOW → valid and permitted

\* BLOCK → valid but disallowed

\* ESCALATE → missing required data

\* REJECT → invalid input



No step may be skipped.



\---



\## 3. Determinism Rules



\* Same Decision Input MUST produce same Decision Outcome

\* No randomness allowed

\* No time-based logic allowed inside core

\* No external API calls inside core

\* Rule evaluation MUST be versioned



\---



\## 4. AI Boundary (Critical)



AI is allowed ONLY in:



\* `/ai`

\* `/classification` (optional assistance)



AI MUST:



\* Generate Draft Proposals only

\* Never produce final Decision Input

\* Never modify rules/schema

\* Never participate in evaluation



Violation of this boundary breaks system trust.



\---



\## 5. Security \& Integrity



\* User Input must be explicitly confirmed

\* Confirmed input must be immutable

\* Decision Input must be auditable

\* Hashing/signatures may be used for integrity



\---



\## 6. Non-Negotiable Constraints



The following are strictly prohibited:



\* Injecting hidden fields into Decision Input

\* Modifying rules at runtime

\* Using AI in decision evaluation

\* Bypassing schema validation

\* Re-evaluating past decisions with new rules

\* Mixing execution logic with decision logic



\---



\## 7. System Identity



Manthan is NOT:



\* An AI system

\* A recommendation engine

\* A workflow engine



Manthan IS:



> A deterministic decision infrastructure where every decision is traceable, auditable, and built for trust.



\---

\# MANTHAN ARCHITECTURE



Manthan is a \*\*deterministic decision infrastructure\*\*.



It evaluates structured input against predefined rules to produce a \*\*consistent, auditable decision outcome\*\*.



\---



\# 🧠 CORE PRINCIPLE



Same Decision Input → Same Decision Outcome



\* No randomness

\* No hidden defaults

\* No runtime mutation

\* No AI in decision making



\---



\# 🧩 SYSTEM PIPELINE



Signals → Mapping → Validation → Rule Evaluation → Decision



\---



\# 🧱 MODULE ARCHITECTURE



\## 1. CORE (IMMUTABLE)



Location: `/core`



Responsible for deterministic decision logic.



\* engine.ts → evaluates rules and produces outcome

\* validator.ts → validates schema and input correctness

\* compiler.ts → compiles rules into deterministic rule\_set



⚠️ These modules are immutable and must not be modified.



\---



\## 2. SIGNALS



Location: `/signals`



Handles raw input ingestion.



\* accepts external data (PRs, APIs, events)

\* normalizes into structured signals



Each signal:



{

id,

source,

namespace,

key,

value

}



AI may be used ONLY here for signal generation.



\---



\## 3. MAPPING



Location: `/signals/mapper.ts`



Converts signals → decision\_input



\* Only NON\_AI signals allowed

\* Enforces schema alignment

\* Ensures type safety



Mapping is the strict boundary between external data and system input.



\---



\## 4. SCHEMA



Location: `/schema`



Defines required input structure.



Each field:



{

type: string | number | boolean,

required: boolean

}



Rules:



\* Missing required → ESCALATE

\* Invalid type → REJECT

\* Extra field → REJECT



\---



\## 5. RULES



Location: `/rules`



Defines allowed behavior.



Each rule:



{

conditions,

outcome: ALLOW | BLOCK

}



Rules are:



\* deterministic

\* explicit

\* versioned



\---



\## 6. COMPILATION



Handled by `/core/compiler.ts`



\* validates rules

\* detects conflicts

\* produces precompiled rule\_set



⚠️ Compilation must happen BEFORE execution



\---



\## 7. EXECUTION



Location: `/execution`



Provides system interface.



\* SDK

\* API

\* integrations



ExecutionContext:



{

schema,

rule\_set

}



Execution must:



\* NOT compile rules

\* NOT modify input

\* NOT include business logic



\---



\## 8. INTEGRATION



Location: `/webhook`, `/events`



Connects external systems.



Examples:



\* GitHub PR Gate

\* API endpoints



Flow:



External Event → Signals → Mapping → Execution → Decision



Integration layer must NOT make decisions.



\---



\## 9. AI (OPTIONAL)



Location: `/ai`



Used ONLY for:



\* signal generation

\* suggestions



AI must NEVER:



\* influence decisions

\* bypass mapping



\---



\## 10. ANALYTICS



Location:



\* `/coverage`

\* `/cost`

\* `/classification`



Provides insights:



\* rule usage

\* missing coverage

\* performance metrics



⚠️ Analytics must NOT affect decisions



\---



\# 🧾 DECISION OUTCOMES



Manthan produces exactly four outcomes:



\* ALLOW → proceed

\* BLOCK → prevent

\* ESCALATE → insufficient data / no rule match

\* REJECT → invalid input



\---



\# 🧪 VALIDATION FLOW



1\. Validate input against schema

2\. Check completeness

3\. Apply rules

4\. Return outcome



\---



\# 🔒 SYSTEM GUARANTEES



\* Deterministic decisions

\* Auditability (input + rule version)

\* No hidden behavior

\* Strict input validation



\---



\# 🚫 FORBIDDEN



\* AI in decision logic

\* runtime rule compilation

\* hidden defaults

\* input mutation

\* decision overrides outside engine



\---



\# 🧠 DESIGN PRINCIPLE



Understanding (AI) ≠ Decision (Deterministic System)



Manthan enforces decisions based on defined rules.



\---



\# 🔁 EXTENSIBILITY



System supports:



\* new integrations

\* new schemas

\* new rule versions

\* analytics modules



Without modifying core.



\---



\# 🔚 FINAL NOTE



Core is stable and complete.



All future development must happen through:



\* extensions

\* integrations

\* tooling



NOT by modifying core behavior.



\## 8. Change Policy



Any change must:



1\. Preserve determinism

2\. Respect layer boundaries

3\. Be versioned

4\. Be testable with fixed inputs



If a change violates any rule in this document, it must be rejected.



\---



