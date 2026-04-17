import { DecisionInput } from "../core/types";
import { SignalFieldMapping } from "../signals/mapper";
import {
  executeDecisionInputRequest,
  executeSignalRequest,
  ExecutionContext,
} from "./sdk";

export function runDecisionInputIntegration(
  context: ExecutionContext,
  intent: string,
  input: DecisionInput
) {
  return executeDecisionInputRequest(context, { intent, input });
}

export function runSignalIntegration(
  context: ExecutionContext,
  intent: string,
  raw_signal_batch: unknown,
  mappings?: SignalFieldMapping[]
) {
  return executeSignalRequest(context, {
    intent,
    raw_signal_batch,
    mappings,
  });
}
