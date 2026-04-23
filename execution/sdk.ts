import { buildExplanation } from "../core/explanation";
import { logDecisionEvent } from "../core/eventLogger";
import { execute } from "../core/engine";
import { loadIntent } from "../core/intentLoader";
import { DecisionInput, DecisionResult } from "../core/types";

import { ingestSignalBatch } from "../signals/ingest";
import {
  mapSignalsToDecisionInput,
  SignalFieldMapping,
} from "../signals/mapper";

import { createDecisionToken } from "./token";

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
// RESPONSE TYPES (FINAL)
// --------------------------------------

export interface DecisionInputExecutionResult {
  mode: "decision_input";
  intent: string;
  intent_version: string;
  decision_result: DecisionResult;
  explanation: any;
  decision_token: string;
}

export interface SignalExecutionResult {
  mode: "signal_batch";
  intent: string;
  intent_version: string;
  decision_result: DecisionResult;
  explanation: any;
  decision_token: string;
}

// --------------------------------------
// SAFE DECISION EXTRACTION
// --------------------------------------

function getSafeDecision(result: DecisionResult): string {
  return result.status === "DECIDED"
    ? result.decision
    : "ESCALATE";
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

  const decisionInputData =
    request.input?.system_data ?? {};

  const decision_result = execute(
    request.intent,
    decisionInputData,
    schema,
    ruleSet,
    { debug: request.debug }
  );

  // ✅ NEW: extract trace
  let trace = undefined;
  if (
    decision_result.status === "DECIDED" &&
    decision_result.explanation.details
  ) {
    trace = (decision_result.explanation.details as any).__trace;
  }

  const explanation = buildExplanation(
    decision_result,
    decisionInputData
  );

  logDecisionEvent({
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: request.input,
    decision_result,
  });

  const allowed_actions = ["merge_pr"];
  const safeDecision = getSafeDecision(decision_result);

  const token = createDecisionToken({
    decision_input: decisionInputData as any,
    signals: {},
    rule_snapshot: ruleSet as any,
    allowed_actions,
    decision: safeDecision,

    // ✅ FINAL STEP
    trace,
  });

  return {
    mode: "decision_input",
    intent: request.intent,
    intent_version: request.intent_version,
    decision_result,
    explanation,
    decision_token: token,
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

  // ✅ NEW: extract trace
  let trace = undefined;
  if (
    decision_result.status === "DECIDED" &&
    decision_result.explanation.details
  ) {
    trace = (decision_result.explanation.details as any).__trace;
  }

  const explanation = buildExplanation(
    decision_result,
    mapping_result.decision_input as any
  );

  logDecisionEvent({
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: mapping_result.decision_input,
    decision_result,
  });

  const allowed_actions = ["merge_pr"];
  const safeDecision = getSafeDecision(decision_result);

  const token = createDecisionToken({
    decision_input: mapping_result.decision_input as any,
    signals: signal_batch as any,
    rule_snapshot: ruleSet as any,
    allowed_actions,
    decision: safeDecision,

    // ✅ FINAL STEP
    trace,
  });

  return {
    mode: "signal_batch",
    intent: request.intent,
    intent_version: request.intent_version,
    decision_result,
    explanation,
    decision_token: token,
  };
}