\# Rule Writing Guide



This document defines how to write correct, deterministic rules in Manthan.



Rules are the \*\*only place where decision logic exists\*\*.



\---



\## Core Principle



Every rule must produce exactly one outcome:



\- ALLOW

\- BLOCK

\- ESCALATE



\---



\## Rule Structure



Each rule must define:



\- id → unique identifier

\- group → priority level

\- order → execution order within group

\- outcome → ALLOW | BLOCK | ESCALATE

\- condition → field + operator + value

\- requires (optional) → required fields



\---



\## Evaluation Model



Rules are evaluated:



1\. Sorted by group (ascending)

2\. Then by order (ascending)

3\. First matching rule wins



\---



\## Rule Priority



Use groups to enforce priority:



\- Group 1 → BLOCK (violations)

\- Group 2 → ESCALATE (uncertainty)

\- Group 3 → ALLOW (safe cases)

\- Group 99 → fallback (fail-closed)



\---



\## Determinism Requirements



Rules must be:



\- deterministic

\- reproducible

\- auditable



\---



\## Allowed Signals



Rules must use:



\- schema-defined fields only

\- verifiable system data



\---



\## Forbidden Signals



Do NOT use:



\- risk\_level

\- confidence

\- AI-generated labels

\- subjective scores



\---



\## Condition Design



Conditions must be:



\- simple (single field)

\- explicit

\- testable



\---



\### Valid Example





IF amount > 10000 → ESCALATE





\---



\### Invalid Example





IF risk is high → ESCALATE ❌





\---



\## Requires Field



Use `requires` when a rule depends on fields:





requires: \["system\_data.amount"]





If required fields are missing:

\- rule is skipped

\- system may return INCOMPLETE



\---



\## Fallback Rule (Mandatory)



Every rule set MUST include a fallback:





{

"id": "fallback\_block",

"group": 99,

"order": 1,

"outcome": "BLOCK",

"condition": {

"field": "system\_data.always\_true",

"operator": "eq",

"value": true

}

}





\---



\## Coverage Requirement



Rules must cover all schema fields.



The compiler enforces:



\- no unused fields

\- no uncovered decision paths



\---



\## Conflict Rules



Two rules must NOT:



\- match the same condition

\- produce different outcomes



The compiler will reject conflicting rules.



\---



\## Escalation Rules



ESCALATE must be:



\- intentional

\- explicit

\- policy-driven



ESCALATE must NOT be used as:



\- fallback

\- error handling

\- default behavior



\---



\## Common Patterns



\### Block violation





IF is\_violation = true → BLOCK





\---



\### Escalate high impact





IF amount > threshold → ESCALATE





\---



\### Allow safe





IF is\_safe = true → ALLOW





\---



\## Anti-Patterns



Avoid:



\- overlapping rules

\- hidden assumptions

\- implicit defaults

\- missing fallback

\- abstract fields



\---



\## Final Checklist



Before adding rules, verify:



\- \[ ] All schema fields are used

\- \[ ] No rule conflicts exist

\- \[ ] Fallback rule is present

\- \[ ] No subjective signals used

\- \[ ] Rules are deterministic

\- \[ ] Outcomes are explicit



\---



\## Final Principle



> Rules must encode truth, not interpretation.



Manthan does not guess.



It evaluates facts and produces deterministic outcomes.

