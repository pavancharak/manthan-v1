import { DecisionInput, Rule, RuleCondition, ConditionTrace } from "./types";

export function evaluateRules(
  rules: Rule[],
  input: DecisionInput
): Rule | null {
  const data = input;

  const sorted = [...rules].sort(
    (a, b) => a.group - b.group || a.order - b.order
  );

  for (const rule of sorted) {
    // -----------------------------
    // REQUIRE CHECK
    // -----------------------------
    if (rule.requires) {
      const reqVal = getValue(rule.requires.field, data);
      if (reqVal === undefined) continue;

      if (!compare(reqVal, rule.requires.operator, rule.requires.value)) {
        continue;
      }
    }

    // -----------------------------
    // MAIN CONDITION (STRUCTURED TRACE)
    // -----------------------------
    const structuredTrace = evaluateConditionStructured(
      rule.condition,
      data
    );

    const match = structuredTrace.result;

    if (match) {
      (rule as any).__trace = structuredTrace;
      return rule;
    }
  }

  return null;
}

// -----------------------------
// STRUCTURED TRACE EVALUATION
// -----------------------------
function evaluateConditionStructured(
  condition: RuleCondition,
  input: DecisionInput
): ConditionTrace {
  // AND
  if ("all" in condition) {
    const children = condition.all.map((c) =>
      evaluateConditionStructured(c, input)
    );

    const result = children.every((c) => c.result);

    return {
      type: "AND",
      result,
      children,
    };
  }

  // OR
  if ("any" in condition) {
    const children = condition.any.map((c) =>
      evaluateConditionStructured(c, input)
    );

    const result = children.some((c) => c.result);

    return {
      type: "OR",
      result,
      children,
    };
  }

  // LEAF
  const actual = getValue(condition.field, input);

  const result =
    (condition.operator === "eq" && actual === condition.value) ||
    (condition.operator === "gt" && actual > condition.value) ||
    (condition.operator === "lt" && actual < condition.value);

  return {
    type: "LEAF",
    result,
    field: condition.field,
    operator: condition.operator,
    expected: condition.value,
    actual,
  };
}

// -----------------------------
// HELPERS
// -----------------------------
function compare(a: any, operator: string, b: any): boolean {
  if (operator === "eq") return a === b;
  if (operator === "gt") return a > b;
  if (operator === "lt") return a < b;
  return false;
}

function getValue(path: string | undefined, input: any) {
  if (!path || typeof path !== "string") return undefined;
  if (!input || typeof input !== "object") return undefined;

  const parts = path.split(".");
  let current = input;

  for (const part of parts) {
    current = current?.[part];
  }

  return current;
}