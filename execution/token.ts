import { verifyDecisionHash } from "../core/signing";

// --------------------------------------
// CREATE TOKEN (STRING - deterministic)
// --------------------------------------

export function createDecisionToken(payload: {
  decision_input: any;
  signals: any;
  allowed_actions: string[];
  decision: string;
  artifact_hash: string;
  decision_hash: string;
  signature: string;
  trace?: any;
}) {
  const tokenObject = {
    decision_input: payload.decision_input,
    signals: payload.signals,
    allowed_actions: payload.allowed_actions,
    decision: payload.decision,
    artifact_hash: payload.artifact_hash,
    decision_hash: payload.decision_hash,
    signature: payload.signature,
    trace: payload.trace,
  };

  // 🔐 IMPORTANT: deterministic serialization
  return JSON.stringify(tokenObject);
}

// --------------------------------------
// VERIFY TOKEN
// --------------------------------------

export function verifyDecisionToken(token: string) {
  const decoded = JSON.parse(token);

  if (!decoded.decision_hash) {
    throw new Error("Missing decision_hash");
  }

  if (!decoded.signature) {
    throw new Error("Missing signature");
  }

  const valid = verifyDecisionHash(
    decoded.decision_hash,
    decoded.signature
  );

  if (!valid) {
    throw new Error("Invalid signature");
  }

  return true;
}

// --------------------------------------
// DECODE TOKEN
// --------------------------------------

export function decodeDecisionToken(token: string) {
  return JSON.parse(token);
}