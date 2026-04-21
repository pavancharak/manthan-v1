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
// REQUEST TYPES
// --------------------------------------

export interface DecisionInputExecutionRequest {
  intent: string;
  intent_version: string; // ✅ REQUIRED
  input: DecisionInput;
}

export interface SignalExecutionRequest {
  intent: string;
  intent_version: string; // ✅ REQUIRED
  raw_signal_batch: unknown;
  mappings?: SignalFieldMapping[];
}

// --------------------------------------
// RESPONSE TYPES
// --------------------------------------

export interface DecisionInputExecutionResult {
  mode: "decision_input";
  decision_input: DecisionInput;
  decision_result: DecisionResult;
  rule_set: RuleSet;
}

export interface SignalExecutionResult {
  mode: "signal_batch";
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
  if (!request.intent_version) {
    throw new Error("Missing intent_version");
  }

  const { schema, ruleSet } = loadIntent(
    request.intent,
    request.intent_version
  );

  const decision_result = execute(
    request.intent,
    request.input,
    schema,
    ruleSet
  );

  return {
    mode: "decision_input",
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
  if (!request.intent_version) {
    throw new Error("Missing intent_version");
  }

  const { schema, ruleSet } = loadIntent(
    request.intent,
    request.intent_version
  );

  // Step 1: ingest signals
  const signal_batch = ingestSignalBatch(request.raw_signal_batch);

  // Step 2: map signals → decision input
  const mapping_result = mapSignalsToDecisionInput(
    signal_batch,
    schema,
    request.mappings ?? []
  );

  // Step 3: execute decision
  const decision_result = execute(
    request.intent,
    mapping_result.decision_input,
    schema,
    ruleSet
  );

  return {
    mode: "signal_batch",
    signal_batch,
    mapping_result,
    decision_result,
    rule_set: ruleSet,
  };
}