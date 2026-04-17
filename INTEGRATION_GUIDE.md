\# MANTHAN INTEGRATION GUIDE



This guide explains how to integrate Manthan into any system.



\---



\# 🧠 WHAT MANTHAN DOES



Manthan evaluates structured input against predefined rules to produce a deterministic decision.



Same input → same output



\---



\# 🚀 INTEGRATION FLOW



External System → Signals → Mapping → Execution → Decision → Action



\---



\# 🧩 STEP 1: DEFINE SCHEMA



Schema defines required input fields.



Example:



```json

{

&#x20; "isApproved": { "type": "boolean", "required": true },

&#x20; "hasNewCommits": { "type": "boolean", "required": true }

}

```



\---



\# 📜 STEP 2: DEFINE RULES



Rules define allowed behavior.



Example:



```json

\[

&#x20; {

&#x20;   "conditions": {

&#x20;     "isApproved": true,

&#x20;     "hasNewCommits": false

&#x20;   },

&#x20;   "outcome": "ALLOW"

&#x20; },

&#x20; {

&#x20;   "conditions": {

&#x20;     "isApproved": false

&#x20;   },

&#x20;   "outcome": "BLOCK"

&#x20; }

]

```



\---



\# ⚙️ STEP 3: COMPILE RULES



Rules must be compiled before execution.



```ts

import { compileRuleSet } from "./core/compiler";



const rule\_set = compileRuleSet(rules, schema);

```



⚠️ Do NOT compile rules during execution.



\---



\# 🔌 STEP 4: PREPARE EXECUTION CONTEXT



```ts

const context = {

&#x20; schema,

&#x20; rule\_set

};

```



\---



\# 🧾 STEP 5: EXECUTE DECISION



\### Option A: Direct Decision Input



```ts

import { executeDecisionInput } from "./execution/sdk";



const result = executeDecisionInput({

&#x20; input: {

&#x20;   isApproved: true,

&#x20;   hasNewCommits: false

&#x20; },

&#x20; context

});

```



\---



\### Option B: Signal-Based Execution



```ts

import { executeSignal } from "./execution/sdk";



const result = executeSignal({

&#x20; signal\_batch,

&#x20; mappings,

&#x20; context

});

```



\---



\# 📤 RESPONSE FORMAT



```json

{

&#x20; "outcome": "ALLOW | BLOCK | ESCALATE | REJECT",

&#x20; "explanation": "string"

}

```



\---



\# 🎯 STEP 6: HANDLE OUTCOME



| Outcome  | Action                            |

| -------- | --------------------------------- |

| ALLOW    | Proceed                           |

| BLOCK    | Prevent action                    |

| ESCALATE | Request more data / manual review |

| REJECT   | Fix input                         |



\---



\# 🔗 EXAMPLE: GITHUB PR GATE



\### Input signals:



\* isApproved

\* hasNewCommitsAfterApproval



\---



\### Decision:



```json

{

&#x20; "isApproved": true,

&#x20; "hasNewCommitsAfterApproval": false

}

```



\---



\### Result:



```json

{

&#x20; "outcome": "ALLOW",

&#x20; "explanation": "PR is approved and no new commits"

}

```



\---



\# ⚠️ IMPORTANT RULES



\## ❌ DO NOT:



\* compile rules at runtime

\* modify decision input

\* bypass validation

\* use AI in decision logic



\---



\## ✅ ALWAYS:



\* use precompiled rule\_set

\* validate inputs via schema

\* handle all 4 outcomes

\* keep integration layer thin



\---



\# 🧠 SIGNALS (OPTIONAL)



Signals allow flexible input ingestion.



Example:



```json

{

&#x20; "id": "1",

&#x20; "source": "NON\_AI",

&#x20; "namespace": "github",

&#x20; "key": "isApproved",

&#x20; "value": true

}

```



\---



\# 🔁 MAPPING



Mapping converts signals → decision\_input



```json

{

&#x20; "source": "NON\_AI",

&#x20; "namespace": "github",

&#x20; "key": "isApproved",

&#x20; "target\_field": "isApproved"

}

```



\---



\# 🔒 SECURITY



\* Validate incoming payloads

\* Verify webhook signatures

\* Do not trust external data directly



\---



\# 🧪 TESTING



Before production:



\* test ALLOW case

\* test BLOCK case

\* test ESCALATE case

\* test REJECT case



\---



\# 🧠 DESIGN PRINCIPLE



Manthan is a \*\*decision engine\*\*, not business logic.



Your system:



\* provides input

\* executes decision

\* handles outcome



\---



\# 🔚 FINAL NOTE



If your integration contains decision logic:



→ it is incorrect



All decisions must come from Manthan.



\---



You are integrating a deterministic system.



Treat it as a source of truth.



