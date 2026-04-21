import { Rule, RuleSet, Schema } from "../core/types";

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

function resolveSchemaField(
  path: string,
  schema: Schema
): { name: string; type: "string" | "number" | "boolean" } | null {
  const parts = path.split(".");

  if (parts.length !== 2 || parts[0] !== "system_data") {
    return null;
  }

  const fieldName = parts[1];
  const type = schema.system_fields[fieldName];

  if (!type) return null;

  return { name: fieldName, type };
}

/* -------------------- TYPE CHECK -------------------- */

function matchesType(value: unknown, type: string): boolean {
  if (type === "string") return typeof value === "string";
  if (type === "number") return typeof value === "number";
  if (type === "boolean") return typeof value === "boolean";
  return false;
}

/* -------------------- NORMALIZATION -------------------- */

function normalizeRequires(
  requires: unknown,
  schema: Schema,
  ruleId: string
): string[] | undefined {
  if (requires === undefined) return undefined;

  if (!Array.isArray(requires)) {
    throw new Error(`Rule ${ruleId}: requires must be array`);
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const field of requires) {
    if (!isString(field)) {
      throw new Error(`Rule ${ruleId}: invalid requires field`);
    }

    const resolved = resolveSchemaField(field, schema);
    if (!resolved) {
      throw new Error(`Rule ${ruleId}: unknown required field ${field}`);
    }

    if (!seen.has(field)) {
      seen.add(field);
      result.push(field);
    }
  }

  return result;
}

function normalizeCondition(
  condition: unknown,
  schema: Schema,
  ruleId: string
): Rule["condition"] {
  if (!isObject(condition)) {
    throw new Error(`Rule ${ruleId}: invalid condition`);
  }

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
    operator: operator as "eq" | "gt" | "lt", // ✅ FIX
    value,
  };
}

/* -------------------- RULE COMPILATION -------------------- */

function compileRule(raw: unknown, schema: Schema): Rule {
  if (!isObject(raw)) {
    throw new Error("Invalid rule");
  }

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
    outcome: outcome as "ALLOW" | "BLOCK" | "ESCALATE", // ✅ FIX
    condition: normalizeCondition(condition, schema, id),
    requires: normalizeRequires(requires, schema, id),
  };
}

/* -------------------- SAFETY CHECKS -------------------- */

function assertNoConflicts(rules: Rule[]) {
  const seen = new Map<string, string>();

  for (const rule of rules) {
    const key = JSON.stringify([
      rule.condition.field,
      rule.condition.operator,
      rule.condition.value,
    ]);

    const existing = seen.get(key);

    if (existing && existing !== rule.outcome) {
      throw new Error(`Conflict: ${rule.id} contradicts ${existing}`);
    }

    seen.set(key, rule.outcome);
  }
}

function assertCoverageComplete(rules: Rule[], schema: Schema) {
  const covered = new Set<string>();

  for (const r of rules) {
    covered.add(r.condition.field);
  }

  for (const field of Object.keys(schema.system_fields)) {
    const full = `system_data.${field}`;

    if (!covered.has(full)) {
      throw new Error(
        `Coverage gap: no rule handles ${full}`
      );
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