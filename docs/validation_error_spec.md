\# Validation \& Error Specification



This document defines how Manthan handles errors, validation failures, and debugging.



It ensures:



\- deterministic behavior

\- consistent error formats

\- clear debugging paths

\- production observability



\---



\## Core Principle



Manthan never fails silently.



Every failure must return:



\- explicit status

\- structured explanation

\- reproducible reason



\---



\## Decision Result Structure



All responses must follow:





{

status: "INVALID" | "INCOMPLETE" | "DECIDED",

outcome?: "ALLOW" | "BLOCK" | "ESCALATE",

rule\_id?: string | null,

schema\_version: string,

rule\_version: string,

explanation: {

reason: string,

details?: object

}

}





\---



\## Error Types



\### 1. INVALID



Input is malformed or violates schema.



\#### Causes



\- wrong data types

\- unknown fields

\- invalid structure

\- schema mismatch



\#### Example





{

"status": "INVALID",

"rule\_id": null,

"schema\_version": "v1",

"rule\_version": "v1",

"explanation": {

"reason": "invalid\_input",

"details": {

"errors": \["amount must be number"]

}

}

}





\---



\### 2. INCOMPLETE



Required fields are missing.



\#### Causes



\- missing required fields

\- partial input



\#### Example





{

"status": "INCOMPLETE",

"rule\_id": null,

"schema\_version": "v1",

"rule\_version": "v1",

"explanation": {

"reason": "incomplete\_input",

"details": {

"missing\_fields": \["amount", "user\_id"]

}

}

}





\---



\### 3. NO RULE MATCH (Valid but uncovered)



Input is valid and complete, but no rule matched.



\#### Behavior



\- system must return ESCALATE

\- OR fallback rule must handle this



\#### Example





{

"status": "DECIDED",

"outcome": "ESCALATE",

"rule\_id": null,

"schema\_version": "v1",

"rule\_version": "v1",

"explanation": {

"reason": "no\_rule\_match"

}

}





\---



\### 4. RULE MATCH



Successful decision.



\#### Example





{

"status": "DECIDED",

"outcome": "BLOCK",

"rule\_id": "block\_violation",

"schema\_version": "v1",

"rule\_version": "v1",

"explanation": {

"reason": "rule\_matched",

"details": {

"rule\_id": "block\_violation"

}

}

}





\---



\## Deterministic Guarantees



For same input:



\- same validation result

\- same rule match

\- same output



\---



\## Logging Requirements



Every decision must log:



\- input (hashed or reference)

\- status

\- outcome

\- rule\_id

\- schema\_version

\- rule\_version



\---



\## Debugging Flow



When a decision is unexpected:



1\. Check status

2\. If INVALID → inspect schema errors

3\. If INCOMPLETE → inspect missing fields

4\. If DECIDED:

&#x20;  - check rule\_id

&#x20;  - verify rule condition

&#x20;  - verify input values



\---



\## Operator Responsibilities



Operator must:



\- handle INVALID → reject request

\- handle INCOMPLETE → fetch missing data and retry

\- handle DECIDED:

&#x20; - ALLOW → proceed

&#x20; - BLOCK → stop

&#x20; - ESCALATE → route externally



\---



\## Forbidden Behavior



\- silent failures

\- implicit defaults

\- auto-correction of input

\- guessing missing values



\---



\## Final Principle



> Every error must be explicit, structured, and reproducible.



Manthan must always explain:

\- what failed

\- why it failed

\- how to reproduce it

