import {
  decodeDecisionToken,
  verifyDecisionToken,
} from "./token";

import {
  checkIdempotent,
  storeResult,
} from "./replayStore";

import { logExecutionEvent } from "../core/eventLogger";

// --------------------------------------
// TYPES
// --------------------------------------

export interface ExecutionRequest {
  decision_token: string;
  action: string;
  event_id: string;
}

// --------------------------------------
// EXECUTION WITH VERIFICATION
// --------------------------------------

export async function executeWithVerification(
  payload: ExecutionRequest,
  executor: (action: string, params: any) => Promise<any>
) {
  // --------------------------------------
  // 🔒 1. STRICT VALIDATION
  // --------------------------------------

  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload");
  }

  if (typeof payload.decision_token !== "string") {
    throw new Error("Missing or invalid decision_token");
  }

  if (typeof payload.action !== "string") {
    throw new Error("Missing or invalid action");
  }

  if (typeof payload.event_id !== "string") {
    throw new Error("Missing or invalid event_id");
  }

  // --------------------------------------
  // 🔒 2. IDEMPOTENCY CHECK (FIRST)
  // --------------------------------------

  const idempotency = checkIdempotent(
    payload.event_id,
    payload
  );

  if (idempotency.status === "REPLAY") {
    return idempotency.result;
  }

  // --------------------------------------
  // 🔐 3. VERIFY TOKEN (CRITICAL)
  // --------------------------------------

  verifyDecisionToken(payload.decision_token);

  // --------------------------------------
  // 🔓 4. DECODE TOKEN
  // --------------------------------------

  const decoded = decodeDecisionToken(payload.decision_token);

  // --------------------------------------
  // 🔒 5. TRACE ENFORCEMENT
  // --------------------------------------

  if (!decoded.trace) {
    throw new Error("Missing trace in token");
  }

  // --------------------------------------
  // 🔒 6. ACTION ALLOWLIST
  // --------------------------------------

  if (!decoded.allowed_actions.includes(payload.action)) {
    throw new Error(
      `Action ${payload.action} not allowed`
    );
  }

  // --------------------------------------
  // 🔒 7. DECISION ENFORCEMENT
  // --------------------------------------

  if (decoded.decision !== "ALLOW") {
    throw new Error(
      `Execution blocked: decision = ${decoded.decision}`
    );
  }

  // --------------------------------------
  // ✅ 8. EXECUTE
  // --------------------------------------

  const result = await executor(
    payload.action,
    decoded.decision_input
  );

  const finalResult = {
    status: "EXECUTED",
    action: payload.action,
    event_id: payload.event_id,
    verified: true,
    executed: true,
    result,
  };

  // --------------------------------------
  // 🔒 9. STORE RESULT (IDEMPOTENCY)
  // --------------------------------------

  storeResult(payload.event_id, payload, finalResult);

  // --------------------------------------
  // 🧾 10. AUDIT LOG
  // --------------------------------------

  logExecutionEvent({
    event_id: payload.event_id,
    decision_hash: decoded.decision_hash,
    action: payload.action,
    status: "EXECUTED",
  });

  // --------------------------------------
  // ✅ RETURN
  // --------------------------------------

  return finalResult;
}