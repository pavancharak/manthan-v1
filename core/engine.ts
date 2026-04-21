import { validateInput } from "../schema/validator";
import { evaluateRules } from "./evaluator";
import {
  DecisionInput,
  DecisionResultWithDebug,
  RuleSet,
  Schema,
  DecisionDebugTrace,
} from "./types";

export function execute(
  intent: string,
  input: DecisionInput,
  schema: Schema,
  ruleSet: RuleSet,
  options?: { debug?: boolean } // ✅ NEW
): DecisionResultWithDebug {
  void intent;

  const includeDebug = options?.debug === true; // ✅ NEW

  const validation = validateInput(schema, input);

  const versions = {
    schema_version: schema.schema_version,
    rule_version: ruleSet.rule_version,
  };

  // 🔍 Initialize debug trace
  const debug: DecisionDebugTrace = {
    validation: {
      isValid: validation.isValid,
      errors: validation.errors,
    },
    completeness: {
      isComplete: validation.isComplete,
      missing_fields: validation.missing_fields,
    },
    evaluation: {
      matched_rule_id: null,
      checked_rules: [],
    },
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
      ...(includeDebug && { debug }), // ✅ CONDITIONAL
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
        details: {
          missing_fields: validation.missing_fields,
        },
      },
      ...(includeDebug && { debug }), // ✅ CONDITIONAL
    };
  }

  // 🟢 RULE EVALUATION

  // Track all rules in evaluation order
  debug.evaluation.checked_rules = ruleSet.rules.map((r) => r.id);

  // Evaluate once (deterministic)
  const matchedRule = evaluateRules(ruleSet.rules, input);

  // ❌ No match → ESCALATE
  if (!matchedRule) {
    return {
      status: "DECIDED",
      decision: "ESCALATE",
      rule_id: null,
      ...versions,
      explanation: {
        reason: "no_rule_match",
      },
      ...(includeDebug && { debug }), // ✅ CONDITIONAL
    };
  }

  // ✅ Match found
  debug.evaluation.matched_rule_id = matchedRule.id;

  return {
    status: "DECIDED",
    decision: matchedRule.outcome,
    rule_id: matchedRule.id,
    ...versions,
    explanation: {
      reason: "rule_matched",
      details: matchedRule,
    },
    ...(includeDebug && { debug }), // ✅ CONDITIONAL
  };
}