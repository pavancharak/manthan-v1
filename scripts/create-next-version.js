const fs = require("fs");
const path = require("path");

const BASE = path.join(__dirname, "../core/intents");

function getNextVersion(versions) {
  const nums = versions.map((v) => parseInt(v.replace("v", ""), 10));
  const max = Math.max(...nums);
  return `v${max + 1}`;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });

  fs.readdirSync(src).forEach((file) => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function run() {
  const intents = fs.readdirSync(BASE);

  intents.forEach((intent) => {
    const intentPath = path.join(BASE, intent);

    if (!fs.statSync(intentPath).isDirectory()) return;

    const versions = fs
      .readdirSync(intentPath)
      .filter((v) => /^v\d+$/.test(v));

    if (versions.length === 0) return;

    const latest = versions.sort(
      (a, b) => parseInt(b.slice(1)) - parseInt(a.slice(1))
    )[0];

    const next = getNextVersion(versions);

    const src = path.join(intentPath, latest);
    const dest = path.join(intentPath, next);

    if (fs.existsSync(dest)) {
      console.log(`⚠️ ${intent}@${next} already exists`);
      return;
    }

    copyDir(src, dest);

    // 🔥 update rule_version automatically
    const rulesPath = path.join(dest, "rules.json");
    if (fs.existsSync(rulesPath)) {
      const rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
      rules.rule_version = next;
      fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));
    }

    console.log(`✅ Created ${intent}@${next}`);
  });
}

run();