# Schema (Input Schema)

The schema defines **what data must exist** for a decision to be evaluated.

It is the **source of truth for DecisionInput**.

---

# 🧠 Purpose

The schema:

- defines required system data
- enforces input structure
- prevents unknown or invalid data
- ensures deterministic evaluation

---

# 📁 Location

Schemas are versioned per intent:

```txt
schema/<intent>/<version>/schema.json
📦 Structure
{
  "schema_version": "v1",
  "system_fields": {
    "isApproved": "boolean",
    "hasNewCommitsAfterApproval": "boolean"
  }
}
🔑 system_fields
system_fields: Record<string, "string" | "number" | "boolean">

Defines all allowed fields for decision evaluation.

⚙️ Input Mapping

Schema applies to:

DecisionInput.system_data

Rules MUST reference:

system_data.<field>
⚠️ Validation Rules
1. Allowed Fields Only
Extra or unknown fields → INVALID
2. Type Enforcement
Type mismatch → INVALID

Examples:

string instead of boolean → INVALID
null values → INVALID
malformed structure → INVALID
3. Completeness
Missing required fields → INCOMPLETE
Important Constraint
Schema does NOT define optional fields

All declared fields are considered required for completeness.

4. No Nested Structures
Nested objects are NOT allowed

All fields must be flat:

system_data.<field>
🔗 Relationship with Rules
Schema = what can be known
Rules  = what is allowed
Constraints
every rule field must exist in schema.system_fields
schema fields should only exist if used by rules
🧠 Validity vs Completeness
INVALID

Input is structurally incorrect:

unknown fields
wrong types
malformed structure
INCOMPLETE

Input is structurally valid but missing required data:

required fields not present
🔐 Versioning

Schema is immutable per version:

schema/<intent>/v1 → immutable
schema/<intent>/v2 → new version
Rule
Never modify an existing schema version
🚫 What Schema Must NOT Do

Schema must NOT:

contain logic
define rules
depend on external systems
change at runtime
include implicit or hidden behavior
🧠 Design Principle
Schema defines the language of truth

If a field is not in schema:

It does not exist for decision making
🚀 Summary

The schema:

defines all valid decision inputs
enforces strict structure and types
guarantees deterministic evaluation
defines the boundary of what the system can know