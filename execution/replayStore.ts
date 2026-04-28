import fs from "fs";
import path from "path";
import crypto from "crypto";

const STORE_PATH = path.join(
  process.cwd(),
  "execution",
  "replay-store.json"
);

// --------------------------------------
// INIT
// --------------------------------------

function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({}));
  }
}

type Store = Record<
  string,
  {
    request_hash: string;
    result: any;
  }
>;

function loadStore(): Store {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

function saveStore(store: Store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// --------------------------------------
// HASH REQUEST
// --------------------------------------

function hashRequest(payload: any): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

// --------------------------------------
// PUBLIC API
// --------------------------------------

export function checkIdempotent(event_id: string, payload: any) {
  const store = loadStore();
  const reqHash = hashRequest(payload);

  // first time → proceed
  if (!store[event_id]) {
    return { status: "NEW" as const };
  }

  // same request → safe replay
  if (store[event_id].request_hash === reqHash) {
    return {
      status: "REPLAY" as const,
      result: store[event_id].result,
    };
  }

  // different payload → violation
  throw new Error("Idempotency violation: payload mismatch");
}

export function storeResult(
  event_id: string,
  payload: any,
  result: any
) {
  const store = loadStore();

  store[event_id] = {
    request_hash: hashRequest(payload),
    result,
  };

  saveStore(store);
}