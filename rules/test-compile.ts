import { compileRuleSet } from "./compiler";

const schema = require("../schema/schema.json");
const rule_set = require("./rule_set.json");

try {
  const result = compileRuleSet(schema, rule_set);

  console.log("✅ Compile Success");
  console.log("Warnings:", result.warnings);
} catch (err: any) {
  console.error("❌ Compile Failed");
  console.error(err.message);
}