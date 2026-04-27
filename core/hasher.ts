import crypto from "crypto";

// --------------------------------------
// Canonical JSON stringify (deterministic)
// --------------------------------------

function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalize).join(",")}]`;
  }

  const keys = Object.keys(obj).sort();

  return `{${keys
    .map((k) => `"${k}":${canonicalize(obj[k])}`)
    .join(",")}}`;
}

// --------------------------------------
// Generic SHA256 helper
// --------------------------------------

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

// --------------------------------------
// Artifact hash (logic fingerprint)
// --------------------------------------

export function computeArtifactHash(
  schema: any,
  ruleSet: any
): string {
  const canonical = canonicalize({
    schema,
    ruleSet,
  });

  return sha256(canonical);
}

// --------------------------------------
// Signals hash (input fingerprint)
// --------------------------------------

export function computeSignalsHash(signals: any): string {
  const canonical = canonicalize(signals);
  return sha256(canonical);
}

// --------------------------------------
// Decision hash (full binding)
// --------------------------------------

export function computeDecisionHash(data: {
  intent: string;
  intent_version: string;
  artifact_hash: string;
  signals_hash: string;
  decision: string;
  rule_id: string;
}): string {
  const canonical = canonicalize(data);
  return sha256(canonical);
}

// --------------------------------------
// Decision Artifact Builder
// --------------------------------------

export function buildDecisionArtifact(params: {
  intent: string;
  intent_version: string;
  signals: any;
  decision: string;
  rule_id: string;
  schema: any;
  ruleSet: any;
}) {
  const artifact_hash = computeArtifactHash(
    params.schema,
    params.ruleSet
  );

  const signals_hash = computeSignalsHash(params.signals);

  const decision_hash = computeDecisionHash({
    intent: params.intent,
    intent_version: params.intent_version,
    artifact_hash,
    signals_hash,
    decision: params.decision,
    rule_id: params.rule_id,
  });

  return {
    intent: params.intent,
    intent_version: params.intent_version,
    decision: params.decision,
    rule_id: params.rule_id,
    artifact_hash,
    signals_hash,
    decision_hash,
  };
}