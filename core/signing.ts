import crypto from "crypto";

// --------------------------------------
// SECRET
// --------------------------------------

const SECRET = process.env.MANTHAN_SECRET;

if (!SECRET) {
  throw new Error("MANTHAN_SECRET is not set");
}

const SECRET_KEY: string = SECRET;

// --------------------------------------
// CANONICAL JSON
// --------------------------------------

function normalizeJSON(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(normalizeJSON).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();

  return `{${sortedKeys
    .map((key) => `"${key}":${normalizeJSON(obj[key])}`)
    .join(",")}}`;
}

// --------------------------------------
// STRICT PAYLOAD NORMALIZATION (CRITICAL)
// --------------------------------------

function normalizePayload(payload: any) {
  return {
    decision_input: payload.decision_input ?? {},
    signals: payload.signals ?? {},
    rule_snapshot: payload.rule_snapshot ?? {},
    allowed_actions: payload.allowed_actions ?? [],
    decision: payload.decision,
    ...(payload.proof_hash !== undefined && {
      proof_hash: payload.proof_hash,
    }),
  };
}

// --------------------------------------
// PROOF HASH
// --------------------------------------

export function computeProofHash(payload: {
  decision_input: Record<string, unknown>;
  signals: Record<string, unknown>;
  rule_snapshot: Record<string, unknown>;
  allowed_actions: string[];
  decision: string;
}): string {
  const normalized = normalizePayload(payload);

  const canonical = normalizeJSON({
    decision_input: normalized.decision_input,
    signals: normalized.signals,
    rule_snapshot: normalized.rule_snapshot,
    allowed_actions: normalized.allowed_actions,
    decision: normalized.decision,
  });

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

// --------------------------------------
// SIGN PAYLOAD
// --------------------------------------

export function signPayload(payload: {
  decision_input: Record<string, unknown>;
  signals: Record<string, unknown>;
  rule_snapshot: Record<string, unknown>;
  allowed_actions: string[];
  decision: string;
  proof_hash: string;
}): string {
  const normalized = normalizePayload(payload);

  const canonical = normalizeJSON({
    decision_input: normalized.decision_input,
    signals: normalized.signals,
    rule_snapshot: normalized.rule_snapshot,
    allowed_actions: normalized.allowed_actions,
    decision: normalized.decision,
    proof_hash: normalized.proof_hash,
  });

  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(canonical)
    .digest("hex");
}

// --------------------------------------
// VERIFY SIGNATURE
// --------------------------------------

export function verifySignature(payload: {
  decision_input: Record<string, unknown>;
  signals: Record<string, unknown>;
  rule_snapshot: Record<string, unknown>;
  allowed_actions: string[];
  decision: string;
  proof_hash: string;
  signature: string;
}): boolean {
  const { signature, ...data } = payload;

  const normalized = normalizePayload(data);

  const canonical = normalizeJSON({
    decision_input: normalized.decision_input,
    signals: normalized.signals,
    rule_snapshot: normalized.rule_snapshot,
    allowed_actions: normalized.allowed_actions,
    decision: normalized.decision,
    proof_hash: normalized.proof_hash,
  });

  const expectedSignature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(canonical)
    .digest("hex");

  return expectedSignature === signature;
}