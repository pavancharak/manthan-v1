import { mapSignalsToDecisionInput } from "../signals/mapper";

describe("mapper", () => {
  test("maps signals correctly", () => {
    const schema = {
      system_fields: {
        age: "number",
        country: "string",
      },
    } as any;

    const mappings = [
      {
        source: "NON_AI",
        namespace: "profile",
        key: "age",
        target_field: "age",
      },
      {
        source: "NON_AI",
        namespace: "profile",
        key: "country",
        target_field: "country",
      },
    ];

    const signal_batch = {
      signals: [
        {
          source: "NON_AI",
          namespace: "profile",
          key: "age",
          value: 30,
        },
        {
          source: "NON_AI",
          namespace: "profile",
          key: "country",
          value: "US",
        },
      ],
    } as any;

    const result = mapSignalsToDecisionInput(
      signal_batch,
      schema,
      mappings
    );

    expect(result.decision_input.system_data!.age).toBe(30);
    expect(result.decision_input.system_data!.country).toBe("US");
  });
});