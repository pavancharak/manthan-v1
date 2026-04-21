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

export function validateInput(schema: any, input: any) {
  const missing_fields: string[] = [];
  const errors: string[] = [];

  const fields = schema.system_fields || {};
  const data = input.system_data || {};

  // 🔹 check unexpected fields
  for (const key of Object.keys(data)) {
    if (!fields[key]) {
      return {
        isValid: false,
        isComplete: false,
        errors: [`Unexpected field: ${key}`],
        missing_fields: [],
      };
    }
  }

  // 🔹 validate expected fields
  for (const [field, type] of Object.entries(fields)) {
    const value = data[field];

    if (value === undefined) {
      missing_fields.push(field);
      continue;
    }

    if (!isValueOfType(value, type as any)) {
      errors.push(`Invalid type for ${field}`);
    }
  }

  // 🔹 invalid takes precedence
  if (errors.length > 0) {
    return {
      isValid: false,
      isComplete: false,
      errors,
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