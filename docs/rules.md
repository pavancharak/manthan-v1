\# Rules



Rules define decision logic.



Each rule produces:



\- ALLOW

\- BLOCK

\- ESCALATE



\---



\## Evaluation



\- rules are evaluated in order

\- first matching rule wins

\- no match → ESCALATE (or fallback rule)



\---



\## Requirements



\- must be deterministic

\- must use schema fields only

\- must be complete (no gaps)



\---



\## Principle



Rules encode policy, not interpretation.

