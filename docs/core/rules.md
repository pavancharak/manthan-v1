# Rules (Decision Rules)

Rules define **what is allowed** based on the input defined by the schema.

They are the **deterministic logic layer** of Manthan.

---

# 🧠 Purpose

Rules:

- evaluate DecisionInput
- enforce constraints
- produce deterministic outcomes

---

# 📁 Location

Rules are versioned per intent:

```txt
rules/<intent>/<version>/rule_set.json
📦 Structure
{
  "rule_version": "v1",
  "rules": [
    {
      "id": "block-unapproved",
      "group": 1,
      "order": 1,
      "condition": {
        "field": "system_data.isApproved",
        "operator": "eq",
        "value": false
      },
      "outcome": "BLOCK"
    }
  ]
}
🔑 Rule Fields
id
unique identifier
used for audit and debugging
group
defines priority tier
lower value = higher priority
order
defines execution order within a group
condition
{
  field: string // must be system_data.<field>
  operator: "eq" | "gt" | "lt"
  value: any
}
outcome
ALLOW | BLOCK | ESCALATE
⚙️ Execution Model

Rules are evaluated in deterministic order:

group (ascending)
    ↓
order (ascending)
    ↓
first matching rule wins
🧠 Evaluation Logic
DecisionInput
    ↓
evaluate rules sequentially
    ↓
first match → return outcome
    ↓
no match → ESCALATE
🔁 Default Behavior
No rule matches → ESCALATE

This is mandatory and deterministic.

🔗 Relationship with Schema

Rules depend strictly on schema.

Constraints
every referenced field must exist in schema.system_fields
rules MUST reference:
system_data.<field>
unknown fields → INVALID (at validation stage)
⚠️ Determinism Requirements

Rules MUST be:

explicit
ordered
complete
deterministic
🚫 What Rules Must NOT Do

Rules must NOT:

call external APIs
depend on time or randomness
mutate input
include hidden logic
rely on implicit defaults
🧠 No Ambiguity Principle
Every valid and complete input must produce a deterministic outcome

If no rule matches:

→ ESCALATE
🔐 Versioning

Rules are immutable per version:

rules/<intent>/v1 → never change
rules/<intent>/v2 → new version
📊 Outcomes
ALLOW

Action is permitted.

BLOCK

Action is denied.

ESCALATE

No rule matched.

🧠 Design Principle
Rules define what is allowed, not how to compute it
🚀 Summary

Rules:

enforce deterministic decision logic
operate strictly on schema-defined fields
are versioned and immutable
guarantee consistent outcomes for the same DecisionInput