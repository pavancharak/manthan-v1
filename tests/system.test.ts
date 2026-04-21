import fs from "fs";
import path from "path";
import { loadIntent } from "../core/intentLoader";

describe("Manthan System (All Intents)", () => {
  const schemaBasePath = path.join(__dirname, "..", "schema");

  const intents = fs
    .readdirSync(schemaBasePath)
    .filter((name) => {
      const full = path.join(schemaBasePath, name);
      return fs.statSync(full).isDirectory();
    });

  intents.forEach((intent) => {
    test(`intent: ${intent}`, () => {
      const { schema, ruleSet } = loadIntent(intent, "v1");

      expect(schema).toBeDefined();
      expect(ruleSet).toBeDefined();
    });
  });
});