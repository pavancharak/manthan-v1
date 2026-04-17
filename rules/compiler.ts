import { Rule, RuleSet, Schema } from "../core/types";

interface RawRuleCondition {
  operator?: unknown;
  field?: unknown;
  value?: unknown;
}

interface RawRule {
  id?: unknown;
  group?: unknown;
  order?: unknown;
  requires?: unknown;
  condition?: unknown;
  outcome?: unknown;
}

interface RawRuleSet {
  rule_version?: unknown;
  rules?: unknown;
}

const VALID_OPERATORS = new Set(["eq", "gt", "lt"]);
const VALID_OUTCOMES = new Set(["ALLOW", "BLOCK", "ESCALATE", "REJECT"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value);
}

function matchesSchemaFieldType(
  value: unknown,
  fieldType: "string" | "number" | "boolean"
): boolean {
  switch (fieldType) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
  }
}

// ⚠️ SHADOW DETECTION
function detectShadowed(rules: Rule[]): string[] {
  const warnings: string[] = [];

  for (let i = 0; i < rules.length; i++) {
    const current = rules[i];

    for (let j = 0; j < i; j++) {
      const prev = rules[j];

      if (
        prev.condition.field === current.condition.field &&
        prev.condition.operator === current.condition.operator &&
        prev.condition.value === current.condition.value
      ) {
        warnings.push(`${current.id} is shadowed by ${prev.id}`);
        break;
      }
    }
  }

  return warnings;
}

// ⚠️ COVERAGE GAP DETECTION
function detectCoverageGaps(
  rules: Rule[],
  schema: Schema
): string[] {
  const warnings: string[] = [];

  const coveredFields = new Set<string>();

  for (const rule of rules) {
    coveredFields.add(rule.condition.field);
  }

  for (const fieldName of Object.keys(schema.fields)) {
    if (!coveredFields.has(fieldName)) {
      warnings.push(
        `No rule covers schema field '${fieldName}' → may cause ESCALATE`
      );
    }
  }

  return warnings;
}

function normalizeRequires(
  requires: unknown,
  schema: Schema,
  ruleId: string
): string[] | undefined {
  if (requires === undefined) {
    return undefined;
  }

  if (!Array.isArray(requires)) {
    throw new Error(`Rule ${ruleId} has invalid requires`);
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const field of requires) {
    if (!isNonEmptyString(field)) {
      throw new Error(`Rule ${ruleId} has invalid requires`);
    }

    if (schema.fields[field] === undefined) {
      throw new Error(
        `Rule ${ruleId} references unknown required field ${field}`
      );
    }

    if (!seen.has(field)) {
      seen.add(field);
      normalized.push(field);
    }
  }

  return normalized;
}

function normalizeCondition(
  condition: unknown,
  schema: Schema,
  ruleId: string
): Rule["condition"] {
  if (!isPlainObject(condition)) {
    throw new Error(`Rule ${ruleId} has invalid condition`);
  }

  const rawCondition = condition as RawRuleCondition;

  if (!isNonEmptyString(rawCondition.field)) {
    throw new Error(`Rule ${ruleId} has invalid condition field`);
  }

  const schemaField = schema.fields[rawCondition.field];
  if (schemaField === undefined) {
    throw new Error(
      `Rule ${ruleId} references unknown condition field ${rawCondition.field}`
    );
  }

  if (
    !isNonEmptyString(rawCondition.operator) ||
    !VALID_OPERATORS.has(rawCondition.operator)
  ) {
    throw new Error(`Rule ${ruleId} has invalid operator`);
  }

  if (rawCondition.value === undefined) {
    throw new Error(`Rule ${ruleId} has invalid condition value`);
  }

  if (
    !matchesSchemaFieldType(rawCondition.value, schemaField.type)
  ) {
    throw new Error(
      `Rule ${ruleId} has condition value type mismatch for ${rawCondition.field}`
    );
  }

  return {
    field: rawCondition.field,
    operator: rawCondition.operator as Rule["condition"]["operator"],
    value: rawCondition.value,
  };
}

function compileRule(rawRule: unknown, schema: Schema): Rule {
  if (!isPlainObject(rawRule)) {
    throw new Error("Rule is not an object");
  }

  const candidate = rawRule as RawRule;

  if (!isNonEmptyString(candidate.id)) {
    throw new Error("Rule has invalid id");
  }

  if (!isSafeInteger(candidate.group)) {
    throw new Error(`Rule ${candidate.id} has invalid group`);
  }

  if (!isSafeInteger(candidate.order)) {
    throw new Error(`Rule ${candidate.id} has invalid order`);
  }

  if (
    !isNonEmptyString(candidate.outcome) ||
    !VALID_OUTCOMES.has(candidate.outcome)
  ) {
    throw new Error(`Rule ${candidate.id} has invalid outcome`);
  }

  return {
    id: candidate.id,
    group: candidate.group,
    order: candidate.order,
    requires: normalizeRequires(candidate.requires, schema, candidate.id),
    condition: normalizeCondition(
      candidate.condition,
      schema,
      candidate.id
    ),
    outcome: candidate.outcome as Rule["outcome"],
  };
}

// ❌ HARD FAIL
function assertNoConflicts(rules: Rule[]): void {
  const seenConditions = new Map<string, string>();

  for (const rule of rules) {
    const key = JSON.stringify([
      rule.condition.field,
      rule.condition.operator,
      rule.condition.value,
    ]);

    const existingOutcome = seenConditions.get(key);

    if (existingOutcome !== undefined && existingOutcome !== rule.outcome) {
      throw new Error(`Conflicting rules for ${rule.condition.field}`);
    }

    seenConditions.set(key, rule.outcome);
  }
}

// 🚀 MAIN COMPILER
export function compileRuleSet(
  schema: Schema,
  rawRuleSet: unknown
): RuleSet {
  if (!isPlainObject(rawRuleSet)) {
    throw new Error("Rule set is not an object");
  }

  const candidate = rawRuleSet as RawRuleSet;

  if (!isNonEmptyString(candidate.rule_version)) {
    throw new Error("Rule set has invalid rule_version");
  }

  if (!Array.isArray(candidate.rules)) {
    throw new Error("Rule set has invalid rules");
  }

  const compiledRules = candidate.rules.map((rule) =>
    compileRule(rule, schema)
  );

  const seenIds = new Set<string>();
  const seenOrderSlots = new Set<string>();

  for (const rule of compiledRules) {
    if (seenIds.has(rule.id)) {
      throw new Error(`Duplicate rule id: ${rule.id}`);
    }
    seenIds.add(rule.id);

    const orderSlot = `${rule.group}:${rule.order}`;
    if (seenOrderSlots.has(orderSlot)) {
      throw new Error(`Duplicate rule order: ${orderSlot}`);
    }
    seenOrderSlots.add(orderSlot);
  }

  // ❌ BLOCK invalid logic
  assertNoConflicts(compiledRules);

  // ⚠️ WARN inefficiencies
  const warnings: string[] = [];
  warnings.push(...detectShadowed(compiledRules));
  warnings.push(...detectCoverageGaps(compiledRules, schema));

  return {
    rule_version: candidate.rule_version,
    rules: [...compiledRules].sort(
      (left, right) =>
        left.group - right.group || left.order - right.order
    ),
    warnings,
  };
}