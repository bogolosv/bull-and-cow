const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildSync } = require("esbuild");
const { runInNewContext } = require("node:vm");
const code = buildSync({
  entryPoints: ["apps/web/src/lib/session-token.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
}).outputFiles[0].text;
function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}
function load(sessionStorage, localStorage) {
  const module = { exports: {} };
  runInNewContext(code, {
    module,
    exports: module.exports,
    sessionStorage,
    localStorage,
  });
  return module.exports;
}
test("a new tab restores the session after the previous tab is closed", () => {
  const persistent = storage(),
    tab = storage();
  const first = load(tab, persistent);
  assert.equal(first.getSessionToken(), null);
  first.saveSessionToken("player-session");
  assert.equal(load(storage(), persistent).getSessionToken(), "player-session");
  const reopened = load(storage(), persistent);
  reopened.saveSessionToken("replacement-after-expiry");
  assert.equal(
    load(storage(), persistent).getSessionToken(),
    "replacement-after-expiry",
  );
  assert.equal(
    load(tab, persistent).getSessionToken(),
    "player-session",
    "existing tabs keep their identity",
  );
});
test("legacy tab token migrates to persistent storage on the next handshake", () => {
  const tab = storage(),
    persistent = storage();
  tab.setItem("bull-cow-session", "legacy");
  const client = load(tab, persistent);
  assert.equal(client.getSessionToken(), "legacy");
  client.saveSessionToken(client.getSessionToken());
  assert.equal(load(storage(), persistent).getSessionToken(), "legacy");
});
test("blocked storage does not prevent the other storage or memory fallback", () => {
  const blocked = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  const persistent = storage(),
    client = load(blocked, persistent);
  client.saveSessionToken("saved");
  assert.equal(load(blocked, persistent).getSessionToken(), "saved");
  const memory = load(blocked, blocked);
  memory.saveSessionToken("memory");
  assert.equal(memory.getSessionToken(), "memory");
});
