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
  // 🔐 1. Decode + verify token
  // --------------------------------------

  const decoded = decodeDecisionToken(payload.decision_token);

  // --------------------------------------
  // 🔒 2. ACTION ALLOWLIST (FIRST)
  // --------------------------------------

  if (!decoded.allowed_actions.includes(payload.action)) {
    throw new Error("Action not allowed");
  }

  // --------------------------------------
  // 🔒 3. REPLAY PROTECTION
  // --------------------------------------

  if (executedEvents.has(payload.event_id)) {
    throw new Error("Replay detected");
  }

  // --------------------------------------
  // 🔒 4. DECISION ENFORCEMENT (AFTER)
  // --------------------------------------

  if (decoded.decision !== "ALLOW") {
    throw new Error(`Execution blocked: decision = ${decoded.decision}`);
  }

  // --------------------------------------
  // 🔒 5. TRACE ENFORCEMENT
  // --------------------------------------

  if (!decoded.trace) {
    throw new Error("Missing trace in token");
  }

  // --------------------------------------
  // ✅ 6. EXECUTE
  // --------------------------------------

  const result = await executor(
    payload.action,
    decoded.decision_input
  );

  // --------------------------------------
  // 🔒 7. MARK EVENT EXECUTED
  // --------------------------------------

  executedEvents.add(payload.event_id);

  // --------------------------------------
  // ✅ RETURN
  // --------------------------------------

  return {
    status: "EXECUTED",
    action: payload.action,
    event_id: payload.event_id,
    verified: true,
    executed: true, // test compatibility
    result,
  };
}