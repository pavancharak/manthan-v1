import { ingestSignalBatch } from "../signals/ingest";
import { SignalBatch } from "../signals/types";

describe("signal ingestion", () => {
  test("ingests valid non-AI signals deterministically", () => {
    const result = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [
        {
          id: "z-country",
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          value: "US",
        },
        {
          id: "a-age",
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          value: 30,
        },
      ],
    });

    expect(result).toEqual<SignalBatch>({
      signal_version: "signals.v1",
      signals: [
        {
          id: "a-age",
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          value: 30,
        },
        {
          id: "z-country",
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          value: "US",
        },
      ],
    });
  });

  test("ingests valid AI signals deterministically", () => {
    const result = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [
        {
          id: "b-summary",
          source: "AI",
          namespace: "review",
          key: "summary_label",
          value: "needs_review",
          confidence: 0.72,
          provider: "local-model",
        },
        {
          id: "a-risk",
          source: "AI",
          namespace: "review",
          key: "risk_score",
          value: 0.64,
          confidence: 0.91,
          provider: "local-model",
        },
      ],
    });

    expect(result).toEqual<SignalBatch>({
      signal_version: "signals.v1",
      signals: [
        {
          id: "a-risk",
          source: "AI",
          namespace: "review",
          key: "risk_score",
          value: 0.64,
          confidence: 0.91,
          provider: "local-model",
        },
        {
          id: "b-summary",
          source: "AI",
          namespace: "review",
          key: "summary_label",
          value: "needs_review",
          confidence: 0.72,
          provider: "local-model",
        },
      ],
    });
  });

  test("rejects duplicate signal ids", () => {
    expect(() =>
      ingestSignalBatch({
        signal_version: "signals.v1",
        signals: [
          {
            id: "dup",
            source: "NON_AI",
            namespace: "profile",
            key: "country",
            value: "US",
          },
          {
            id: "dup",
            source: "AI",
            namespace: "review",
            key: "risk_score",
            value: 0.8,
            confidence: 0.9,
            provider: "local-model",
          },
        ],
      })
    ).toThrow("Duplicate signal id: dup");
  });

  test("rejects duplicate namespace and key pairs", () => {
    expect(() =>
      ingestSignalBatch({
        signal_version: "signals.v1",
        signals: [
          {
            id: "country-a",
            source: "NON_AI",
            namespace: "profile",
            key: "country",
            value: "US",
          },
          {
            id: "country-b",
            source: "AI",
            namespace: "profile",
            key: "country",
            value: "CA",
            confidence: 0.81,
            provider: "local-model",
          },
        ],
      })
    ).toThrow("Duplicate signal namespace_key: profile:country");
  });

  test("rejects non-finite numeric values", () => {
    expect(() =>
      ingestSignalBatch({
        signal_version: "signals.v1",
        signals: [
          {
            id: "bad-value",
            source: "NON_AI",
            namespace: "profile",
            key: "age",
            value: Number.NaN,
          },
        ],
      })
    ).toThrow("Signal bad-value has invalid value");
  });

  test("rejects AI signals without confidence", () => {
    expect(() =>
      ingestSignalBatch({
        signal_version: "signals.v1",
        signals: [
          {
            id: "missing-confidence",
            source: "AI",
            namespace: "review",
            key: "risk_score",
            value: 0.2,
            provider: "local-model",
          },
        ],
      })
    ).toThrow("Signal missing-confidence requires confidence");
  });

  test("rejects AI signals without provider", () => {
    expect(() =>
      ingestSignalBatch({
        signal_version: "signals.v1",
        signals: [
          {
            id: "missing-provider",
            source: "AI",
            namespace: "review",
            key: "risk_score",
            value: 0.2,
            confidence: 0.7,
          },
        ],
      })
    ).toThrow("Signal missing-provider requires provider");
  });

  test("rejects confidence on non-AI signals", () => {
    expect(() =>
      ingestSignalBatch({
        signal_version: "signals.v1",
        signals: [
          {
            id: "bad-non-ai",
            source: "NON_AI",
            namespace: "profile",
            key: "country",
            value: "US",
            confidence: 0.5,
          },
        ],
      })
    ).toThrow("Signal bad-non-ai must not include confidence");
  });
});
