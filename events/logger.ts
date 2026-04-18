import fs from "fs";
import path from "path";

export interface DecisionEvent {
  timestamp: string;
  intent: string;
  decision_input: any;
  decision_result: any;
  schema_version: string;
  rule_version: string;
}

const LOG_FILE = path.join(__dirname, "events.log");

export function logDecisionEvent(event: DecisionEvent) {
  const line = JSON.stringify(event) + "\n";

  fs.appendFileSync(LOG_FILE, line, "utf-8");
}