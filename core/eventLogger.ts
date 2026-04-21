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

// ensure logs folder exists
function ensureLogDir() {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// deterministic hash
function computeHash(payload: object): string {
  const json = JSON.stringify(payload);
  return crypto.createHash("sha256").update(json).digest("hex");
}

// generate event id
function generateEventId(): string {
  return crypto.randomUUID();
}

// append log safely
function appendLog(line: string) {
  ensureLogDir();
  fs.appendFileSync(LOG_FILE, line + "\n", "utf-8");
}

// main logger
export function logDecisionEvent(params: {
  intent: string;
  intent_version: string;
  decision_input: DecisionInput;
  decision_result: DecisionResult;
}) {
  try {
    const timestamp = new Date().toISOString();

    const base = {
      intent: params.intent,
      intent_version: params.intent_version,
      decision_input: params.decision_input,
      decision_result: params.decision_result,
      timestamp,
    };

    const hash = computeHash(base);

    const event: DecisionEvent = {
      event_id: generateEventId(),
      ...base,
      hash,
    };

    appendLog(JSON.stringify(event));
  } catch {
    // ❗ NEVER break execution
  }
}