import {
  executeDecisionInputRequest,
  executeSignalRequest,
} from "./sdk";

export function handleDecision(
  intent: string,
  intent_version: string,
  input: any
) {
  return executeDecisionInputRequest({
    intent,
    intent_version,
    input,
  });
}

export function handleSignals(
  intent: string,
  intent_version: string,
  raw_signal_batch: unknown,
  mappings?: any
) {
  return executeSignalRequest({
    intent,
    intent_version,
    raw_signal_batch,
    mappings,
  });
}