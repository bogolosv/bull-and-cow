const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildSync } = require("esbuild");
const { runInNewContext } = require("node:vm");
const code = buildSync({
  entryPoints: ["apps/cloudflare-server/src/engine.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  write: false,
}).outputFiles[0].text;
function harness() {
  let now = 100_000;
  const module = { exports: {} };
  class Clock extends Date {
    static now() {
      return now;
    }
  }
  runInNewContext(code, {
    module,
    exports: module.exports,
    require,
    Date: Clock,
    setTimeout,
    clearTimeout,
  });
  const events = [];
  const transport = {
    send: (id, m) => events.push({ id, m: JSON.parse(JSON.stringify(m)) }),
    broadcast: (m) =>
      events.push({ id: "all", m: JSON.parse(JSON.stringify(m)) }),
  };
  let engine = module.exports.createEngine(transport);
  return {
    get e() {
      return engine;
    },
    events,
    advance(ms) {
      now += ms;
      engine.deadlines.drain();
    },
    restart() {
      engine = module.exports.createEngine(
        transport,
        JSON.parse(JSON.stringify(engine.snapshot())),
      );
    },
    command(s, type, payload) {
      engine.command(s, { type, payload });
    },
  };
}
function pair(h) {
  const a = h.e.sessions.claim(null),
    b = h.e.sessions.claim(null);
  h.command(a, "room.create", { playerName: "Alice" });
  h.command(b, "room.join", { roomId: a.roomId, playerName: "Bob" });
  return { a, b, id: a.roomId };
}
function start(h, a, b) {
  h.command(a, "secret.submit", { code: "0123" });
  h.command(b, "secret.submit", { code: "4567" });
  h.advance(5000);
  return h.e.state.matches.get(a.roomId);
}
test("persisted countdown and turn deadlines survive rehydration without resetting", () => {
  const h = harness(),
    { a, b, id } = pair(h);
  h.command(a, "secret.submit", { code: "0123" });
  h.command(b, "secret.submit", { code: "4567" });
  h.advance(3000);
  h.restart();
  h.advance(1999);
  assert.equal(h.e.state.rooms.get(id).phase, "countdown");
  h.advance(1);
  const match = h.e.state.matches.get(id),
    first = match.turnPlayerId;
  assert.equal(match.turnEndsAt, 135000);
  h.advance(20000);
  h.restart();
  h.advance(9999);
  assert.equal(h.e.state.rooms.get(id).phase, "playing");
  h.advance(1);
  assert.equal(h.e.state.rooms.get(id).phase, "finished");
  assert.equal(h.e.state.matches.get(id).reason, "timeout");
  assert.notEqual(h.e.state.matches.get(id).winnerId, first);
  const score = JSON.stringify(h.e.state.rooms.get(id).score);
  h.restart();
  h.advance(60000);
  assert.equal(JSON.stringify(h.e.state.rooms.get(id).score), score);
  assert.equal(h.e.state.secrets.size, 0);
});
test("private history, pause and resume, rematch and stale round protection survive cold starts", () => {
  const h = harness(),
    { a, b, id } = pair(h);
  const match = start(h, a, b);
  const first = match.turnPlayerId === a.playerId ? a : b;
  h.command(first, "game.guess", {
    matchId: match.id,
    revision: 0,
    code: "8901",
  });
  h.advance(7000);
  h.e.sessions.disconnected(a);
  const remaining = h.e.state.matches.get(id).turnRemainingMs;
  assert.equal(remaining, 23000);
  h.advance(10000);
  h.restart();
  const restored = h.e.sessions.claim(a.token);
  assert.equal(restored.playerId, a.playerId);
  h.e.sessions.connected(restored);
  assert.equal(h.e.state.matches.get(id).turnRemainingMs, remaining);
  assert.equal(h.e.state.matches.get(id).attempts.length, 1);
  assert.ok(
    !h.events
      .filter((e) => e.id === b.playerId || e.id === "all")
      .some((e) => JSON.stringify(e.m).includes("0123")),
  );
  const current = h.e.state.matches.get(id);
  h.command(restored, "game.surrender", { matchId: current.id });
  h.command(restored, "game.rematch", { matchId: current.id });
  h.restart();
  const rb = h.e.sessionState.get(b.token);
  h.command(rb, "game.rematch", { matchId: current.id });
  assert.equal(h.e.state.rooms.get(id).phase, "choosing");
  assert.equal(h.e.state.matches.size, 0);
  assert.equal(h.e.state.secrets.size, 0);
  const ra = h.e.sessionState.get(a.token),
    next = start(h, ra, rb);
  h.command(ra, "game.surrender", { matchId: current.id });
  assert.equal(h.events.at(-1).m.payload.code, "MATCH_CHANGED");
  assert.equal(next.winnerId, null);
});
test("expired recovery stays expired after restart and empty rooms are removed", () => {
  const h = harness(),
    { a, b, id } = pair(h);
  start(h, a, b);
  h.e.sessions.disconnected(a);
  h.advance(29000);
  h.restart();
  h.advance(1000);
  assert.equal(h.e.state.matches.get(id).reason, "disconnect");
  assert.equal(h.e.state.matches.get(id).winnerId, b.playerId);
  assert.notEqual(h.e.sessions.claim(a.token).playerId, a.playerId);
  const rb = h.e.sessionState.get(b.token);
  h.command(rb, "room.leave");
  assert.equal(h.e.state.rooms.size, 0);
  assert.equal(h.e.state.matches.size, 0);
  assert.equal(h.e.deadlines.next(), null);
});
