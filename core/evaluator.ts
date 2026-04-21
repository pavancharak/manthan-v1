import { DecisionInput, Rule } from "./types";

export function evaluateRules(rules: Rule[], input: DecisionInput): Rule | null {
  const sorted = [...rules].sort(
    (a, b) => a.group - b.group || a.order - b.order
  );

  for (const rule of sorted) {
    // 🟡 REQUIREMENTS CHECK
    if (rule.requires) {
      const missing = rule.requires.some(
        (path) => getValue(path, input) === undefined
      );
      if (missing) continue;
    }

    // 🔍 VALUE RESOLUTION
    const val = getValue(rule.condition.field, input);
    if (val === undefined) continue;

    const { operator, value } = rule.condition;

    if (
      (operator === "eq" && val === value) ||
      (operator === "gt" && val > value) ||
      (operator === "lt" && val < value)
    ) {
      return rule;
    }
  }

  return null;
}

function getValue(path: string, input: any) {
  const parts = path.split(".");
  let current = input;

  for (const part of parts) {
    current = current?.[part];
  }

  return current;
}