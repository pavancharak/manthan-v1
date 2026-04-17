import { Schema } from "../core/types";
import { ingestSignalBatch } from "../signals/ingest";
import {
  mapSignalsToDecisionInput,
  SignalFieldMapping,
} from "../signals/mapper";

const sampleSchema: Schema = {
  schema_version: "schema.v1",
  fields: {
    age: { type: "number", required: true },
    country: { type: "string", required: true },
    vip: { type: "boolean", required: false },
  },
};

describe("signal to decision input mapping", () => {
  test("supports valid NON_AI mapping into schema fields", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [
        {
          id: "country-signal",
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          value: "US",
        },
        {
          id: "age-signal",
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          value: 30,
        },
      ],
    });

    const mappings: SignalFieldMapping[] = [
      {
        source: "NON_AI",
        namespace: "profile",
        key: "country",
        target_field: "country",
      },
      {
        source: "NON_AI",
        namespace: "profile",
        key: "age",
        target_field: "age",
      },
    ];

    const result = mapSignalsToDecisionInput(signalBatch, sampleSchema, mappings);

    expect(result.decision_input).toEqual({
      age: 30,
      country: "US",
    });
    expect(result.mapped_signal_ids).toEqual(["age-signal", "country-signal"]);
    expect(result.ignored_signal_ids).toEqual([]);
    expect(result.missing_required_fields).toEqual([]);
  });

  test("constructs decision_input deterministically sorted by target_field", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [
        {
          id: "country-signal",
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          value: "US",
        },
        {
          id: "age-signal",
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          value: 30,
        },
      ],
    });

    const mappings: SignalFieldMapping[] = [
      {
        source: "NON_AI",
        namespace: "profile",
        key: "country",
        target_field: "country",
      },
      {
        source: "NON_AI",
        namespace: "profile",
        key: "age",
        target_field: "age",
      },
    ];

    const result = mapSignalsToDecisionInput(signalBatch, sampleSchema, mappings);

    expect(Object.keys(result.decision_input)).toEqual(["age", "country"]);
  });

  test("returns missing_required_fields for required schema fields absent from decision_input", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [
        {
          id: "country-signal",
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          value: "US",
        },
      ],
    });

    const mappings: SignalFieldMapping[] = [
      {
        source: "NON_AI",
        namespace: "profile",
        key: "country",
        target_field: "country",
      },
      {
        source: "NON_AI",
        namespace: "profile",
        key: "age",
        target_field: "age",
      },
    ];

    const result = mapSignalsToDecisionInput(signalBatch, sampleSchema, mappings);

    expect(result.decision_input).toEqual({ country: "US" });
    expect(result.missing_required_fields).toEqual(["age"]);
  });

  test("rejects mapping to unknown schema field", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [],
    });

    expect(() =>
      mapSignalsToDecisionInput(signalBatch, sampleSchema, [
        {
          source: "NON_AI",
          namespace: "profile",
          key: "region",
          target_field: "region",
        },
      ])
    ).toThrow("Mapping target field does not exist: region");
  });

  test("rejects type mismatch", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [
        {
          id: "bad-age",
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          value: "30",
        },
      ],
    });

    expect(() =>
      mapSignalsToDecisionInput(signalBatch, sampleSchema, [
        {
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          target_field: "age",
        },
      ])
    ).toThrow("Mapped signal bad-age type mismatch for age");
  });

  test("rejects duplicate mapping source", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [],
    });

    expect(() =>
      mapSignalsToDecisionInput(signalBatch, sampleSchema, [
        {
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          target_field: "country",
        },
        {
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          target_field: "age",
        },
      ])
    ).toThrow("Duplicate mapping source: NON_AI:profile:country");
  });

  test("rejects duplicate mapping target_field", () => {
    const signalBatch = ingestSignalBatch({
      signal_version: "signals.v1",
      signals: [],
    });

    expect(() =>
      mapSignalsToDecisionInput(signalBatch, sampleSchema, [
        {
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          target_field: "country",
        },
        {
          source: "NON_AI",
          namespace: "profile",
          key: "residence_country",
          target_field: "country",
        },
      ])
    ).toThrow("Duplicate mapping target_field: country");
  });
});