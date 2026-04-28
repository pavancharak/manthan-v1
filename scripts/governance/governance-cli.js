// scripts/governance/governance-cli.js

const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");

const { createIntent } = require("./create-intent");
const { upgradeIntent } = require("./upgrade-version");

const BASE = path.join(__dirname, "../../core/intents");

// --------------------------------------
// MAIN MENU
// --------------------------------------

async function main() {
  console.clear();

  console.log("\n🧠 Manthan Governance CLI\n");

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Select governance action:",
      choices: [
        {
          name: "Upgrade decision policy version",
          value: "upgrade"
        },
        {
          name: "Create new decision policy",
          value: "create"
        },

        new inquirer.Separator(),

        {
          name: "Exit",
          value: "exit"
        }
      ]
    }
  ]);

  // --------------------------------------
  // EXIT
  // --------------------------------------

  if (action === "exit") {
    console.log("\n👋 Exiting governance CLI\n");
    process.exit(0);
  }

  // --------------------------------------
  // CREATE INTENT
  // --------------------------------------

  if (action === "create") {
    const { intentName } = await inquirer.prompt([
      {
        type: "input",
        name: "intentName",
        message: "Enter new decision policy name:",

        validate(value) {
          if (!value || value.trim() === "") {
            return "Decision policy name required";
          }

          if (!/^[a-z0-9_]+$/.test(value)) {
            return "Use lowercase letters, numbers, underscore only";
          }

          return true;
        }
      }
    ]);

    const { templateType } = await inquirer.prompt([
      {
        type: "list",
        name: "templateType",
        message: "Select template:",
        choices: [
          "generic",
          "payment",
          "merge_safety",

          new inquirer.Separator(),

          "⬅ Back to Main Menu"
        ]
      }
    ]);

    // --------------------------------------
    // BACK
    // --------------------------------------

    if (templateType === "⬅ Back to Main Menu") {
      return main();
    }

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: `Create decision policy ${intentName}@v1?`
      }
    ]);

    if (!confirmed) {
      console.log("\n❌ Operation cancelled\n");
      return main();
    }

    createIntent({
      intentName,
      templateType
    });

    console.log("\n✅ Decision policy creation complete\n");

    return main();
  }

  // --------------------------------------
  // UPGRADE VERSION
  // --------------------------------------

  if (action === "upgrade") {
    const intents = fs
      .readdirSync(BASE)
      .filter((f) => fs.statSync(path.join(BASE, f)).isDirectory());

    const { selected } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selected",
        message: "Select decision policies to upgrade:",
        choices: [
          new inquirer.Separator(),

          {
            name: "⬅ Back to Main Menu",
            value: "__BACK__"
          },

          new inquirer.Separator(),

          ...intents
        ]
      }
    ]);

    // --------------------------------------
    // BACK
    // --------------------------------------

    if (selected.includes("__BACK__")) {
      return main();
    }

    if (selected.length === 0) {
      console.log("\n❌ No decision policies selected\n");
      return main();
    }

    // --------------------------------------
    // SHOW PLANNED UPGRADES
    // --------------------------------------

    console.log("\n📦 Planned upgrades:\n");

    selected.forEach((intent) => {
      const intentPath = path.join(BASE, intent);

      const versions = fs
        .readdirSync(intentPath)
        .filter((v) => /^v\\d+$/.test(v))
        .sort(
          (a, b) =>
            parseInt(b.slice(1)) - parseInt(a.slice(1))
        );

      const latest = versions[0];
      const nextVersion = `v${parseInt(latest.slice(1)) + 1}`;

      console.log(
        ` - ${intent}: ${latest} → ${nextVersion}`
      );
    });

    console.log("");

    // --------------------------------------
    // CONFIRM
    // --------------------------------------

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message:
          "This will create new immutable versions. Continue?"
      }
    ]);

    if (!confirmed) {
      console.log("\n❌ Operation cancelled\n");
      return main();
    }

    // --------------------------------------
    // EXECUTE
    // --------------------------------------

    selected.forEach((intent) => {
      upgradeIntent(intent);
    });

    console.log("\n✅ Version upgrade complete\n");

    return main();
  }
}

// --------------------------------------
// START
// --------------------------------------

main().catch((err) => {
  console.error("\n❌ Governance error:\n");
  console.error(err);
  process.exit(1);
});