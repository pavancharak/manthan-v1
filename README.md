\# MANTHAN v1



> Deterministic Decision Infrastructure

> Every decision is traceable, auditable, and built for trust.



\---



\## 🧠 What is Manthan?



Manthan is a \*\*deterministic decision system\*\* that evaluates structured inputs against defined rules and produces \*\*guaranteed, reproducible outcomes\*\*.



It is designed to act as a \*\*Decision Operating System\*\* — not a recommendation engine, not an AI system.



\---



\## 🔒 Core Principle



```

Same Decision Input → Same Decision Outcome

```



No randomness.

No hidden logic.

No runtime mutation.



\---



\## ⚙️ Decision Pipeline



```

Signals → Mapping → Validation → Rule Evaluation → Decision

```



\### 1. Signals



Structured inputs representing real-world events or system state.



\### 2. Mapping



Transforms signals into \*\*Decision Input\*\* using strict, non-AI mapping.



\### 3. Validation



Ensures:



\* Schema compliance

\* Required fields present

\* No unexpected data



Outcomes:



\* Invalid → REJECT

\* Incomplete → ESCALATE



\### 4. Rule Evaluation



Precompiled rules are applied deterministically.



Outcomes:



\* ALLOW

\* BLOCK

\* ESCALATE (no rule match)

\* REJECT (invalid input)



\---



\## 🧾 Decision Outcomes



| Outcome  | Meaning                                      |

| -------- | -------------------------------------------- |

| ALLOW    | Action permitted                             |

| BLOCK    | Action denied                                |

| ESCALATE | Cannot decide (missing or insufficient data) |

| REJECT   | Invalid or malformed input                   |



\---



\## 🏗️ Architecture



```

core/          → deterministic engine, validator, compiler

signals/       → signal ingestion \& normalization

rules/         → rule definitions

schema/        → input schema definitions

execution/     → API, SDK, integrations (thin layer)

ai/            → suggestions only (never used in decisions)

tests/         → full system validation

```



\---



\## 🚫 What Manthan is NOT



\* ❌ Not AI decision-making

\* ❌ Not probabilistic

\* ❌ Not heuristic-based

\* ❌ Not mutable at runtime



\---



\## 🤖 Role of AI



AI is \*\*strictly optional\*\* and used only for:



\* Signal generation

\* Suggestions

\* Developer experience



AI is \*\*never used in decision evaluation\*\*.



\---



\## 🔐 Determinism Guarantee



Manthan guarantees:



\* No default values

\* No hidden transformations

\* No rule mutation

\* No runtime compilation

\* No dependency on external systems



All decisions are:



\* Reproducible

\* Explainable

\* Version-bound



\---



\## 🧩 Execution Model



Rules are:



```

Defined → Compiled → Executed

```



Compilation happens \*\*before runtime\*\*.



Execution uses:



```ts

ExecutionContext {

&#x20; schema

&#x20; rule\_set (precompiled)

}

```



\---



\## 🚀 Usage Example



```ts

import { executeDecisionInput } from "./execution/sdk";



const result = executeDecisionInput({

&#x20; input: decisionInput,

&#x20; context: {

&#x20;   schema,

&#x20;   rule\_set

&#x20; }

});



console.log(result.outcome);

```



\---



\## 🧪 Testing



```bash

npm test

```



All core modules are covered:



\* engine

\* validator

\* compiler

\* signals

\* mapper

\* execution



\---



\## 📦 Versioning



Every decision must be tied to:



\* Schema version

\* Rule version



Manthan enforces:



```

What is published = what is active

```



No retroactive rule changes.



\---



\## 🛠️ Setup



```bash

npm install

npm test

```



\---



\## 📌 Design Constraints



\* Core modules are \*\*immutable\*\*

\* Execution layer is \*\*pure\*\*

\* Signals are \*\*bounded inputs\*\*

\* Schema defines \*\*what is required\*\*

\* Rules define \*\*what is allowed\*\*



\---



\## 🔍 Observability



Manthan supports:



\* Decision traceability

\* Rule-level explanations

\* Deterministic audit logs



\---



\## 🧠 Philosophy



Manthan separates:



```

Understanding (AI) ≠ Decision (Deterministic System)

```



This ensures:



\* Trust

\* Auditability

\* Compliance

\* Stability



\---



\## 🚧 Future Layers (Additive Only)



\* GitHub PR Gate

\* Rule Management Portal

\* Decision Dashboard

\* Cost \& Coverage Optimization



\---



\## 🔒 System Status



```

Manthan v1 — LOCKED

```



\* Core: immutable

\* Execution: stable

\* Tests: passing

\* Ready for production use



\---



\## 📄 License



MIT (or your choice)



\---



\## ✨ Summary



Manthan is not a tool.



It is a \*\*decision infrastructure layer\*\* that ensures every decision is:



\* Deterministic

\* Explainable

\* Auditable

\* Trustworthy



\---



