import { DecisionInput } from "../core/types";
import { SignalFieldMapping } from "../signals/mapper";
import {
  executeDecisionInputRequest,
  executeSignalRequest,
} from "./sdk";

export interface ExecutionApiResponse {
  status: number;
  body: unknown;
}

// --------------------------------------
// VALIDATORS
// --------------------------------------

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// --------------------------------------
// API HANDLER (FINAL)
// --------------------------------------

export function handleExecutionApiRequest(
  payload: unknown
): ExecutionApiResponse {
  try {
    // ✅ basic validation
    if (!isPlainObject(payload)) {
      return { status: 400, body: { error: "invalid_request" } };
    }

    // ✅ intent
    if (!isNonEmptyString(payload.intent)) {
      return { status: 400, body: { error: "invalid_intent" } };
    }

    // ✅ intent_version
    if (!isNonEmptyString(payload.intent_version)) {
      return { status: 400, body: { error: "invalid_intent_version" } };
    }

    // ✅ debug flag (STEP 6)
    const debug =
      payload.debug === true ||
      payload.debug === "true";

    // --------------------------------------
    // DECISION INPUT MODE
    // --------------------------------------

    if (payload.mode === "decision_input") {
      if (!isPlainObject(payload.input)) {
        return { status: 400, body: { error: "invalid_input" } };
      }

      const result = executeDecisionInputRequest({
        intent: payload.intent as string,
        intent_version: payload.intent_version as string,
        input: payload.input as DecisionInput,
        debug, // ✅ PASS DEBUG
      });

      return {
        status: 200,
        body: result,
      };
    }

    // --------------------------------------
    // SIGNAL BATCH MODE
    // --------------------------------------

    if (payload.mode === "signal_batch") {
      const result = executeSignalRequest({
        intent: payload.intent as string,
        intent_version: payload.intent_version as string,
        raw_signal_batch: payload.raw_signal_batch,
        mappings: Array.isArray(payload.mappings)
          ? (payload.mappings as SignalFieldMapping[])
          : undefined,
        debug, // ✅ PASS DEBUG
      });

      return {
        status: 200,
        body: result,
      };
    }

    // --------------------------------------
    // INVALID MODE
    // --------------------------------------

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