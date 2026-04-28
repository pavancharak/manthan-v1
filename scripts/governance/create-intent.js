// 5. scripts/governance/create-intent.js

const fs = require("fs");
const path = require("path");

const {
  genericTemplate,
  paymentTemplate,
  mergeSafetyTemplate
} = require("./templates");

const BASE = path.join(__dirname, "../../core/intents");

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function createIntent({ intentName, templateType }) {
  const intentPath = path.join(BASE, intentName);

  if (fs.existsSync(intentPath)) {
    throw new Error(`Intent already exists: ${intentName}`);
  }

  const versionPath = path.join(intentPath, "v1");

  fs.mkdirSync(versionPath, { recursive: true });

  let template;

  switch (templateType) {
    case "payment":
      template = paymentTemplate(intentName);
      break;

    case "merge_safety":
      template = mergeSafetyTemplate(intentName);
      break;

    default:
      template = genericTemplate(intentName);
  }

  writeJson(path.join(versionPath, "schema.json"), template.schema);
  writeJson(path.join(versionPath, "rules.json"), template.rules);

  console.log(`✅ Created intent ${intentName}@v1`);
}

module.exports = {
  createIntent
};