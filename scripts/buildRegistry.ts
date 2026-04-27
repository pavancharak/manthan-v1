import fs from "fs";
import path from "path";
import { computeArtifactHash } from "../core/hasher";
import { compileRuleSet } from "../rules/compiler";

const basePath = path.join(process.cwd(), "core", "intents");

const registry: Record<string, Record<string, string>> = {};

fs.readdirSync(basePath).forEach((intent) => {
  const intentPath = path.join(basePath, intent);

  if (!fs.statSync(intentPath).isDirectory()) return;

  fs.readdirSync(intentPath).forEach((version) => {
    const schemaPath = path.join(intentPath, version, "schema.json");
    const rulesPath = path.join(intentPath, version, "rules.json");

    if (!fs.existsSync(schemaPath) || !fs.existsSync(rulesPath)) return;

    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    const rawRules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));

    const ruleSet = compileRuleSet(schema, rawRules);
    const hash = computeArtifactHash(schema, ruleSet);

    if (!registry[intent]) registry[intent] = {};
    registry[intent][version] = hash;
  });
});

// 🔥 write directly to artifactRegistry.ts
const output = `export const artifactRegistry: Record<string, Record<string, string>> = ${JSON.stringify(
  registry,
  null,
  2
)};\n`;
fs.writeFileSync(
  path.join(process.cwd(), "core", "artifactRegistry.ts"),
  output
);

console.log("✅ artifactRegistry.ts updated");