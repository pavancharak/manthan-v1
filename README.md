# Manthan

**Decisions, backed by proof.**

Manthan is a **deterministic decision infrastructure** that ensures every decision is:

- traceable  
- auditable  
- reproducible  
- based on verifiable truth  

---

# 🧠 What Manthan Does

Manthan evaluates structured input against:

- a **Schema** (what data must exist)
- a **Rule Set** (what is allowed)

and produces a **deterministic decision outcome**.

```txt
DecisionInput → Validation → Rules → DecisionResult
⚙️ Core Properties
Deterministic
Same input → same decision
Fail-Closed
No decision is made under uncertainty
Auditable
Every decision includes rule + explanation
Replayable
Decisions can be re-executed and verified
Immutable
Rules and schemas are versioned and locked
📦 Decision Outcomes

Manthan produces exactly one:

INVALID      → malformed input
INCOMPLETE   → missing required data
DECIDED      → evaluation complete

If DECIDED:

ALLOW | BLOCK | ESCALATE
🧱 Architecture
Intent + Version
        ↓
Schema + Rule Set
        ↓
Signals (optional) → Mapping
        ↓
DecisionInput
        ↓
Decision Engine (deterministic)
        ↓
DecisionResult
        ↓
Event Log (hash)
        ↓
Replay + Verification
📁 Project Structure
core/        → engine, evaluator, types
schema/      → input definitions (versioned)
rules/       → decision logic (versioned)
signals/     → ingestion + mapping layer
execution/   → API + SDK layer
scripts/     → verification + tooling
tests/       → full system test coverage
docs/        → system specification
🔄 Execution Modes
1. Decision Input Mode
executeDecisionInputRequest({
  intent: "pr_merge_safety",
  intent_version: "v1",
  input: {
    system_data: {
      isApproved: true,
      hasNewCommitsAfterApproval: false
    }
  }
})
2. Signal Batch Mode
executeSignalRequest({
  intent: "pr_merge_safety",
  intent_version: "v1",
  raw_signal_batch: {...},
  mappings: [...]
})
🔐 Trust Model

Manthan enforces:

Do not trust inputs. Prove them.
Signals are untrusted → validated → mapped
Schema defines truth boundary
Rules enforce decisions
Every decision is logged and hashed
🧾 Event Logging

Every decision produces:

{
  "intent": "...",
  "intent_version": "...",
  "decision_input": {...},
  "decision_result": {...},
  "timestamp": "...",
  "hash": "sha256(...)"
}
🔁 Replay & Verification

Logged decisions can be replayed:

Stored Input → Re-execute → Compare

Guarantees:

deterministic correctness
system integrity
auditability
🧪 Commands
# install
npm install

# test
npm test

# build
npx tsc

# full check (build + test)
npm run check

# verify system
npm run verify

# run webhook (dev)
npm run dev:webhook
⚠️ System Constraints

Manthan core MUST NOT:

fetch external data
call APIs
use AI
mutate input
depend on runtime state
🤖 AI Boundary

AI may:

suggest signals
suggest rules

AI must NEVER:

influence decisions
modify rules at runtime
bypass schema or validation
🧠 Design Principle
Decision = Pure Function

DecisionInput → DecisionResult

No side effects. No ambiguity.

🚀 Versioning
v1 = immutable
new behavior → new version
schema/v1 → locked
rules/v1  → locked
📚 Documentation

See /docs for full system specification:

architecture
schema
rules
signals
execution
decision flow
outcomes
🔥 Summary

Manthan is not a rules engine.

It is a trust infrastructure that:

computes decisions deterministically
records them immutably
verifies them cryptographically
replays them reproducibly
📌 Tag
v1.0.0 — Deterministic Decision Infrastructure
🧠 Philosophy

Every decision must be:

traceable, auditable, and built for trust.