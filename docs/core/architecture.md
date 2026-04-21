# Architecture

Manthan is a **deterministic decision infrastructure** that enforces decisions based on verifiable truth.

---

# 🧠 System Overview

```txt
(intent, intent_version)
        ↓
Schema + Rule Set
        ↓
(Optional) Signals → Mapping → DecisionInput
        ↓
Decision Engine (deterministic)
        ↓
Decision Outcome
        ↓
Event Logging → Hash → Replay → Verification
🧱 Core Layers
1. Intent Layer
schema/<intent>/<version>/schema.json
rules/<intent>/<version>/rule_set.json

Defines:

Schema → what data is required
Rule Set → what is allowed
2. Schema Layer

Defines the structure of input:

{
  schema_version: string
  system_fields: Record<string, "string" | "number" | "boolean">
}
Constraints
Only declared fields are allowed
Rules MUST reference:
system_data.<field>
Missing required fields → INCOMPLETE
Invalid structure/types → INVALID
3. Rules Layer

Defines decision logic:

{
  id: string
  group: number
  order: number
  condition: {
    field: string // system_data.<field>
    operator: "eq" | "gt" | "lt"
    value: any
  }
  outcome: "ALLOW" | "BLOCK" | "ESCALATE"
}
Properties
deterministic
ordered (group → order)
pre-compiled before execution
Default Behavior
No rule match → ESCALATE
4. Signals Layer

Handles external data:

Raw Signals → Ingestion → Mapping → DecisionInput
Properties
deterministic mapping
only mapped fields enter core
signals are untrusted until mapped
AI Boundary
AI may generate signals
AI has ZERO influence on decision logic
5. Execution Layer

Entry points:

executeDecisionInputRequest
executeSignalRequest
Responsibilities
enforce intent + intent_version
load schema + rule set
construct decision input
call engine
log decision event
6. Decision Engine (Core)

Execution pipeline:

validate → completeness → evaluate rules → outcome
Outputs
INVALID
INCOMPLETE
DECIDED → (ALLOW | BLOCK | ESCALATE)
Properties
pure function
no external dependencies
deterministic (same input → same output)
7. Trust Layer
Event Logging

Every decision produces an immutable event:

{
  intent: string
  intent_version: string
  decision_input: DecisionInput
  decision_result: DecisionResult
  timestamp: string
  hash: string
}
Hashing
SHA-256
computed over:
intent + intent_version + input + result + timestamp
Replay System
Stored Event → re-execute → compare result
Guarantees
determinism
integrity
reproducibility
Failure Condition
Replay mismatch → SYSTEM INTEGRITY FAILURE
⚠️ System Boundaries
Outside Core
signals
API
integrations
AI
Inside Core
validation
completeness check
rule evaluation
decision output
Core MUST NOT
fetch data
call external APIs
use AI
mutate state
Core ONLY
DecisionInput → DecisionResult
🔐 Determinism Guarantee
Same DecisionInput → Same DecisionResult

Independent of:

time
environment
execution context
🧠 Design Principles
deterministic by design
explicit versioning (no "latest")
fail-closed behavior
no hidden state
strict input validation
full auditability
replayable decisions
cryptographic integrity
🚀 Summary

Manthan is not a rules engine.

It is a Trust Infrastructure that:

computes decisions deterministically
records them immutably
verifies them cryptographically
replays them reproducibly