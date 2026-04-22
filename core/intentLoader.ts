import fs from "fs";
import path from "path";
import { compileRuleSet } from "../rules/compiler";
import { Schema, RuleSet } from "./types";

export function loadIntent(
  intent: string,
  version: string
): {
  schema: Schema;
  ruleSet: RuleSet;
} {
  const basePath = path.join(process.cwd(), "core", "intents");

  const schemaPath = path.join(
    basePath,
    intent,
    version,
    "schema.json"
  );

  const rulesPath = path.join(
    basePath,
    intent,
    version,
    "rules.json"
  );
console.log("SCHEMA PATH:", schemaPath);
console.log("RULES PATH:", rulesPath);

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found for ${intent}@${version}`);
  }

  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Rules not found for ${intent}@${version}`);
  }

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const rawRules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));

  const ruleSet = compileRuleSet(schema, rawRules);

  return { schema, ruleSet };
}
