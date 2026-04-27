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
  options?: { debug?: boolean }
): DecisionResultWithDebug {
  void intent;

  const includeDebug = options?.debug === true;

  const validation = validateInput(schema, input);

  const versions = {
    schema_version: schema.schema_version,
    rule_version: ruleSet.rule_version,
  };

  // --------------------------------------
  // DEBUG TRACE INIT
  // --------------------------------------

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

  // --------------------------------------
  // INVALID INPUT
  // --------------------------------------

  if (!validation.isValid) {
    return {
      status: "INVALID",
      rule_id: null,
      ...versions,
      explanation: {
        reason: "invalid_input",
        details: validation.errors,
      },
      ...(includeDebug && { debug }),
    };
  }

  // --------------------------------------
  // INCOMPLETE INPUT
  // --------------------------------------

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
      ...(includeDebug && { debug }),
    };
  }

  // --------------------------------------
  // RULE EVALUATION
  // --------------------------------------

  debug.evaluation.checked_rules = ruleSet.rules.map((r) => r.id);

  const matchedRule = evaluateRules(ruleSet.rules, input);

  // --------------------------------------
  // NO MATCH → SAFE ESCALATION
  // --------------------------------------

  if (!matchedRule) {
    return {
      status: "DECIDED",
      decision: "ESCALATE",
      rule_id: null,
      ...versions,
      actions: ["require_human_review"], // ✅ SAFE DEFAULT
      explanation: {
        reason: "no_rule_match",
      },
      ...(includeDebug && { debug }),
    };
  }

  // --------------------------------------
  // MATCH FOUND
  // --------------------------------------

  debug.evaluation.matched_rule_id = matchedRule.id;

  return {
    status: "DECIDED",
    decision: matchedRule.outcome,
    rule_id: matchedRule.id,
    ...versions,
    actions: matchedRule.actions ?? [], // 🔥 CRITICAL FIX
    explanation: {
      reason: "rule_matched",
      details: matchedRule,
    },
    ...(includeDebug && { debug }),
  };
}