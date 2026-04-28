// 6. scripts/governance/upgrade-version.js

const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "../../core/intents");

function upgradeIntent(intent) {
  const intentPath = path.join(BASE, intent);

  if (!fs.existsSync(intentPath)) {
    throw new Error(`Intent not found: ${intent}`);
  }

  const versions = fs
    .readdirSync(intentPath)
    .filter((v) => /^v\d+$/.test(v))
    .sort((a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1)));

  const latest = versions[0];

  const nextVersion = `v${parseInt(latest.slice(1)) + 1}`;

  const src = path.join(intentPath, latest);
  const dest = path.join(intentPath, nextVersion);

  fs.cpSync(src, dest, { recursive: true });

  const schemaPath = path.join(dest, "schema.json");
  const rulesPath = path.join(dest, "rules.json");

  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  schema.schema_version = nextVersion;

  fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));

  const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  rules.rule_version = nextVersion;

  fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));

  console.log(`✅ Created ${intent}@${nextVersion}`);
}

module.exports = {
  upgradeIntent
};