import {
  computeProofHash,
  signPayload,
  verifySignature,
} from "../core/signing";

// --------------------------------------
// TOKEN TYPES (FINAL)
// --------------------------------------

export interface DecisionTokenPayload {
  decision_input: Record<string, unknown>;
  signals: Record<string, unknown>;

  // ⚠️ Optional (can remove later)
  rule_snapshot?: Record<string, unknown>;

  allowed_actions: string[];
  decision: string;

  // 🔐 CRITICAL (artifact + decision binding)
  artifact_hash: string;
  decision_hash: string;

  // structured trace (optional but deterministic)
  trace?: Record<string, unknown>;

  proof_hash: string;
  signature: string;
}

// --------------------------------------
// REMOVE UNDEFINED (CRITICAL FOR DETERMINISM)
// --------------------------------------

function removeUndefined(value: any): any {
  if (Array.isArray(value)) {
    return value.map(removeUndefined);
  }

  if (value && typeof value === "object") {
    const cleaned: any = {};

    for (const key of Object.keys(value)) {
      if (value[key] !== undefined) {
        cleaned[key] = removeUndefined(value[key]);
      }
    }

    return cleaned;
  }

  return value;
}

// --------------------------------------
// STABLE (CANONICAL) STRINGIFY
// --------------------------------------

function stableStringify(value: any): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const keys = Object.keys(value).sort();

  return `{${keys
    .map((key) => `"${key}":${stableStringify(value[key])}`)
    .join(",")}}`;
}

// --------------------------------------
// CREATE TOKEN (FINAL)
// --------------------------------------

export function createDecisionToken(
  payload: Omit<DecisionTokenPayload, "proof_hash" | "signature">
): string {
  // ✅ CLEAN + CANONICALIZE
  const canonicalPayload = removeUndefined({
    decision_input: payload.decision_input ?? {},
    signals: payload.signals ?? {},
    rule_snapshot: payload.rule_snapshot ?? {},
    allowed_actions: payload.allowed_actions ?? [],
    decision: payload.decision,

    // 🔐 CRITICAL (must be included in hash + signature)
    artifact_hash: payload.artifact_hash,
    decision_hash: payload.decision_hash,

    trace: payload.trace,
  });

  // 🔐 deterministic hash
  const proof_hash = computeProofHash(canonicalPayload);

  // 🔐 deterministic signature
  const signature = signPayload({
    ...canonicalPayload,
    proof_hash,
  });

  const fullPayload: DecisionTokenPayload = {
    ...canonicalPayload,
    proof_hash,
    signature,
  };

  // 🔐 canonical encoding
  return Buffer.from(stableStringify(fullPayload)).toString("base64");
}

// --------------------------------------
// DECODE TOKEN (STRICT + VERIFIED)
// --------------------------------------

export function decodeDecisionToken(token: string): DecisionTokenPayload {
  let decoded: DecisionTokenPayload;

  try {
    const buffer = Buffer.from(token, "base64");

    // strict encoding validation
    const reEncoded = buffer.toString("base64");
    if (reEncoded !== token) {
      throw new Error("Invalid token encoding");
    }

    decoded = JSON.parse(buffer.toString("utf-8"));
  } catch {
    throw new Error("Invalid token format");
  }

  // --------------------------------------
  // REBUILD CANONICAL PAYLOAD
  // --------------------------------------

  const canonicalPayload = removeUndefined({
    decision_input: decoded.decision_input ?? {},
    signals: decoded.signals ?? {},
    rule_snapshot: decoded.rule_snapshot ?? {},
    allowed_actions: decoded.allowed_actions ?? [],
    decision: decoded.decision,

    // 🔐 MUST MATCH CREATE
    artifact_hash: decoded.artifact_hash,
    decision_hash: decoded.decision_hash,

    trace: decoded.trace,
  });

  // --------------------------------------
  // VERIFY HASH
  // --------------------------------------

  const recomputedHash = computeProofHash(canonicalPayload);

  if (recomputedHash !== decoded.proof_hash) {
    throw new Error("Token hash mismatch");
  }

  // --------------------------------------
  // VERIFY SIGNATURE
  // --------------------------------------

  const valid = verifySignature({
    ...canonicalPayload,
    proof_hash: decoded.proof_hash,
    signature: decoded.signature,
  });

  if (!valid) {
    throw new Error("Invalid token signature");
  }

  // --------------------------------------
  // RETURN TRUSTED PAYLOAD
  // --------------------------------------

  return {
    ...canonicalPayload,
    proof_hash: decoded.proof_hash,
    signature: decoded.signature,
  };
}