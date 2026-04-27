 import fs from "fs";
import path from "path";
import { loadIntent } from "../core/intentLoader";

describe("Manthan System (All Intents)", () => {
  const schemaBasePath = path.join(__dirname, "..", "schema");

  let intents: string[] = [];

  if (fs.existsSync(schemaBasePath)) {
    intents = fs
      .readdirSync(schemaBasePath)
      .filter((name) => {
        const full = path.join(schemaBasePath, name);
        return fs.statSync(full).isDirectory();
      });
  }

  // 🔥 Ensure at least one test exists
  if (intents.length === 0) {
    test("no intents found", () => {
      expect(true).toBe(true);
    });
  } else {
    intents.forEach((intent) => {
      test(`intent: ${intent}`, () => {
        const { schema, ruleSet } = loadIntent(intent, "v1");

        expect(schema).toBeDefined();
        expect(ruleSet).toBeDefined();
      });
    });
  }
});