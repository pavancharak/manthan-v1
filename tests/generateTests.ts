import schema from "../schema/schema.json";

function getValues(type: string) {
  if (type === "boolean") return [true, false];
  if (type === "number") return [0, 10000, 10001];
  return [];
}

function generateInputs(fields: any) {
  const keys = Object.keys(fields);

  function helper(index: number, current: any, results: any[]) {
    if (index === keys.length) {
      results.push({ ...current });
      return;
    }

    const key = keys[index];
    const values = getValues(fields[key]);

    for (const val of values) {
      current[key] = val;
      helper(index + 1, current, results);
    }
  }

  const results: any[] = [];
  helper(0, {}, results);
  return results;
}

const inputs = generateInputs(schema.system_fields);

console.log("Generated test cases:", inputs.length);