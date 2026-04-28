import { signDecisionHash } from "../core/signing";
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

import {
  computeArtifactHash,
  computeDecisionHash,
  computeSignalsHash,
} from "../core/hasher";

// --------------------------------------
// HELPERS
// --------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getSafeDecision(result: DecisionResult): string {
  return result.status === "DECIDED"
    ? result.decision
    : "ESCALATE";
}

function extractTrace(result: DecisionResult): any {
  if (
    result.status === "DECIDED" &&
    result.explanation?.details
  ) {
    return (result.explanation.details as any).__trace;
  }
  return undefined;
}

// ✅ FINAL VALIDATION (supports both schema formats)
function validateSignals(schema: any, input: any) {
  const signalFields = Object.keys(
    schema.fields || schema.system_fields || {}
  );

  for (const key of signalFields) {
    if (!(key in input)) {
      throw new Error(`Missing signal: ${key}`);
    }
  }

  for (const key of Object.keys(input)) {
    if (!signalFields.includes(key)) {
      throw new Error(`Unknown signal: ${key}`);
    }
  }
}

// --------------------------------------
// DECISION INPUT EXECUTION
// --------------------------------------

export function executeDecisionInputRequest(request: {
  intent: string;
  intent_version: string;
  input: DecisionInput;
  debug?: boolean;
}) {
  if (!isNonEmptyString(request.intent_version)) {
    throw new Error("Invalid intent_version");
  }

  const { schema, ruleSet } = loadIntent(
    request.intent,
    request.intent_version
  );

  const artifactHash = computeArtifactHash(schema, ruleSet);

  const decisionInputData =
    (request.input as any)?.system_data ?? request.input;

  validateSignals(schema, decisionInputData);

  const decision_result = execute(
    request.intent,
    decisionInputData,
    schema,
    ruleSet,
    { debug: request.debug }
  );

  const explanation = buildExplanation(
    decision_result,
    decisionInputData
  );

  const trace = extractTrace(decision_result);

  logDecisionEvent({
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: decisionInputData,
    decision_result,
  });

  const safeDecision = getSafeDecision(decision_result);

  const signals_hash = computeSignalsHash(decisionInputData);

  const rule_id =
    decision_result.status === "DECIDED"
      ? decision_result.rule_id!
      : "NO_MATCH";

  const decision_hash = computeDecisionHash({
    intent: request.intent,
    intent_version: request.intent_version,
    artifact_hash: artifactHash,
    signals_hash,
    decision: safeDecision,
    rule_id,
  });

  const signature = signDecisionHash(decision_hash);

  const allowed_actions =
    decision_result.status === "DECIDED"
      ? decision_result.actions ?? []
      : [];

  const token = createDecisionToken({
    intent: request.intent,
    intent_version: request.intent_version,

    decision_input: decisionInputData as any,
    signals: decisionInputData,

    signals_hash,

    allowed_actions,

    decision: safeDecision,
    rule_id,

    artifact_hash: artifactHash,
    decision_hash,
    signature,

    trace,
  });

  return {
    mode: "decision_input",
    intent: request.intent,
    intent_version: request.intent_version,
    decision_result,
    explanation,
    decision_token: token,
    artifact_hash: artifactHash,
    decision_hash,
    signature,
  };
}

// --------------------------------------
// SIGNAL EXECUTION
// --------------------------------------

export function executeSignalRequest(request: {
  intent: string;
  intent_version: string;
  raw_signal_batch: unknown;
  mappings?: SignalFieldMapping[];
  debug?: boolean;
}) {
  if (!isNonEmptyString(request.intent_version)) {
    throw new Error("Invalid intent_version");
  }

  const { schema, ruleSet } = loadIntent(
    request.intent,
    request.intent_version
  );

  const artifactHash = computeArtifactHash(schema, ruleSet);

  const signal_batch = ingestSignalBatch(
    request.raw_signal_batch
  );

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

  const explanation = buildExplanation(
    decision_result,
    mapping_result.decision_input as any
  );

  const trace = extractTrace(decision_result);

  logDecisionEvent({
    intent: request.intent,
    intent_version: request.intent_version,
    decision_input: mapping_result.decision_input,
    decision_result,
  });

  const safeDecision = getSafeDecision(decision_result);

  const signals_hash = computeSignalsHash(
    mapping_result.decision_input
  );

  const rule_id =
    decision_result.status === "DECIDED"
      ? decision_result.rule_id!
      : "NO_MATCH";

  const decision_hash = computeDecisionHash({
    intent: request.intent,
    intent_version: request.intent_version,
    artifact_hash: artifactHash,
    signals_hash,
    decision: safeDecision,
    rule_id,
  });

  const signature = signDecisionHash(decision_hash);

  const allowed_actions =
    decision_result.status === "DECIDED"
      ? decision_result.actions ?? []
      : [];

  const token = createDecisionToken({
    intent: request.intent,
    intent_version: request.intent_version,

    decision_input: mapping_result.decision_input as any,
    signals: signal_batch as any,

    signals_hash,

    allowed_actions,

    decision: safeDecision,
    rule_id,

    artifact_hash: artifactHash,
    decision_hash,
    signature,

    trace,
  });

  return {
    mode: "signal_batch",
    intent: request.intent,
    intent_version: request.intent_version,
    decision_result,
    explanation,
    decision_token: token,
    artifact_hash: artifactHash,
    decision_hash,
    signature,
  };
}