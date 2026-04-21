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
  const basePath = path.join(__dirname, "..");

  const schemaPath = path.join(
    basePath,
    "schema",
    intent,
    version,
    "schema.json"
  );

  const rulesPath = path.join(
    basePath,
    "rules",
    intent,
    version,
    "rule_set.json"
  );

  // -----------------------------
  // VALIDATION
  // -----------------------------

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found for ${intent}:${version}`);
  }

  if (!fs.existsSync(rulesPath)) {
    throw new Error(`Rules not found for ${intent}:${version}`);
  }

  // -----------------------------
  // LOAD FILES
  // -----------------------------

  const schema: Schema = JSON.parse(
    fs.readFileSync(schemaPath, "utf-8")
  );

  const rawRules = JSON.parse(
    fs.readFileSync(rulesPath, "utf-8")
  );

  // -----------------------------
  // COMPILE RULES
  // -----------------------------

  const ruleSet = compileRuleSet(schema, rawRules);

  return { schema, ruleSet };
}