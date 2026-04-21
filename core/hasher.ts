import crypto from "crypto";

// --------------------------------------
// Canonical JSON stringify
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
// Hash function
// --------------------------------------

export function computeDecisionHash(data: {
  intent: string;
  intent_version: string;
  decision_input: any;
  decision_result: any;
}): string {
  const canonical = canonicalize(data);

  return crypto
    .createHash("sha256")
    .update(canonical)
    .digest("hex");
}