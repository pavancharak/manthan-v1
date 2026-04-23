import { computeProofHash, signPayload, verifySignature } from "../core/signing";

// --------------------------------------
// TOKEN TYPES
// --------------------------------------

export interface DecisionTokenPayload {
  decision_input: Record<string, unknown>;
  signals: Record<string, unknown>;
  rule_snapshot: Record<string, unknown>;
  allowed_actions: string[];
  decision: string;

  // ✅ NEW (STRUCTURED TRACE)
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
// MUST MATCH HASHING LOGIC
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
// CREATE TOKEN
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

    // ✅ NEW: trace included in hash + signature
    trace: payload.trace,
  });

  // 🔐 deterministic hash
  const proof_hash = computeProofHash(canonicalPayload);

  // 🔐 deterministic signature
  const signature = signPayload({
    ...canonicalPayload,
    proof_hash,
  });

  // 🔐 full token payload
  const fullPayload: DecisionTokenPayload = {
    ...canonicalPayload,
    proof_hash,
    signature,
  };

  // 🔥 canonical encoding
  return Buffer.from(stableStringify(fullPayload)).toString("base64");
}

// --------------------------------------
// DECODE TOKEN (STRICT + VERIFIED)
// --------------------------------------

export function decodeDecisionToken(token: string): DecisionTokenPayload {
  let decoded: DecisionTokenPayload;

  try {
    const buffer = Buffer.from(token, "base64");

    // 🔐 strict base64 validation
    const reEncoded = buffer.toString("base64");
    if (reEncoded !== token) {
      throw new Error("Invalid token encoding");
    }

    const json = buffer.toString("utf-8");
    decoded = JSON.parse(json);
  } catch {
    throw new Error("Invalid token format");
  }

  // --------------------------------------
  // ✅ CLEAN + CANONICALIZE (MATCH CREATION)
  // --------------------------------------

  const canonicalPayload = removeUndefined({
    decision_input: decoded.decision_input ?? {},
    signals: decoded.signals ?? {},
    rule_snapshot: decoded.rule_snapshot ?? {},
    allowed_actions: decoded.allowed_actions ?? [],
    decision: decoded.decision,

    // ✅ MUST MATCH CREATE
    trace: decoded.trace,
  });

  // --------------------------------------
  // 🔐 VERIFY HASH
  // --------------------------------------

  const recomputedHash = computeProofHash(canonicalPayload);

  if (recomputedHash !== decoded.proof_hash) {
    throw new Error("Token hash mismatch");
  }

  // --------------------------------------
  // 🔐 VERIFY SIGNATURE
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
  // ✅ RETURN TRUSTED PAYLOAD
  // --------------------------------------

  return {
    ...canonicalPayload,
    proof_hash: decoded.proof_hash,
    signature: decoded.signature,
  };
}