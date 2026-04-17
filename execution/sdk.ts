import { execute } from "../core/engine";
import { DecisionInput, DecisionResult, RuleSet, Schema } from "../core/types";
import { ingestSignalBatch } from "../signals/ingest";
import {
  DecisionInputMappingResult,
  mapSignalsToDecisionInput,
  SignalFieldMapping,
} from "../signals/mapper";
import { SignalBatch } from "../signals/types";

export interface ExecutionContext {
  schema: Schema;
  rule_set: RuleSet;
  mappings?: SignalFieldMapping[];
}

export interface DecisionInputExecutionRequest {
  intent: string;
  input: DecisionInput;
}

export interface SignalExecutionRequest {
  intent: string;
  raw_signal_batch: unknown;
  mappings?: SignalFieldMapping[];
}

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

export function executeDecisionInputRequest(
  context: ExecutionContext,
  request: DecisionInputExecutionRequest
): DecisionInputExecutionResult {
  return {
    mode: "decision_input",
    decision_input: request.input,
    decision_result: execute(
      request.intent,
      request.input,
      context.schema,
      context.rule_set
    ),
    rule_set: context.rule_set,
  };
}

export function executeSignalRequest(
  context: ExecutionContext,
  request: SignalExecutionRequest
): SignalExecutionResult {
  const signal_batch = ingestSignalBatch(request.raw_signal_batch);
  const mapping_result = mapSignalsToDecisionInput(
    signal_batch,
    context.schema,
    request.mappings ?? context.mappings ?? []
  );

  return {
    mode: "signal_batch",
    signal_batch,
    mapping_result,
    decision_result: execute(
      request.intent,
      mapping_result.decision_input,
      context.schema,
      context.rule_set
    ),
    rule_set: context.rule_set,
  };
}
