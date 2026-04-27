const { execSync } = require("child_process");

try {
  // get changed files vs main branch
  const output = execSync("git diff --name-only origin/main")
    .toString()
    .trim();

  if (!output) process.exit(0);

  const files = output.split("\n");

  const illegalChanges = files.filter((file) =>
    file.includes("core/intents/") &&
    file.includes("/v1/")
  );

  if (illegalChanges.length > 0) {
    console.error("❌ ERROR: v1 artifacts are immutable.");
    console.error("The following files were modified:\n");

    illegalChanges.forEach((f) => console.error(" - " + f));

    console.error("\n👉 Create a new version (v2) instead.");
    process.exit(1);
  }

  console.log("✅ No illegal v1 changes detected.");
} catch (err) {
  console.error("Error checking v1 changes", err);
  process.exit(1);
}