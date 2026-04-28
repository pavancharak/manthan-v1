import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DecisionInput, DecisionResult } from "./types";

// --------------------------------------
// TYPES
// --------------------------------------

export interface DecisionEvent {
  type: "DECISION";
  event_id: string;
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
  timestamp: string;
  hash: string;
}

export interface ExecutionEvent {
  type: "EXECUTION";
  event_id: string;
  decision_hash: string;
  action: string;
  status: string;
  timestamp: string;
  hash: string;
}

// --------------------------------------
// CONFIG
// --------------------------------------

const LOG_FILE = path.join(__dirname, "..", "logs", "audit.log");

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
// Deterministic hash
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
// Append log
// --------------------------------------

function appendLog(line: string) {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + "\n", "utf-8");
}

// --------------------------------------
// DECISION LOGGER
// --------------------------------------

export function logDecisionEvent(params: {
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
}) {
  try {
    const timestamp = new Date().toISOString();

    const hashPayload = {
      intent: params.intent,
      intent_version: params.intent_version,
      decision_input: params.decision_input,
      decision_result: params.decision_result,
    };

    const hash = computeHash(hashPayload);

    const event: DecisionEvent = {
      type: "DECISION",
      event_id: generateEventId(),
      ...hashPayload,
      timestamp,
      hash,
    };

    appendLog(JSON.stringify(event));
  } catch {
    // never break execution
  }
}

// --------------------------------------
// EXECUTION LOGGER
// --------------------------------------

export function logExecutionEvent(params: {
  event_id: string;
  decision_hash: string;
  action: string;
  status: string;
}) {
  try {
    const timestamp = new Date().toISOString();

    const hashPayload = {
      decision_hash: params.decision_hash,
      action: params.action,
      status: params.status,
    };

    const hash = computeHash(hashPayload);

    const event: ExecutionEvent = {
      type: "EXECUTION",
      event_id: params.event_id,
      ...hashPayload,
      timestamp,
      hash,
    };

    appendLog(JSON.stringify(event));
  } catch {
    // never break execution
  }
}