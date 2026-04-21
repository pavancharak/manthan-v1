# Decision Outcomes

Decision outcomes define the **final state of evaluation** in Manthan.

They are **strict, deterministic, and non-overridable**.

---

# 🧠 Outcome Categories

Manthan produces exactly one of the following:

```txt
INVALID
INCOMPLETE
DECIDED → (ALLOW | BLOCK | ESCALATE)
🔴 INVALID
Definition

Input is structurally incorrect or violates schema.

Causes
unknown fields
wrong data types
malformed structure
invalid or null values
schema mismatch
Behavior
Evaluation stops immediately
No rules are executed
Meaning
Input cannot be trusted
🟡 INCOMPLETE
Definition

Input is valid but missing required data.

Causes
required schema fields are missing
mapping did not produce required fields
Behavior
Evaluation stops before rules
No assumptions are made
Meaning
System does not have enough information to decide
🟢 DECIDED
Definition

Input is valid and complete.

Rules are evaluated deterministically.

Possible Decisions
✅ ALLOW

Action is permitted.

A rule matched with outcome = ALLOW
❌ BLOCK

Action is denied.

A rule matched with outcome = BLOCK
⚠️ ESCALATE

System cannot decide safely.

No rule matched
Important Constraint
ESCALATE is NOT uncertainty
ESCALATE = defined system behavior when no rule matches

This is deterministic and intentional.

⚙️ Evaluation Flow
DecisionInput
    ↓
Validation
    ↓
INVALID → return INVALID
    ↓
Completeness Check
    ↓
INCOMPLETE → return INCOMPLETE
    ↓
Rule Evaluation
    ↓
Match → ALLOW / BLOCK
No match → ESCALATE
🔐 Guarantees
exactly one outcome is returned
outcomes are deterministic
outcomes cannot be overridden
same DecisionInput → same DecisionResult
🚫 What Outcomes Must NOT Do

Outcomes must NOT:

trigger workflows
mutate state
call external systems
depend on runtime environment
🧠 Design Principle
Outcome = fact, not action

Manthan decides what is allowed, not what to do next.

🔍 Outcome vs Execution
Layer	Responsibility
Manthan	produce outcome
External	act on outcome
🚀 Summary

Decision outcomes:

represent the final evaluation state
enforce strict system behavior
separate decision from execution
guarantee determinism and auditability