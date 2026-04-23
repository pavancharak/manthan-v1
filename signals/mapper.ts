import { Schema, DecisionInput } from "../core/types";
import { SignalBatch } from "./types";

/* -------------------- TYPES -------------------- */

export interface SignalFieldMapping {
  source: string;
  namespace: string;
  key: string;
  target_field: string;
}

export interface DecisionInputMappingResult {
  decision_input: DecisionInput;
}

/* -------------------- MAIN -------------------- */

export function mapSignalsToDecisionInput(
  signal_batch: SignalBatch,
  schema: Schema,
  mappings: SignalFieldMapping[]
): DecisionInputMappingResult {
  // ✅ FINAL: flat decision input
  const decision_input: DecisionInput = {};

  for (const mapping of mappings) {
    // 🔒 schema validation (fail fast)
    if (!schema.system_fields[mapping.target_field]) {
      throw new Error(
        `Unknown target field in schema: ${mapping.target_field}`
      );
    }

    const signal = signal_batch.signals.find(
      (s) =>
        s.source === mapping.source &&
        s.namespace === mapping.namespace &&
        s.key === mapping.key
    );

    // Missing signal → skip (completeness handled later)
    if (!signal) continue;

    // ✅ assign directly (flat)
    decision_input[mapping.target_field] = signal.value;
  }

  return {
    decision_input,
  };
}