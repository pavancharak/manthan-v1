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
// Artifact hash (schema + rules)
// --------------------------------------

export function computeArtifactHash(schema: any, rules: any): string {
  const canonical = canonicalize({
    schema,
    rules,
  });

  return crypto
    .createHash("sha256")
    .update(canonical)
    .digest("hex");
}

// --------------------------------------
// Decision hash (full binding)
// --------------------------------------

export function computeDecisionHash(data: {
  intent: string;
  intent_version: string;
  decision_input: any;
  decision_result: any;
  artifact_hash: string;
}): string {
  const canonical = canonicalize(data);

  return crypto
    .createHash("sha256")
    .update(canonical)
    .digest("hex");
}