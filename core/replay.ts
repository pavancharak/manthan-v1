import { execute } from "./engine";
import { loadIntent } from "./intentLoader";
import { DecisionResult, DecisionInput } from "./types";

// --------------------------------------
// Replay Result
// --------------------------------------

export interface ReplayResult {
  original_decision: DecisionResult;
  replayed_decision: DecisionResult;
  is_match: boolean;
}

// --------------------------------------
// Replay Function
// --------------------------------------

export function replayDecisionEvent(event: {
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
}): ReplayResult {
  const { schema, ruleSet } = loadIntent(
    event.intent,
    event.intent_version
  );

  const replayed = execute(
    event.intent,
    event.decision_input,
    schema,
    ruleSet
  );

  const is_match =
    JSON.stringify(replayed) === JSON.stringify(event.decision_result);

  return {
    original_decision: event.decision_result,
    replayed_decision: replayed,
    is_match,
  };
}