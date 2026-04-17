import { DecisionInput } from "../core/types";
import { SignalFieldMapping } from "../signals/mapper";
import {
  executeDecisionInputRequest,
  executeSignalRequest,
  ExecutionContext,
} from "./sdk";

export interface ExecutionApiResponse {
  status: number;
  body: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function handleExecutionApiRequest(
  context: ExecutionContext,
  payload: unknown
): ExecutionApiResponse {
  try {
    if (!isPlainObject(payload)) {
      return { status: 400, body: { error: "invalid_request" } };
    }

    if (!isNonEmptyString(payload.intent)) {
      return { status: 400, body: { error: "invalid_intent" } };
    }

    if (payload.mode === "decision_input") {
      if (!isPlainObject(payload.input)) {
        return { status: 400, body: { error: "invalid_input" } };
      }

      return {
        status: 200,
        body: executeDecisionInputRequest(context, {
          intent: payload.intent,
          input: payload.input as DecisionInput,
        }),
      };
    }

    if (payload.mode === "signal_batch") {
      return {
        status: 200,
        body: executeSignalRequest(context, {
          intent: payload.intent,
          raw_signal_batch: payload.raw_signal_batch,
          mappings: Array.isArray(payload.mappings)
            ? (payload.mappings as SignalFieldMapping[])
            : undefined,
        }),
      };
    }

    return { status: 400, body: { error: "invalid_mode" } };
  } catch (error) {
    return {
      status: 400,
      body: {
        error: "execution_error",
        message: error instanceof Error ? error.message : "unknown_error",
      },
    };
  }
}
