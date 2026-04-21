\# Automatic Test Generation



This document defines how Manthan automatically generates test cases

from schema and rules to guarantee:



\- full coverage

\- determinism

\- no rule gaps

\- no missed edge cases



\---



\## Core Principle



Tests should be derived from:



\- schema (input space)

\- rules (decision logic)



Not written manually.



\---



\## Input Space Generation



Each schema field defines possible values:



\### Boolean



2 values:

\- true

\- false



\---



\### Enum



All possible enum values



\---



\### Number



Use representative values:



\- min boundary

\- threshold values (from rules)

\- max boundary



\---



\## Example



Schema:



{

&#x20; "fields": {

&#x20;   "is\_violation": "boolean",

&#x20;   "amount": "number"

&#x20; }

}



\---



Generated inputs:



\- is\_violation: true / false

\- amount: \[0, 10000, 10001]



\---



Total combinations:



2 × 3 = 6 cases



\---



\## Rule-Aware Expansion



Rules define critical thresholds.



Example:



IF amount > 10000 → ESCALATE



Then generator MUST include:



\- amount = 10000

\- amount = 10001



\---



\## Test Case Generation Algorithm



1\. Read schema

2\. Extract fields

3\. Generate value sets per field

4\. Expand combinations (cartesian product)

5\. Reduce redundant cases (optional)

6\. Produce test inputs



\---



\## Expected Output Generation



For each generated input:



1\. run through core

2\. capture result

3\. store expected output



\---



\## Golden Test Set



Generated tests become:



\- baseline truth

\- regression protection



\---



\## Example Output



| Case | is\_violation | amount | Expected |

|------|-------------|--------|----------|

| 1    | true        | 0      | BLOCK    |

| 2    | false       | 0      | ALLOW    |

| 3    | false       | 10001  | ESCALATE |



\---



\## Determinism Check



Run each test multiple times:



Expected:

→ same output every time



\---



\## Coverage Guarantee



System must ensure:



\- every rule is triggered at least once

\- every field is tested

\- every boundary is tested



\---



\## Failure Detection



If any input:



\- produces inconsistent result

\- does not match expected

\- hits no rule



→ system is invalid



\---



\## Automation Strategy



Test generation should run:



\- on rule changes

\- on schema changes

\- in CI pipeline



\---



\## Final Principle



> If input space is finite, correctness can be proven.



Manthan uses schema + rules to fully explore decision space.

