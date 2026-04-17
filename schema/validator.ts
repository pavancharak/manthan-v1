import { DecisionInput, Schema, ValidationResult } from "../core/types";

function isValueOfType(
  value: unknown,
  expectedType: "string" | "number" | "boolean"
): boolean {
  switch (expectedType) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
  }
}

export function validateInput(
  schema: Schema,
  input: DecisionInput
): ValidationResult {
  const missing_fields: string[] = [];
  const invalidTypeErrors: string[] = [];

  for (const key of Object.keys(input)) {
    if (!schema.fields[key]) {
      return {
        isValid: false,
        isComplete: false,
        errors: [`Unexpected field: ${key}`],
        missing_fields: [],
      };
    }
  }

  for (const [field, config] of Object.entries(schema.fields)) {
    const value = input[field];

    if (config.required && value === undefined) {
      missing_fields.push(field);
      continue;
    }

    if (value !== undefined && !isValueOfType(value, config.type)) {
      invalidTypeErrors.push(`Invalid type for ${field}`);
    }
  }

  if (invalidTypeErrors.length > 0) {
    return {
      isValid: false,
      isComplete: false,
      errors: invalidTypeErrors,
      missing_fields: [],
    };
  }

  return {
    isValid: true,
    isComplete: missing_fields.length === 0,
    errors: [],
    missing_fields,
  };
}
