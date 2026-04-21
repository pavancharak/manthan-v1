import { logDecisionEvent } from "../core/eventLogger";
import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";
import { DecisionInput, DecisionResult, RuleSet } from "../core/types";

import { ingestSignalBatch } from "../signals/ingest";
import {
  DecisionInputMappingResult,
  mapSignalsToDecisionInput,
  SignalFieldMapping,
} from "../signals/mapper";
import { SignalBatch } from "../signals/types";

// --------------------------------------
// HELPERS
// --------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// --------------------------------------
// REQUEST TYPES
// --------------------------------------

export interface DecisionInputExecutionRequest {
  intent: string;
  intent_version: string;
  input: DecisionInput;
  debug?: boolean;
}

export interface SignalExecutionRequest {
  intent: string;
  intent_version: string;
  raw_signal_batch: unknown;
  mappings?: SignalFieldMapping[];
  debug?: boolean;
}

// --------------------------------------
// RESPONSE TYPES
// --------------------------------------

export interface DecisionInputExecutionResult {
  mode: "decision_input";
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
  rule_set: RuleSet;
}

export interface SignalExecutionResult {
  mode: "signal_batch";
  intent: string;
  intent_version: string;
  signal_batch: SignalBatch;
  mapping_result: DecisionInputMappingResult;
  decision_result: DecisionResult;
  rule_set: RuleSet;
}

// --------------------------------------
// DECISION INPUT EXECUTION
// --------------------------------------

export function executeDecisionInputRequest(
  request: DecisionInputExecutionRequest
): DecisionInputExecutionResult {
  if (!isNonEmptyString(request.intent_version)) {
    throw new Error("Invalid intent_version");
  }

  const { schema, ruleSet } = loadIntent(
    request.intent,
    request.intent_version
  );

  const decision_result = execute(
    request.intent,
    request.input,
    schema,
    ruleSet,
    { debug: request.debug }
  );

  // ✅ EVENT LOGGING (non-blocking, side-effect safe)
  logDecisionEvent({
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: request.input,
    decision_result,
  });

  return {
    mode: "decision_input",
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: request.input,
    decision_result,
    rule_set: ruleSet,
  };
}

// --------------------------------------
// SIGNAL EXECUTION
// --------------------------------------

export function executeSignalRequest(
  request: SignalExecutionRequest
): SignalExecutionResult {
  if (!isNonEmptyString(request.intent_version)) {
    throw new Error("Invalid intent_version");
  }

  const { schema, ruleSet } = loadIntent(
    request.intent,
    request.intent_version
  );

  const signal_batch = ingestSignalBatch(request.raw_signal_batch);

  const mapping_result = mapSignalsToDecisionInput(
    signal_batch,
    schema,
    request.mappings ?? []
  );

  const decision_result = execute(
    request.intent,
    mapping_result.decision_input,
    schema,
    ruleSet,
    { debug: request.debug }
  );

  // ✅ EVENT LOGGING (non-blocking, side-effect safe)
  logDecisionEvent({
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: mapping_result.decision_input,
    decision_result,
  });

  return {
    mode: "signal_batch",
    intent: request.intent,
    intent_version: request.intent_version,
    signal_batch,
    mapping_result,
    decision_result,
    rule_set: ruleSet,
  };
}