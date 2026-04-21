# Execution Layer

The execution layer is the **entry point into Manthan**.

It orchestrates the flow between external input and the deterministic decision engine.

---

# 🧠 Responsibilities

The execution layer is responsible for:

- enforcing intent + intent_version
- loading schema and rule set
- constructing DecisionInput
- invoking the decision engine
- logging the decision event

---

# ⚙️ Execution Modes

Manthan supports two execution modes:

---

## 1. Decision Input Mode

Used when input is already structured.

---

### Function

```ts
executeDecisionInputRequest({
  intent: string
  intent_version: string
  input: DecisionInput
  debug?: boolean
})
Example
{
  intent: "pr_merge_safety",
  intent_version: "v1",
  input: {
    system_data: {
      isApproved: true,
      hasNewCommitsAfterApproval: false
    }
  }
}
2. Signal Batch Mode

Used when raw signals must be transformed into DecisionInput.

Function
executeSignalRequest({
  intent: string
  intent_version: string
  raw_signal_batch: unknown
  mappings?: SignalFieldMapping[]
  debug?: boolean
})
Flow
Raw Signals
    ↓
Ingestion
    ↓
Mapping
    ↓
DecisionInput
    ↓
Decision Engine
⚙️ Intent Loading

Execution always loads:

schema/<intent>/<version>/schema.json
rules/<intent>/<version>/rule_set.json
Guarantees
explicit versioning (no "latest")
deterministic execution
reproducibility across time
⚠️ Required Fields

All execution requests MUST include:

intent: string
intent_version: string
Failure Behavior

Invalid or missing values:

→ 400 error
→ invalid_intent / invalid_intent_version
📦 Decision Input
DecisionInput = {
  user_input?: Record<string, any>
  system_data?: Record<string, any>
}
Constraints
must conform to schema
only system_data is used in rule evaluation
unknown or extra fields → INVALID
🔍 Execution Pipeline
Request
    ↓
Validate payload
    ↓
Load intent (schema + rules)
    ↓
Prepare DecisionInput
    ↓
Execute engine
    ↓
Log event (with hash)
    ↓
Return result
🧠 Debug Mode

Optional flag:

debug?: boolean
Behavior

When enabled:

validation results are exposed
completeness status is included
rule evaluation trace is returned
Constraint

Debug mode:

does NOT affect decision outcome
📊 Response Structure
Decision Input Mode
{
  mode: "decision_input"
  intent: string
  intent_version: string
  decision_input: DecisionInput
  decision_result: DecisionResult
  rule_set: RuleSet
}
Signal Batch Mode
{
  mode: "signal_batch"
  intent: string
  intent_version: string
  signal_batch: SignalBatch
  mapping_result: DecisionInputMappingResult
  decision_result: DecisionResult
  rule_set: RuleSet
}
🔐 Event Logging

Every execution produces an immutable event:

{
  intent: string
  intent_version: string
  decision_input: DecisionInput
  decision_result: DecisionResult
  timestamp: string
  hash: string
}
Properties
append-only
non-blocking
deterministic hashing
replay-safe
⚠️ Execution Guarantees
deterministic execution
no hidden state
no mutation of input
no external data access
no AI influence
🚫 What Execution Does NOT Do

The execution layer does NOT:

fetch data
store state
modify rules
retry decisions
execute business workflows
🧠 Design Principle
Execution = orchestration, not logic

All decision logic lives in the engine.

🚀 Summary

The execution layer:

bridges external systems with the decision engine
enforces strict versioned execution
ensures deterministic behavior
logs every decision for audit and replay