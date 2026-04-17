export type SignalPrimitive = string | number | boolean;

export type SignalSource = "AI" | "NON_AI";

export interface Signal {
  id: string;
  source: SignalSource;
  namespace: string;
  key: string;
  value: SignalPrimitive;
  confidence?: number;
  provider?: string;
}

export interface SignalBatch {
  signal_version: string;
  signals: Signal[];
}
