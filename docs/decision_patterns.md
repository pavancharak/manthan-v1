\# Manthan Decision Patterns (Conceptual)



This document defines the \*\*universal decision patterns\*\* used in Manthan.



These are NOT rules, NOT schema, and NOT code.



They are the \*\*mental model\*\* for designing correct decision systems.



\---



\## Core Principle



Every decision in Manthan must result in exactly one outcome:



\- ALLOW

\- BLOCK

\- ESCALATE



\---



\## The Only 4 Situations



All decision systems reduce to these four situations:



\---



\### 1. Violation → BLOCK



If something is clearly wrong or violates constraints:



→ BLOCK



Examples:

\- policy violation

\- invalid state

\- unauthorized action



\---



\### 2. Uncertainty → ESCALATE



If the system cannot safely decide:



→ ESCALATE



Examples:

\- high impact action

\- insufficient confidence in safety

\- requires human or external authority



\---



\### 3. Safe → ALLOW



If the system is confident the action is safe:



→ ALLOW



Examples:

\- verified input

\- low-risk operation

\- known safe path



\---



\### 4. Unknown → BLOCK (Fail-Closed)



If a case is not explicitly handled:



→ BLOCK



This ensures:

\- no silent allow

\- no undefined behavior

\- strict safety guarantees



\---



\## Important Distinctions



\### ESCALATE is a decision



ESCALATE does NOT mean failure.



It means:



> "The correct decision is to defer to a higher authority."



\---



\### INCOMPLETE is NOT a decision



INCOMPLETE means:



> "The system cannot decide yet due to missing data."



It must be resolved before evaluation.



\---



\### REJECT is NOT part of core



REJECT is handled by the operator layer.



It represents invalid input, not a decision outcome.



\---



\## Determinism Requirement



All decisions must be based on:



\- verifiable signals

\- reproducible data

\- deterministic evaluation



Avoid:



\- abstract labels (e.g. "risk\_level")

\- subjective scoring

\- AI-only signals in decision path



\---



\## Mental Model



When designing rules, always think:



1\. Is this a violation?

&#x20;  → BLOCK



2\. Is this unsafe or uncertain?

&#x20;  → ESCALATE



3\. Is this clearly safe?

&#x20;  → ALLOW



4\. Did we miss something?

&#x20;  → BLOCK



\---



\## Final Principle



> Manthan does not guess.

> 

> It only:

> - evaluates truth

> - applies rules

> - produces a deterministic outcome

