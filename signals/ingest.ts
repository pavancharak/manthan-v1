import { Signal, SignalBatch, SignalPrimitive, SignalSource } from "./types";

interface RawSignal {
  id?: unknown;
  source?: unknown;
  namespace?: unknown;
  key?: unknown;
  value?: unknown;
  confidence?: unknown;
  provider?: unknown;
}

interface RawSignalBatch {
  signal_version?: unknown;
  signals?: unknown;
}

const VALID_SOURCES = new Set<SignalSource>(["AI", "NON_AI"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSignalPrimitive(value: unknown): value is SignalPrimitive {
  if (typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  return typeof value === "number" && Number.isFinite(value);
}

function normalizeSource(value: unknown, signalId: string): SignalSource {
  if (typeof value !== "string" || !VALID_SOURCES.has(value as SignalSource)) {
    throw new Error(`Signal ${signalId} has invalid source`);
  }

  return value as SignalSource;
}

function normalizeConfidence(value: unknown, signalId: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new Error(`Signal ${signalId} has invalid confidence`);
  }

  return value;
}

function compileSignal(rawSignal: unknown): Signal {
  if (!isPlainObject(rawSignal)) {
    throw new Error("Signal is not an object");
  }

  const candidate = rawSignal as RawSignal;

  if (!isNonEmptyString(candidate.id)) {
    throw new Error("Signal has invalid id");
  }

  const source = normalizeSource(candidate.source, candidate.id);

  if (!isNonEmptyString(candidate.namespace)) {
    throw new Error(`Signal ${candidate.id} has invalid namespace`);
  }

  if (!isNonEmptyString(candidate.key)) {
    throw new Error(`Signal ${candidate.id} has invalid key`);
  }

  if (!isSignalPrimitive(candidate.value)) {
    throw new Error(`Signal ${candidate.id} has invalid value`);
  }

  const confidence = normalizeConfidence(candidate.confidence, candidate.id);

  if (source === "AI" && confidence === undefined) {
    throw new Error(`Signal ${candidate.id} requires confidence`);
  }

  if (source === "NON_AI" && confidence !== undefined) {
    throw new Error(`Signal ${candidate.id} must not include confidence`);
  }

  if (candidate.provider !== undefined && !isNonEmptyString(candidate.provider)) {
    throw new Error(`Signal ${candidate.id} has invalid provider`);
  }

  if (source === "AI" && !isNonEmptyString(candidate.provider)) {
    throw new Error(`Signal ${candidate.id} requires provider`);
  }

  if (source === "NON_AI" && candidate.provider !== undefined) {
    throw new Error(`Signal ${candidate.id} must not include provider`);
  }

  return {
    id: candidate.id,
    source,
    namespace: candidate.namespace,
    key: candidate.key,
    value: candidate.value,
    confidence,
    provider: candidate.provider,
  };
}

function compareSignals(left: Signal, right: Signal): number {
  if (left.source !== right.source) {
    return left.source.localeCompare(right.source);
  }

  if (left.namespace !== right.namespace) {
    return left.namespace.localeCompare(right.namespace);
  }

  if (left.key !== right.key) {
    return left.key.localeCompare(right.key);
  }

  return left.id.localeCompare(right.id);
}

export function ingestSignalBatch(rawBatch: unknown): SignalBatch {
  if (!isPlainObject(rawBatch)) {
    throw new Error("Signal batch is not an object");
  }

  const candidate = rawBatch as RawSignalBatch;

  if (!isNonEmptyString(candidate.signal_version)) {
    throw new Error("Signal batch has invalid signal_version");
  }

  if (!Array.isArray(candidate.signals)) {
    throw new Error("Signal batch has invalid signals");
  }

  const compiledSignals = candidate.signals.map((signal) => compileSignal(signal));
  const seenIds = new Set<string>();
  const seenNamespaceKeys = new Set<string>();

  for (const signal of compiledSignals) {
    if (seenIds.has(signal.id)) {
      throw new Error(`Duplicate signal id: ${signal.id}`);
    }
    seenIds.add(signal.id);

    const namespaceKey = `${signal.namespace}:${signal.key}`;
    if (seenNamespaceKeys.has(namespaceKey)) {
      throw new Error(`Duplicate signal namespace_key: ${namespaceKey}`);
    }
    seenNamespaceKeys.add(namespaceKey);
  }

  return {
    signal_version: candidate.signal_version,
    signals: [...compiledSignals].sort(compareSignals),
  };
}
