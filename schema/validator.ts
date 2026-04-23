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
    default:
      return false;
  }
}

export function validateInput(schema: any, input: any) {
  const missing_fields: string[] = [];
  const errors: string[] = [];

  // --------------------------------------
  // ✅ Normalize schema → map
  // --------------------------------------

  const fields: Record<string, string> = {};
  const rawFields = schema.system_fields || {};

  if (Array.isArray(rawFields)) {
    for (const f of rawFields) {
      fields[f.name] = f.type;
    }
  } else {
    Object.assign(fields, rawFields);
  }

  // --------------------------------------
  // ✅ Deterministic input selection
  // --------------------------------------

  let data: Record<string, unknown> = {};

  const isObject = input && typeof input === "object";

  if (isObject && "system_data" in input) {
    const keys = Object.keys(input);

    // ❌ Reject mixed shape
    if (keys.length > 1) {
      return {
        isValid: false,
        isComplete: false,
        errors: ["Invalid input shape: mixed nested and flat fields"],
        missing_fields: [],
      };
    }

    data = (input.system_data as Record<string, unknown>) || {};
  } else if (isObject) {
    data = input;
  }

  // --------------------------------------
  // 🔹 Unexpected fields
  // --------------------------------------

  for (const key of Object.keys(data)) {
    if (!(key in fields)) {
      return {
        isValid: false,
        isComplete: false,
        errors: [`Unexpected field: ${key}`],
        missing_fields: [],
      };
    }
  }

  // --------------------------------------
  // 🔹 Validate expected fields
  // --------------------------------------

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

  // --------------------------------------
  // 🔴 Invalid
  // --------------------------------------

  if (errors.length > 0) {
    return {
      isValid: false,
      isComplete: false,
      errors,
      missing_fields: [],
    };
  }

  // --------------------------------------
  // 🟡 Complete / Incomplete
  // --------------------------------------

  return {
    isValid: true,
    isComplete: missing_fields.length === 0,
    errors: [],
    missing_fields,
  };
}