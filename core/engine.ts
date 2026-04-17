import { validateInput } from "../schema/validator";
import { evaluateRules } from "./evaluator";
import { DecisionInput, Schema, Rule, DecisionResult } from "./types";

export function execute(
intent: string,
input: DecisionInput,
schema: Schema,
rules: Rule[]
): DecisionResult {
const validation = validateInput(schema, input);

if (!validation.isValid) {
return {
decision: "REJECT",
rule_id: null,
explanation: { reason: "invalid_input", details: validation.errors },
};
}

if (!validation.isComplete) {
return {
decision: "ESCALATE",
rule_id: null,
explanation: { reason: "incomplete_input" },
};
}

const rule = evaluateRules(rules, input);

if (!rule) {
return {
decision: "ESCALATE",
rule_id: null,
explanation: { reason: "no_rule_match" },
};
}

return {
decision: rule.outcome,
rule_id: rule.id,
explanation: { reason: "rule_matched", details: rule },
};
}
