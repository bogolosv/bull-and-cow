const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildSync } = require("esbuild");
const { runInNewContext } = require("node:vm");
function load(file) {
  const module = { exports: {} };
  runInNewContext(
    buildSync({
      entryPoints: [file],
      bundle: true,
      platform: "node",
      format: "cjs",
      write: false,
    }).outputFiles[0].text,
    { module, exports: module.exports, require, Intl },
  );
  return module.exports;
}
const { uk, en, resolveLocale, formatCount } = load("libs/i18n/src/index.ts");
const { errorCodeSchema } = load("libs/shared/src/index.ts");
function keys(value, prefix = "") {
  return Object.entries(value)
    .flatMap(([key, v]) =>
      typeof v === "object" ? keys(v, prefix + key + ".") : [prefix + key],
    )
    .sort();
}
test("both languages cover the same keys and every server error", () => {
  assert.deepEqual(keys(uk), keys(en));
  for (const code of errorCodeSchema.options) {
    assert.ok(uk.errors[code]);
    assert.ok(en.errors[code]);
  }
  for (const dictionary of [uk, en]) {
    for (const section of [
      dictionary.app,
      dictionary.errors,
      ...Object.values(dictionary.ui),
    ])
      for (const text of Object.values(section))
        assert.ok(typeof text === "string" && text.trim());
  }
});
test("cookie takes precedence; language negotiation honors quality and safe fallback", () => {
  for (const [cookie, header, expected] of [
    ["uk", "en-US", "uk"],
    ["en", "uk-UA", "en"],
    [undefined, "uk-UA, en;q=0.8", "uk"],
    [undefined, "de, en-US;q=0.9,uk;q=0.8", "en"],
    ["invalid", "fr", "uk"],
    [undefined, "en;q=0,uk;q=0.5", "uk"],
    [undefined, "en;q=0.4,uk;q=0.9", "uk"],
    [undefined, "EN-us", "en"],
  ])
    assert.equal(resolveLocale(cookie, header), expected);
});
test("attempts and seconds use Ukrainian and English plurals", () => {
  for (const [n, expected] of [
    [0, "0 спроб"],
    [1, "1 спроба"],
    [2, "2 спроби"],
    [5, "5 спроб"],
    [11, "11 спроб"],
    [21, "21 спроба"],
    [22, "22 спроби"],
  ])
    assert.equal(formatCount("uk", n, "attempt"), expected);
  assert.equal(formatCount("en", 1, "attempt"), "1 attempt");
  assert.equal(formatCount("en", 2, "attempt"), "2 attempts");
  assert.equal(formatCount("uk", 1, "second"), "1 секунда");
  assert.equal(formatCount("uk", 3, "second"), "3 секунди");
  assert.equal(formatCount("uk", 5, "second"), "5 секунд");
});
test("protocol returns stable error codes without localized sentences", () => {
  const { parseMessage } = load(
      "apps/websocket-server/src/transport/protocol.ts",
    ),
    messages = [];
  assert.equal(
    parseMessage("{", (m) => messages.push(m)),
    undefined,
  );
  assert.equal(messages[0].payload.code, "INVALID_JSON");
  parseMessage(
    JSON.stringify({
      type: "game.guess",
      payload: { code: "1123", revision: 0 },
    }),
    (m) => messages.push(m),
  );
  assert.equal(messages[1].payload.code, "INVALID_CODE");
  assert.deepEqual(Object.keys(messages[1].payload), ["code"]);
});
