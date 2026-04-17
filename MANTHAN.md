# MANTHAN SYSTEM (0-DRIFT SPEC)

This repository implements **Manthan v1** — a deterministic Decision Infrastructure system.

This file is the **single source of truth**.

If ANY code conflicts:
→ THIS FILE WINS

---

# CORE PRINCIPLES

* Deterministic
* Explainable
* Versioned
* No runtime learning

---

# DECISION PIPELINE

STRICT ORDER:

1. Validate → REJECT
2. Completeness → ESCALATE
3. Evaluate rules (first match wins)
4. No match → ESCALATE

NO deviation allowed.

---

# OUTCOMES

ALLOW | BLOCK | ESCALATE | REJECT ONLY

---

# SCHEMA RULES

* Missing → ESCALATE
* Invalid → REJECT
* Extra → REJECT
* No defaults
* No guessing

---

# RULE SYSTEM

* grouped
* ordered
* first-match-wins

Each rule:

* id
* group
* order
* condition
* outcome
* optional requires

---

# AI BOUNDARY

AI is NOT part of decision.

Allowed:

* suggestions
* explanations

Forbidden:

* decision making
* rule execution

---

# VERSIONING

Every decision MUST include:

* schema_version
* rule_version

No cross-version execution.

---

# UNCERTAINTY

Missing data OR no rule:
→ ESCALATE

---

# FINAL RULE

If system becomes non-deterministic:
→ STOP
