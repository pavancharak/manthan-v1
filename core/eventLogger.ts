import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DecisionInput, DecisionResult } from "./types";

export interface DecisionEvent {
  event_id: string;
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
  timestamp: string;
  hash: string;
}

const LOG_FILE = path.join(__dirname, "..", "logs", "decision.log");

// --------------------------------------
// Ensure logs folder exists
// --------------------------------------

function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// --------------------------------------
// Canonical JSON (deterministic)
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
// Deterministic hash (CRITICAL)
// --------------------------------------

function computeHash(payload: object): string {
  const canonical = canonicalize(payload);

  return crypto.createHash("sha256").update(canonical).digest("hex");
}

// --------------------------------------
// Generate event id
// --------------------------------------

function generateEventId(): string {
  return crypto.randomUUID();
}

// --------------------------------------
// Append log safely
// --------------------------------------

function appendLog(line: string) {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + "\n", "utf-8");
}

// --------------------------------------
// MAIN LOGGER
// --------------------------------------

export function logDecisionEvent(params: {
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
}) {
  try {
    const timestamp = new Date().toISOString();

    // ✅ ONLY deterministic fields
    const hashPayload = {
      intent: params.intent,
      intent_version: params.intent_version,
      decision_input: params.decision_input,
      decision_result: params.decision_result,
    };

    const hash = computeHash(hashPayload);

    const event: DecisionEvent = {
      event_id: generateEventId(), // ❌ NOT part of hash
      ...hashPayload,
      timestamp,                  // ❌ NOT part of hash
      hash,
    };

    appendLog(JSON.stringify(event));
  } catch {
    // ❗ NEVER break execution
  }
}