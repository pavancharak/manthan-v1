import { DecisionInput, Rule } from "./types";

export function evaluateRules(rules: Rule[], input: DecisionInput): Rule | null {
const sorted = [...rules].sort(
(a, b) => a.group - b.group || a.order - b.order
);

for (const rule of sorted) {
if (rule.requires) {
const missing = rule.requires.some((field) => input[field] === undefined);
if (missing) {
continue;
}
}

const val = input[rule.condition.field];
if (val === undefined) {
continue;
}

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
