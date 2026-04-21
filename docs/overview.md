\# Manthan Overview



Manthan is a \*\*deterministic decision infrastructure\*\*.



It evaluates input against:

\- a schema (what data is required)

\- a rule set (what is allowed)



and produces a \*\*decision result\*\*.



\---



\## Core Properties



\- Deterministic: same input → same outcome

\- Non-bypassable: decisions cannot be overridden

\- Auditable: every decision is explainable

\- Domain-agnostic: no business logic in core



\---



\## Decision Outputs



Manthan returns:



\- INVALID → input is malformed

\- INCOMPLETE → missing required data

\- DECIDED → evaluation completed



If DECIDED:



\- ALLOW

\- BLOCK

\- ESCALATE

