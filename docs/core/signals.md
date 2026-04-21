# Signals (External Data Layer)

Signals represent **external data inputs** that are transformed into DecisionInput.

They define the **boundary between external systems and the deterministic core**.

---

# 🧠 Purpose

Signals:

- capture raw external events or data
- normalize inputs into a structured format
- map external data to schema-defined fields
- ensure only deterministic, validated data enters the core

---

# ⚙️ Signal Flow

```txt
Raw Signals
    ↓
Ingestion (validation + normalization)
    ↓
Mapping
    ↓
DecisionInput.system_data
📦 Signal Structure
{
  id: string
  source: string
  namespace: string
  key: string
  value: unknown
}
🔑 Fields
id
unique identifier
required for traceability
must be non-empty string
source

Defines origin:

NON_AI | AI | SYSTEM
namespace

Logical grouping:

"pr" | "user" | "payment" | ...
key

Represents the signal field:

"isApproved"
"hasNewCommitsAfterApproval"
value

Raw value of the signal.

Must be compatible with schema type after mapping.

🔄 Mapping to DecisionInput

Signals are converted into:

DecisionInput = {
  system_data: {
    <field>: value
  }
}
Mapping Definition
{
  source: string
  namespace: string
  key: string
  target_field: string
}
Example
{
  source: "NON_AI",
  namespace: "pr",
  key: "isApproved",
  target_field: "isApproved"
}
⚠️ Critical Constraints
1. Mapping Must Match Schema
target_field ∈ schema.system_fields

Violation:

→ INVALID
2. Deterministic Mapping
Same signals → same DecisionInput

No randomness, heuristics, or inference allowed.

3. No Direct Signal Usage

Rules MUST NOT use signals directly:

Rules → use system_data only
🔐 Trust Boundary

Signals are untrusted by default.

They become usable only after:

Ingestion → Validation → Mapping
🤖 AI Boundary

Signals may originate from AI:

source: "AI"
Constraints
AI signals are treated the same as all signals
AI cannot influence decision logic directly
AI output must pass ingestion + mapping
AI cannot bypass schema or rules
🚫 What Signals Must NOT Do

Signals must NOT:

bypass schema validation
directly affect rule evaluation
introduce non-determinism
include hidden transformations
🧠 Design Principle
Signals describe the world
Schema defines what matters
Rules decide what is allowed
🔍 Failure Modes
Invalid Signal (Ingestion Failure)
missing id
invalid structure
unsupported format
→ REJECT during ingestion
Mapping Failure
no mapping defined
target_field not in schema
→ INVALID
Missing Data
required schema field not populated
→ INCOMPLETE
🚀 Summary

Signals:

connect external systems to Manthan
are normalized and mapped into schema-defined input
enforce strict trust boundaries
never directly influence decision logic