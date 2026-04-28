import { verifyDecisionHash } from "../core/signing";
import { computeDecisionHash } from "../core/hasher";

// --------------------------------------
// TYPES (STRICT CONTRACT)
// --------------------------------------

export interface DecisionTokenPayload {
  intent: string;
  intent_version: string;

  decision_input: any;
  signals: any;

  signals_hash: string;

  allowed_actions: string[];

  decision: string;
  rule_id: string;

  artifact_hash: string;
  decision_hash: string;
  signature: string;

  trace?: any;
}

// --------------------------------------
// CREATE TOKEN (DETERMINISTIC STRING)
// --------------------------------------

export function createDecisionToken(
  payload: DecisionTokenPayload
): string {
  // IMPORTANT: fixed property order → deterministic JSON

  const tokenObject: DecisionTokenPayload = {
    intent: payload.intent,
    intent_version: payload.intent_version,

    decision_input: payload.decision_input,
    signals: payload.signals,

    signals_hash: payload.signals_hash,

    allowed_actions: payload.allowed_actions,

    decision: payload.decision,
    rule_id: payload.rule_id,

    artifact_hash: payload.artifact_hash,
    decision_hash: payload.decision_hash,
    signature: payload.signature,

    trace: payload.trace,
  };

  return JSON.stringify(tokenObject);
}

// --------------------------------------
// VERIFY TOKEN (CRYPTO + INTEGRITY)
// --------------------------------------

export function verifyDecisionToken(token: string): boolean {
  if (typeof token !== "string") {
    throw new Error("Invalid token format");
  }

  let decoded: DecisionTokenPayload;

  try {
    decoded = JSON.parse(token);
  } catch {
    throw new Error("Invalid token JSON");
  }

  // --------------------------------------
  // REQUIRED FIELDS
  // --------------------------------------

  if (!decoded.decision_hash) {
    throw new Error("Missing decision_hash");
  }

  if (!decoded.signature) {
    throw new Error("Missing signature");
  }

  if (!decoded.intent || !decoded.intent_version) {
    throw new Error("Missing intent metadata");
  }

  if (!decoded.signals_hash) {
    throw new Error("Missing signals_hash");
  }

  if (!decoded.artifact_hash) {
    throw new Error("Missing artifact_hash");
  }

  if (!decoded.rule_id) {
    throw new Error("Missing rule_id");
  }

  // --------------------------------------
  // 🔐 VERIFY SIGNATURE
  // --------------------------------------

  const valid = verifyDecisionHash(
    decoded.decision_hash,
    decoded.signature
  );

  if (!valid) {
    throw new Error("Invalid signature");
  }

  // --------------------------------------
  // 🔁 RECOMPUTE DECISION HASH
  // --------------------------------------

  const recomputedHash = computeDecisionHash({
    intent: decoded.intent,
    intent_version: decoded.intent_version,
    artifact_hash: decoded.artifact_hash,
    signals_hash: decoded.signals_hash,
    decision: decoded.decision,
    rule_id: decoded.rule_id,
  });

  if (recomputedHash !== decoded.decision_hash) {
    throw new Error("Decision payload tampered");
  }

  return true;
}

// --------------------------------------
// DECODE TOKEN (SAFE)
// --------------------------------------

export function decodeDecisionToken(
  token: string
): DecisionTokenPayload {
  verifyDecisionToken(token);
  return JSON.parse(token);
}