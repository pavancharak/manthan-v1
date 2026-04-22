import {
  executeDecisionInputRequest,
  executeSignalRequest,
} from "./sdk";

// --------------------------------------
// DECISION LAYER (DO NOT CHANGE)
// --------------------------------------

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

// --------------------------------------
// SIGNAL LAYER (DO NOT CHANGE)
// --------------------------------------

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

// --------------------------------------
// EXECUTION LAYER (DOMAIN-AGNOSTIC)
// --------------------------------------

type ActionHandler = (params: Record<string, unknown>) => Promise<any>;

// 🔌 Action Registry (plug new actions here)
const actionRegistry: Record<string, ActionHandler> = {
  merge_pr: async (params) => {
    console.log("Merging PR:", params);
    return { success: true };
  },

  log: async (params) => {
    console.log("Log:", params);
    return { success: true };
  },
};

// 🚀 Main Execution Entry (used by gateway)
export async function executeAction(
  action: string,
  params: Record<string, unknown>
) {
  const handler = actionRegistry[action];

  if (!handler) {
    throw new Error(`Unknown action: ${action}`);
  }

  return handler(params);
}