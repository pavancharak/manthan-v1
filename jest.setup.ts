import "dotenv/config";

process.env.MANTHAN_SECRET = "test-secret";

import fs from "fs";
import path from "path";

const STORE_PATH = path.join(
  process.cwd(),
  "execution",
  "replay-store.json"
);

beforeEach(() => {
  if (fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({}));
  }
});