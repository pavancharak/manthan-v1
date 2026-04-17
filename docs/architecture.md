\# Architecture



\## Layers



core/

\- engine.ts

\- validator.ts

\- compiler.ts



signals/

\- signal ingestion

\- normalization

\- mapping



rules/

\- rule definitions



schema/

\- input schema



execution/

\- sdk

\- api

\- integrations



ai/

\- suggestions only (not used in decision)



\## Key Principles



\- Core is immutable

\- Rules are compiled before execution

\- Execution layer is thin

\- AI is not part of decision logic

