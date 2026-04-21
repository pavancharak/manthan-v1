import { validateInput } from "../schema/validator";

describe("schema validator", () => {
  const sampleSchema = {
    schema_version: "schema.v1",
    system_fields: {
      age: "number",
      country: "string",
      vip: "boolean",
    },
  };

  test("rejects unexpected fields", () => {
    const input = {
      system_data: {
        age: 30,
        country: "US",
        region: "NA", // ❌ unexpected
      },
    };

    const result = validateInput(sampleSchema as any, input as any);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Unexpected field: region");
  });

  test("rejects invalid types", () => {
    const input = {
      system_data: {
        age: "30", // ❌ wrong type
        country: 10, // ❌ wrong type
        vip: false,
      },
    };

    const result = validateInput(sampleSchema as any, input as any);

    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Invalid type for age",
        "Invalid type for country",
      ])
    );
  });

  test("rejects non-finite numbers", () => {
    const input = {
      system_data: {
        age: Number.NaN,
        country: "US",
      },
    };

    const result = validateInput(sampleSchema as any, input as any);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for age");
  });

  test("returns missing required fields for incomplete input", () => {
    const input = {
      system_data: {
        vip: true,
      },
    };

    const result = validateInput(sampleSchema as any, input as any);

    expect(result.isValid).toBe(true);
    expect(result.isComplete).toBe(false);
    expect(result.missing_fields).toEqual(
      expect.arrayContaining(["age", "country"])
    );
  });

  test("invalid takes precedence over missing", () => {
    const input = {
      system_data: {
        age: "30", // invalid
      },
    };

    const result = validateInput(sampleSchema as any, input as any);

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid type for age");
  });

  test("accepts valid input", () => {
    const input = {
      system_data: {
        age: 30,
        country: "US",
        vip: false,
      },
    };

    const result = validateInput(sampleSchema as any, input as any);

    expect(result.isValid).toBe(true);
    expect(result.isComplete).toBe(true);
  });
});