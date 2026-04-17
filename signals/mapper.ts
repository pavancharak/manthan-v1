import { DecisionInput, Schema } from "../core/types";
import { SignalBatch } from "./types";

export interface SignalFieldMapping {
  source: "NON_AI";
  namespace: string;
  key: string;
  target_field: string;
}

export interface DecisionInputMappingResult {
  signal_version: string;
  decision_input: DecisionInput;
  mapped_signal_ids: string[];
  ignored_signal_ids: string[];
  missing_required_fields: string[];
}

function matchesSchemaType(
  value: unknown,
  expectedType: "string" | "number" | "boolean"
): boolean {
  if (expectedType === "string") return typeof value === "string";
  if (expectedType === "number") return typeof value === "number" && Number.isFinite(value);
  if (expectedType === "boolean") return typeof value === "boolean";
  return false;
}

export function mapSignalsToDecisionInput(
  signalBatch: SignalBatch,
  schema: Schema,
  mappings: SignalFieldMapping[]
): DecisionInputMappingResult {
  const mappingMap = new Map<string, SignalFieldMapping>();
  const targetFields = new Set<string>();

  for (const m of mappings) {
    const key = `${m.source}:${m.namespace}:${m.key}`;

    if (mappingMap.has(key)) {
      throw new Error(`Duplicate mapping source: ${key}`);
    }

    if (targetFields.has(m.target_field)) {
      throw new Error(`Duplicate mapping target_field: ${m.target_field}`);
    }

    if (!schema.fields[m.target_field]) {
      throw new Error(`Mapping target field does not exist: ${m.target_field}`);
    }

    mappingMap.set(key, m);
    targetFields.add(m.target_field);
  }

  const assignments = new Map<string, { id: string; value: any }>();
  const mapped: string[] = [];
  const ignored: string[] = [];

  for (const s of signalBatch.signals) {
    const key = `${s.source}:${s.namespace}:${s.key}`;
    const mapping = mappingMap.get(key);

    if (!mapping) {
      ignored.push(s.id);
      continue;
    }

    const schemaField = schema.fields[mapping.target_field];

    if (!matchesSchemaType(s.value, schemaField.type)) {
      throw new Error(`Mapped signal ${s.id} type mismatch for ${mapping.target_field}`);
    }

    assignments.set(mapping.target_field, { id: s.id, value: s.value });
    mapped.push(s.id);
  }

  const decision_input: DecisionInput = {};
  const sortedFields = [...assignments.keys()].sort();

  for (const field of sortedFields) {
    decision_input[field] = assignments.get(field)!.value;
  }

  const missing_required_fields = Object.entries(schema.fields)
    .filter(([f, cfg]) => cfg.required && decision_input[f] === undefined)
    .map(([f]) => f)
    .sort();

  return {
    signal_version: signalBatch.signal_version,
    decision_input,
    mapped_signal_ids: mapped.sort(),
    ignored_signal_ids: ignored.sort(),
    missing_required_fields,
  };
}