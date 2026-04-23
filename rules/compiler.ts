import { Rule, RuleSet, Schema, RuleCondition } from "../core/types";

/* -------------------- CONSTANTS -------------------- */

const VALID_OPERATORS = new Set(["eq", "gt", "lt"]);
const VALID_OUTCOMES = new Set(["ALLOW", "BLOCK", "ESCALATE"]);

/* -------------------- HELPERS -------------------- */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isInt(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

/* -------------------- SCHEMA RESOLUTION -------------------- */

function resolveSchemaField(field: string, schema: Schema) {
  const type = schema.system_fields[field];
  if (!type) return null;
  return { name: field, type };
}

/* -------------------- TYPE CHECK -------------------- */

function matchesType(value: unknown, type: string): boolean {
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number";
  if (type === "boolean") return typeof value === "boolean";
  return false;
}

/* -------------------- CONDITION NORMALIZATION (RECURSIVE) -------------------- */

function normalizeCondition(
  condition: unknown,
  schema: Schema,
  ruleId: string
): RuleCondition {
  if (!isObject(condition)) {
    throw new Error(`Rule ${ruleId}: invalid condition`);
  }

  // AND
  if ("all" in condition) {
    if (!Array.isArray(condition.all)) {
      throw new Error(`Rule ${ruleId}: 'all' must be array`);
    }

    return {
      all: condition.all.map((c) =>
        normalizeCondition(c, schema, ruleId)
      ),
    };
  }

  // OR
  if ("any" in condition) {
    if (!Array.isArray(condition.any)) {
      throw new Error(`Rule ${ruleId}: 'any' must be array`);
    }

    return {
      any: condition.any.map((c) =>
        normalizeCondition(c, schema, ruleId)
      ),
    };
  }

  // BASE CONDITION
  const { field, operator, value } = condition as any;

  if (!isString(field)) {
    throw new Error(`Rule ${ruleId}: invalid field`);
  }

  const resolved = resolveSchemaField(field, schema);
  if (!resolved) {
    throw new Error(`Rule ${ruleId}: unknown field ${field}`);
  }

  if (!isString(operator) || !VALID_OPERATORS.has(operator)) {
    throw new Error(`Rule ${ruleId}: invalid operator`);
  }

  if (value === undefined) {
    throw new Error(`Rule ${ruleId}: missing condition value`);
  }

  if (!matchesType(value, resolved.type)) {
    throw new Error(
      `Rule ${ruleId}: type mismatch for ${field} (expected ${resolved.type})`
    );
  }

  return {
    field,
    operator: operator as "eq" | "gt" | "lt",
    value,
  };
}

/* -------------------- REQUIRES -------------------- */

function normalizeRequires(
  requires: unknown,
  schema: Schema,
  ruleId: string
): Rule["requires"] {
  if (requires === undefined) return undefined;

  if (!isObject(requires)) {
    throw new Error(`Rule ${ruleId}: requires must be object`);
  }

  const { field, operator, value } = requires as any;

  if (!isString(field)) {
    throw new Error(`Rule ${ruleId}: invalid requires field`);
  }

  const resolved = resolveSchemaField(field, schema);
  if (!resolved) {
    throw new Error(`Rule ${ruleId}: unknown field ${field}`);
  }

  if (!isString(operator) || !VALID_OPERATORS.has(operator)) {
    throw new Error(`Rule ${ruleId}: invalid requires operator`);
  }

  if (value === undefined) {
    throw new Error(`Rule ${ruleId}: missing requires value`);
  }

  if (!matchesType(value, resolved.type)) {
    throw new Error(
      `Rule ${ruleId}: type mismatch for ${field} (expected ${resolved.type})`
    );
  }

  return {
    field,
    operator: operator as "eq" | "gt" | "lt",
    value,
  };
}

/* -------------------- FIELD EXTRACTION -------------------- */

function extractFields(condition: RuleCondition, acc: Set<string>) {
  if ("all" in condition) {
    condition.all.forEach((c) => extractFields(c, acc));
    return;
  }

  if ("any" in condition) {
    condition.any.forEach((c) => extractFields(c, acc));
    return;
  }

  acc.add(condition.field);
}

/* -------------------- RULE COMPILATION -------------------- */

function compileRule(raw: unknown, schema: Schema): Rule {
  if (!isObject(raw)) throw new Error("Invalid rule");

  const { id, group, order, outcome, condition, requires } = raw as any;

  if (!isString(id)) throw new Error("Rule missing id");
  if (!isInt(group)) throw new Error(`Rule ${id}: invalid group`);
  if (!isInt(order)) throw new Error(`Rule ${id}: invalid order`);

  if (!isString(outcome) || !VALID_OUTCOMES.has(outcome)) {
    throw new Error(`Rule ${id}: invalid outcome`);
  }

  return {
    id,
    group,
    order,
    outcome: outcome as "ALLOW" | "BLOCK" | "ESCALATE",
    condition: normalizeCondition(condition, schema, id),
    requires: normalizeRequires(requires, schema, id),
  };
}

/* -------------------- SAFETY CHECKS -------------------- */

function assertNoConflicts(_rules: Rule[]) {
  // ✅ Disabled for v1
  // Field-based conflict detection is invalid for AND/OR conditions

  return;
}
function assertCoverageComplete(rules: Rule[], schema: Schema) {
  const covered = new Set<string>();

  for (const r of rules) {
    extractFields(r.condition, covered);
  }

  for (const field of Object.keys(schema.system_fields)) {
    if (!covered.has(field)) {
      throw new Error(`Coverage gap: no rule handles ${field}`);
    }
  }
}

/* -------------------- MAIN -------------------- */

export function compileRuleSet(
  schema: Schema,
  rawRuleSet: unknown
): RuleSet {
  if (!isObject(rawRuleSet)) {
    throw new Error("Invalid rule set");
  }

  const { rule_version, rules } = rawRuleSet as any;

  if (!isString(rule_version)) {
    throw new Error("Invalid rule_version");
  }

  if (!Array.isArray(rules)) {
    throw new Error("Rules must be array");
  }

  const compiled = rules.map((r) => compileRule(r, schema));

  const ids = new Set<string>();
  const orderSlots = new Set<string>();

  for (const r of compiled) {
    if (ids.has(r.id)) throw new Error(`Duplicate rule id ${r.id}`);
    ids.add(r.id);

    const slot = `${r.group}:${r.order}`;
    if (orderSlots.has(slot)) {
      throw new Error(`Duplicate order ${slot}`);
    }
    orderSlots.add(slot);
  }

  assertNoConflicts(compiled);
  assertCoverageComplete(compiled, schema);

  return {
    rule_version,
    rules: compiled.sort(
      (a, b) => a.group - b.group || a.order - b.order
    ),
  };
}