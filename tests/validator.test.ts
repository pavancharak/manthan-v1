import { validateInput } from "../schema/validator";
import { DecisionInput, Schema, ValidationResult } from "../core/types";

const sampleSchema: Schema = {
  schema_version: "schema.v1",
  fields: {
    age: { type: "number", required: true },
    country: { type: "string", required: true },
    vip: { type: "boolean", required: false },
  },
};

describe("schema validator", () => {
  test("rejects unexpected fields", () => {
    const input: DecisionInput = {
      age: 30,
      country: "US",
      region: "NA",
    };

    const result = validateInput(sampleSchema, input);

    expect(result).toEqual<ValidationResult>({
      isValid: false,
      isComplete: false,
      errors: ["Unexpected field: region"],
      missing_fields: [],
    });
  });

  test("rejects invalid types", () => {
    const input: DecisionInput = {
      age: "30",
      country: 10,
      vip: false,
    };

    const result = validateInput(sampleSchema, input);

    expect(result).toEqual<ValidationResult>({
      isValid: false,
      isComplete: false,
      errors: ["Invalid type for age", "Invalid type for country"],
      missing_fields: [],
    });
  });

  test("rejects non-finite numbers", () => {
    const input: DecisionInput = {
      age: Number.NaN,
      country: "US",
    };

    const result = validateInput(sampleSchema, input);

    expect(result).toEqual<ValidationResult>({
      isValid: false,
      isComplete: false,
      errors: ["Invalid type for age"],
      missing_fields: [],
    });
  });

  test("returns missing required fields for incomplete input", () => {
    const input: DecisionInput = {
      vip: true,
    };

    const result = validateInput(sampleSchema, input);

    expect(result).toEqual<ValidationResult>({
      isValid: true,
      isComplete: false,
      errors: [],
      missing_fields: ["age", "country"],
    });
  });

  test("invalid takes precedence over missing", () => {
    const input: DecisionInput = {
      age: "30",
    };

    const result = validateInput(sampleSchema, input);

    expect(result).toEqual<ValidationResult>({
      isValid: false,
      isComplete: false,
      errors: ["Invalid type for age"],
      missing_fields: [],
    });
  });

  test("accepts valid input", () => {
    const input: DecisionInput = {
      age: 30,
      country: "US",
      vip: false,
    };

    const result = validateInput(sampleSchema, input);

    expect(result).toEqual<ValidationResult>({
      isValid: true,
      isComplete: true,
      errors: [],
      missing_fields: [],
    });
  });
});
