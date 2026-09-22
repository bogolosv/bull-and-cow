const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
function worker(fetchImpl) {
  const handlers = {},
    cached = [],
    deleted = [];
  const offline = { offline: true };
  runInNewContext(readFileSync("apps/web/public/sw.js", "utf8"), {
    self: {
      location: { origin: "https://game.example" },
      addEventListener: (name, fn) => (handlers[name] = fn),
    },
    URL,
    fetch: fetchImpl,
    caches: {
      open: async () => ({ addAll: async (paths) => cached.push(...paths) }),
      match: async () => offline,
      keys: async () => ["bull-cow-offline-old", "other-app"],
      delete: async (key) => deleted.push(key),
    },
  });
  return { handlers, cached, deleted, offline };
}
test("offline fallback preserves live requests and never caches game data", async () => {
  const w = worker(async () => {
    throw Error("offline");
  });
  let response;
  w.handlers.fetch({
    request: {
      method: "GET",
      url: "https://game.example/room/private",
      mode: "navigate",
    },
    respondWith: (p) => (response = p),
  });
  assert.equal(await response, w.offline);
  for (const [url, method, mode] of [
    ["https://game.example/api/game", "GET", "cors"],
    ["https://game.example/", "POST", "navigate"],
    ["https://another.example/file", "GET", "cors"],
  ]) {
    let intercepted = false;
    w.handlers.fetch({
      request: { url, method, mode },
      respondWith: () => (intercepted = true),
    });
    assert.equal(intercepted, false);
  }
  const online = worker(async () => ({ live: true }));
  online.handlers.fetch({
    request: {
      method: "GET",
      url: "https://game.example/room/private",
      mode: "navigate",
    },
    respondWith: (p) => (response = p),
  });
  assert.deepEqual(await response, { live: true });
});
test("install precaches offline assets; activation only clears owned obsolete caches", async () => {
  const w = worker();
  let done;
  w.handlers.install({ waitUntil: (p) => (done = p) });
  await done;
  assert.ok(w.cached.includes("/offline.html"));
  assert.ok(!w.cached.includes("/"));
  w.handlers.activate({ waitUntil: (p) => (done = p) });
  await done;
  assert.deepEqual(w.deleted, ["bull-cow-offline-old"]);
  // The mock deliberately supplies no skipWaiting/clients.claim: active games must not be taken over.
});
test("install icons have required PNG dimensions", () => {
  for (const [name, size] of [
    ["icon-192", 192],
    ["icon-512", 512],
    ["maskable-512", 512],
    ["apple-touch-icon", 180],
  ]) {
    const png = readFileSync(`apps/web/public/icons/${name}.png`);
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});
