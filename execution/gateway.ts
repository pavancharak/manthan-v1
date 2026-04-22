import { decodeDecisionToken } from "./token";

// --------------------------------------
// TYPES
// --------------------------------------

export interface ExecutionRequest {
  decision_token: string;
  action: string;
  event_id: string;
}

// --------------------------------------
// REPLAY PROTECTION
// --------------------------------------

const executedEvents = new Set<string>();

// --------------------------------------
// EXECUTION WITH VERIFICATION
// --------------------------------------

export async function executeWithVerification(
  payload: ExecutionRequest,
  executor: (action: string, params: any) => Promise<any>
) {
  // --------------------------------------
  // 1. Decode + verify token (FULL TRUST BOUNDARY)
  // --------------------------------------

  const decoded = decodeDecisionToken(payload.decision_token);

  // decoded contains:
  // - decision_input
  // - allowed_actions
  // - decision
  // - rule_snapshot
  // - signals

  // --------------------------------------
  // 2. Action allowlist
  // --------------------------------------

  if (!decoded.allowed_actions.includes(payload.action)) {
    throw new Error("Action not allowed");
  }

  // --------------------------------------
  // 3. Replay protection
  // --------------------------------------

  if (executedEvents.has(payload.event_id)) {
    throw new Error("Replay detected");
  }

  // --------------------------------------
  // 4. Execute with trusted input
  // --------------------------------------

  const result = await executor(
    payload.action,
    decoded.decision_input
  );

  // --------------------------------------
  // 5. Mark event executed
  // --------------------------------------

  executedEvents.add(payload.event_id);

  return result;
}