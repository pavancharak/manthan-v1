\# Test Strategy



This document defines how to test Manthan to guarantee:



\- correctness

\- determinism

\- completeness

\- safety (fail-closed)



\---



\## Core Principle



Every rule set must be:



\- fully covered

\- conflict-free

\- deterministic



Testing must prove this — not assume it.



\---



\## Test Types



\### 1. Unit Tests (Rule Evaluation)



Test each rule independently.



\#### Goal



\- verify rule triggers correctly

\- verify correct outcome



\#### Example



Input:

{

&#x20; "system\_data": {

&#x20;   "is\_violation": true

&#x20; }

}



Expected:

→ BLOCK



\---



\### 2. Combination Tests (Full Coverage)



Test all meaningful combinations of inputs.



\#### Goal



\- ensure no gaps

\- ensure every path leads to a decision



\---



\### Example



If schema has 3 boolean fields:



\- A

\- B

\- C



Total combinations = 2^3 = 8



Test all 8 cases.



\---



\### 3. Edge Case Tests



Test boundary conditions.



\#### Examples



\- amount = 0

\- amount = threshold

\- amount = threshold + 1



\---



\### 4. Invalid Input Tests



Test schema violations.



\#### Examples



\- wrong type

\- missing fields

\- extra fields



Expected:

→ INVALID



\---



\### 5. Incomplete Input Tests



Test missing required fields.



\#### Examples



\- missing one field

\- missing multiple fields



Expected:

→ INCOMPLETE



\---



\### 6. Conflict Tests



Ensure no two rules:



\- match same condition

\- produce different outcomes



Compiler should fail.



\---



\### 7. Determinism Tests



Run same input multiple times.



Expected:

→ same result every time



\---



\## Coverage Requirement



Every possible valid input must result in:



\- a rule match

OR

\- a fallback decision



No input should result in undefined behavior.



\---



\## Fail-Closed Guarantee



If no rule matches:



→ system must BLOCK (via fallback rule)



\---



\## Test Matrix Approach



For schema fields:



\- boolean → 2 values

\- enum → N values

\- numeric → representative ranges



Build matrix:



Example:



| Case | A | B | C | Expected |

|------|---|---|---|----------|

| 1    | T | T | T | BLOCK    |

| 2    | T | T | F | ESCALATE |

| ...  |   |   |   |          |



\---



\## Automation Strategy



Tests should be:



\- automated

\- repeatable

\- deterministic



\---



\## Minimum Required Tests per Rule Set



\- 100% rule coverage

\- 100% schema field coverage

\- all boundary conditions

\- invalid + incomplete cases



\---



\## Debugging Failures



When a test fails:



1\. Check input

2\. Check matched rule

3\. Check rule priority

4\. Check schema alignment



\---



\## Final Principle



> If it is not tested, it is not deterministic.



Manthan correctness must be proven through exhaustive testing.

