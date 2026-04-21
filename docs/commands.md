\# Manthan Command Reference



This document lists all commands used to build, test, verify, and run the Manthan system.



\---



\# 🔧 Core Commands



\## Install dependencies

```bash

npm install

Run all tests

npm test

Compile TypeScript

npx tsc

Full system check (build + test)

npm run check



👉 Used as pre-push validation (Husky enforced)



🔍 Verification Commands

Run full decision system verification

npm run verify



This performs:



Full input coverage

Determinism validation

Rule coverage analysis

⚙️ Development Commands

Run GitHub webhook server

npm run dev:webhook

Run simulation

npm run simulate

🧪 Testing Commands

Run specific test file

npx jest tests/replay.test.ts

Run tests in watch mode

npx jest --watch

Run tests with verbose output

npx jest --verbose

🧠 Debug Commands

Run any TypeScript file directly

npx ts-node path/to/file.ts



Example:



npx ts-node scripts/verifyDecisionSystem.ts

🧱 Type System

Type check only (no emit)

npx tsc --noEmit

🧹 Cleanup (optional)

Remove node\_modules (Linux/Mac)

rm -rf node\_modules

npm install

Remove node\_modules (Windows PowerShell)

Remove-Item -Recurse -Force node\_modules

npm install

⚠️ Important Rules

Always run npm run check before pushing code

Never bypass tests

Determinism must always hold (same input → same output)

Always specify intent\_version in execution

🧠 Philosophy



Manthan is a deterministic decision infrastructure.



Every command supports:



Correctness

Determinism

Auditability

Trust

✅ Recommended Workflow

\# 1. Develop

\# 2. Verify

npm run verify



\# 3. Test

npm test



\# 4. Final check

npm run check



\# 5. Push

git push

