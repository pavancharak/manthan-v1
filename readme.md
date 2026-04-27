\# Manthan v1 — Deterministic Decision Infrastructure



Manthan is a \*\*deterministic decision system\*\* designed for environments where decisions must be:



\* \*\*Reproducible\*\*

\* \*\*Auditable\*\*

\* \*\*Consistent\*\*

\* \*\*Provable\*\*



> Same input → same output → always



\---



\# 🧠 Core Principles



\### 1. Determinism



\* Decisions are purely a function of:



&#x20; \* `signals` (inputs)

&#x20; \* `schema`

&#x20; \* `rules`

\* No randomness, no hidden state



\---



\### 2. Fail-Closed Enforcement



\* If anything is invalid or inconsistent → system fails

\* No silent fallback behavior



\---



\### 3. Artifact Integrity



\* Every intent (schema + rules) produces a \*\*hash\*\*

\* Only \*\*approved hashes\*\* are allowed to execute



\---



\### 4. Reproducibility



\* A decision can be replayed with the same inputs and artifacts

\* Output must match exactly



\---



\# 🏗️ System Architecture



```text

core/

&#x20; intents/                # Source of truth (schema + rules)

&#x20;   <intent>/

&#x20;     v1/

&#x20;       schema.json

&#x20;       rules.json



&#x20; engine.ts               # Executes decisions

&#x20; intentLoader.ts         # Loads + validates intent

&#x20; hasher.ts               # Computes artifact hash

&#x20; artifactRegistry.ts     # Approved artifact hashes



scripts/

&#x20; buildRegistry.ts        # Generates artifact registry



tests/                    # Determinism + system tests

```



\---



\# 🔁 Decision Pipeline



```text

schema + rules

&#x20;     ↓

compileRuleSet()

&#x20;     ↓

computeArtifactHash()

&#x20;     ↓

artifactRegistry (approved)

&#x20;     ↓

loadIntent() → validate hash

&#x20;     ↓

execute()

&#x20;     ↓

decision output

```



\---



\# 🔐 Artifact Registry (Critical)



The system enforces:



```ts

if (computedHash !== expectedHash) {

&#x20; throw new Error("Artifact hash mismatch");

}

```



This guarantees:



\* No unauthorized rule changes

\* No drift between environments

\* Deterministic execution



\---



\# ⚙️ Registry Generation (Automated)



Instead of manual updates, registry is generated via:



```bash

npx ts-node scripts/buildRegistry.ts

```



This:



\* Scans all intents

\* Computes hashes

\* Writes to:



```ts

core/artifactRegistry.ts

```



\---



\# 📌 Developer Workflow



\### 1. Modify intent



Edit:



```bash

core/intents/<intent>/v1/schema.json

core/intents/<intent>/v1/rules.json

```



\---



\### 2. Rebuild registry



```bash

npx ts-node scripts/buildRegistry.ts

```



\---



\### 3. Run tests



```bash

npm test

```



\---



\### 4. Commit changes



```bash

git add .

git commit -m "update intent"

```



\---



\# 🚨 Important Rule



If you change:



\* schema

\* rules



You \*\*must\*\* rebuild registry.



Otherwise:



```text

❌ Artifact hash mismatch

```



\---



\# 🧪 Verification System



Manthan includes:



\### ✅ Determinism Testing



\* Multiple executions → same output



\### ✅ Replay Testing



\* Same input → same result



\### ✅ Rule Coverage



\* Detect unused rules



\### ✅ Input Space Exploration



\* Generates combinations of inputs



\---



\# 🔍 What This Prevents



\* Hidden logic changes

\* Non-reproducible decisions

\* Environment drift

\* Inconsistent behavior



\---



\# 🧾 Example Decision Output (future)



```json

{

&#x20; "decision": "ALLOW",

&#x20; "rule\_id": "allow-safe-merge",

&#x20; "artifact\_hash": "9f8c3034..."

}

```



\---



\# 🧠 Key Concept



> \*\*Impact + obligation to prove = Manthan\*\*



If a decision affects real outcomes:

→ it must be provable and reproducible



\---



\# 🚀 Current Status



✅ Deterministic execution

✅ Artifact hash enforcement

✅ Automated registry

✅ Full test coverage

✅ Multi-intent verification



\---



\# 🔜 Next Steps



\* Attach artifact hash to decision output

\* Add decision signing (cryptographic proof)

\* CI enforcement (prevent drift)

\* Decision replay verification



\---



\# 🏁 Summary



Manthan is not just a rules engine.



It is:



> \*\*Deterministic Decision Infrastructure\*\*



Where every decision is:



\* predictable

\* reproducible

\* enforceable

\* eventually provable



\---



