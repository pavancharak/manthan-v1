const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const INTENTS_DIR = path.join(__dirname, "../core/intents");

// --------------------------------------
// GET CHANGED FILES
// --------------------------------------

function getChangedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf-8",
    });
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// --------------------------------------
// GET LATEST VERSION (v1, v2, v3 → v3)
// --------------------------------------

function getLatestVersion(versions) {
  return versions
    .map((v) => ({
      name: v,
      num: parseInt(v.replace("v", ""), 10),
    }))
    .sort((a, b) => b.num - a.num)[0].name;
}

// --------------------------------------
// MAIN CHECK
// --------------------------------------

function checkImmutableVersions() {
  const changedFiles = getChangedFiles();

  const violations = [];

  const intents = fs.readdirSync(INTENTS_DIR);

  intents.forEach((intent) => {
    const intentPath = path.join(INTENTS_DIR, intent);

    if (!fs.statSync(intentPath).isDirectory()) return;

    const versions = fs
      .readdirSync(intentPath)
      .filter((v) => /^v\d+$/.test(v));

    if (versions.length === 0) return;

    const latest = getLatestVersion(versions);

    versions.forEach((version) => {
      if (version === latest) return; // ✅ allow latest

      const versionPath = path.join(
        "core",
        "intents",
        intent,
        version
      );

      const touched = changedFiles.some((file) =>
        file.startsWith(versionPath)
      );

      if (touched) {
        violations.push(`${intent}@${version}`);
      }
    });
  });

  if (violations.length > 0) {
    console.error("\n❌ Immutable version violation detected:\n");

    violations.forEach((v) => {
      console.error(` - ${v} (cannot be modified)`);
    });

    console.error(
      "\n💡 Only the latest version per intent is editable.\n"
    );

    process.exit(1);
  }

  console.log("✅ Immutable version check passed.");
}

checkImmutableVersions();