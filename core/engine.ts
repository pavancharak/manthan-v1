import { validateInput } from "../schema/validator";
import { evaluateRules } from "./evaluator";
import { DecisionInput, DecisionResult, RuleSet, Schema } from "./types";

export function execute(
  intent: string,
  input: DecisionInput,
  schema: Schema,
  ruleSet: RuleSet
): DecisionResult {
  void intent;

  const validation = validateInput(schema, input);

  const versions = {
    schema_version: schema.schema_version,
    rule_version: ruleSet.rule_version,
  };

  // 🔴 INVALID
  if (!validation.isValid) {
    return {
      status: "INVALID",
      rule_id: null,
      ...versions,
      explanation: {
        reason: "invalid_input",
        details: validation.errors,
      },
    };
  }

  // 🟡 INCOMPLETE
  if (!validation.isComplete) {
    return {
      status: "INCOMPLETE",
      rule_id: null,
      ...versions,
      explanation: {
        reason: "incomplete_input",
        details: { missing_fields: validation.missing_fields },
      },
    };
  }

  // 🟢 RULE EVALUATION
  const rule = evaluateRules(ruleSet.rules, input);

  if (!rule) {
    return {
      status: "DECIDED",
      decision: "ESCALATE",
      rule_id: null,
      ...versions,
      explanation: { reason: "no_rule_match" },
    };
  }

  return {
    status: "DECIDED",
    decision: rule.outcome,
    rule_id: rule.id,
    ...versions,
    explanation: {
      reason: "rule_matched",
      details: rule,
    },
  };
}