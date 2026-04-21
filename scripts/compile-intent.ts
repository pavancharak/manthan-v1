import fs from "fs";
import path from "path";
import { compileRuleSet } from "../rules/compiler";

const basePath = path.join(__dirname, "..");

function compileIntent(intent: string, version: string) {
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

  const outputPath = path.join(
    basePath,
    "rules",
    intent,
    version,
    "compiled.json"
  );

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const rawRules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));

  const compiled = compileRuleSet(schema, rawRules);

  fs.writeFileSync(outputPath, JSON.stringify(compiled, null, 2));

  console.log(`✅ Compiled ${intent}:${version}`);
}

// Example
compileIntent("pr_merge_safety", "v1");