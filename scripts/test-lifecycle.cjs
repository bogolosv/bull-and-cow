const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildSync } = require("esbuild");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { once } = require("node:events");
const { WebSocket } = require("ws");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function setup(t, timing) {
  const dir = mkdtempSync(join(tmpdir(), "bull-cow-lifecycle-"));
  const file = join(dir, "server.cjs");
  buildSync({
    entryPoints: ["apps/websocket-server/src/server.ts"],
    outfile: file,
    bundle: true,
    platform: "node",
    format: "cjs",
    tsconfig: "tsconfig.base.json",
  });
  const server = require(file).createGameServer(0, timing);
  await once(server, "listening");
  const clients = [];
  t.after(async () => {
    clients.forEach((c) => c.socket.terminate());
    await new Promise((resolve) => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  });
  async function connect(token = null) {
    const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}`);
    const inbox = [],
      history = [];
    socket.on("message", (data) => {
      const m = JSON.parse(data);
      inbox.push(m);
      history.push(m);
    });
    const c = {
      socket,
      history,
      send(type, payload) {
        socket.send(JSON.stringify({ type, payload }));
      },
      clear() {
        inbox.length = 0;
      },
      async wait(type, predicate = () => true) {
        const until = Date.now() + 3000;
        while (Date.now() < until) {
          const i = inbox.findIndex(
            (m) => m.type === type && predicate(m.payload),
          );
          if (i >= 0) return inbox.splice(i, 1)[0].payload;
          await sleep(5);
        }
        throw Error(
          `Missing ${type}: ${predicate}; received ${JSON.stringify(inbox)}`,
        );
      },
      async disconnect() {
        socket.close();
        await once(socket, "close");
      },
    };
    clients.push(c);
    await once(socket, "open");
    c.send("session.resume", { token });
    c.session = await c.wait("session.ready");
    c.id = c.session.playerId;
    return c;
  }
  async function pair() {
    const a = await connect(),
      b = await connect();
    a.send("room.create", { playerName: "Alice" });
    const { roomId } = await a.wait("room.joined");
    b.send("room.join", { roomId, playerName: "Bob" });
    await b.wait("room.joined");
    return { a, b, roomId };
  }
  async function start(a, b) {
    for (const [c, code] of [
      [a, "0123"],
      [b, "4567"],
    ]) {
      c.clear();
      c.send("secret.submit", { code });
      await c.wait("secret.accepted");
    }
    const game = await a.wait("game.state");
    await b.wait("game.state");
    return game;
  }
  return { connect, pair, start };
}

test("production turn is 30 seconds and a successful guess starts a fresh deadline", async (t) => {
  const { pair, start } = await setup(t, { countdownMs: 10 });
  const { a, b } = await pair();
  const game = await start(a, b);
  assert.ok(
    game.turnEndsAt - game.serverTime > 29900 &&
      game.turnEndsAt - game.serverTime <= 30000,
  );
  const first = game.turnPlayerId === a.id ? a : b;
  first.send("game.guess", {
    matchId: game.matchId,
    revision: game.revision,
    code: "8901",
  });
  const next = await a.wait("game.state", (p) => p.revision === 1);
  assert.notEqual(next.turnPlayerId, first.id);
  assert.equal(next.turnRemainingMs, 30000);
  assert.ok(next.turnEndsAt - next.serverTime > 29900);
});

test("timeout, two-sided rematch, persistent score, fresh secrets and stale match protection", async (t) => {
  const { pair, start } = await setup(t, { countdownMs: 10, turnMs: 250 });
  const { a, b, roomId } = await pair();
  const game = await start(a, b);
  const finished = await a.wait("game.state", (p) => p.reason === "timeout");
  assert.notEqual(finished.winnerId, game.turnPlayerId);
  assert.equal(finished.turnEndsAt, null);
  const room = (
    await a.wait("rooms.list", (p) => p.rooms[0]?.phase === "finished")
  ).rooms[0];
  assert.equal(room.score[finished.winnerId], 1);
  a.send("game.rematch", { matchId: game.matchId });
  await a.wait("rematch.accepted");
  const voted = (
    await b.wait("rooms.list", (p) => p.rooms[0]?.rematchPlayerIds.length === 1)
  ).rooms[0];
  assert.equal(voted.phase, "finished");
  a.clear();
  b.send("game.rematch", { matchId: game.matchId });
  await b.wait("rematch.accepted");
  const reset = (
    await a.wait("rooms.list", (p) => p.rooms[0]?.phase === "choosing")
  ).rooms[0];
  assert.equal(reset.id, roomId);
  assert.deepEqual(reset.score, room.score);
  assert.deepEqual(reset.rematchPlayerIds, []);
  assert.ok(reset.players.every((p) => !p.ready));
  const next = await start(a, b);
  assert.notEqual(next.matchId, game.matchId);
  assert.equal(next.attempts.length, 0);
  assert.equal(next.opponentAttempts, 0);
  for (const type of ["game.guess", "game.surrender"]) {
    a.send(type, { matchId: game.matchId, code: "4567", revision: 0 });
    assert.equal((await a.wait("error")).code, "MATCH_CHANGED");
  }
  a.send("game.surrender", { matchId: next.matchId });
  await a.wait("game.state", (p) => p.reason === "surrender");
  const result = (
    await a.wait("rooms.list", (p) => p.rooms[0]?.phase === "finished")
  ).rooms[0];
  assert.equal(
    Object.values(result.score).reduce((a, b) => a + b, 0),
    2,
  );
  a.clear();
  await sleep(300);
  a.send("rooms.list");
  assert.deepEqual((await a.wait("rooms.list")).rooms[0].score, result.score);
});

test("session restores private state, pauses turn time and expires after grace", async (t) => {
  const { pair, start, connect } = await setup(t, {
    countdownMs: 10,
    turnMs: 1200,
    reconnectMs: 500,
  });
  const { a, b, roomId } = await pair();
  const initial = await start(a, b);
  const first = initial.turnPlayerId === a.id ? a : b;
  first.send("game.guess", {
    matchId: initial.matchId,
    revision: 0,
    code: "8901",
  });
  const before = await a.wait("game.state", (p) => p.revision === 1);
  await sleep(150);
  a.clear();
  b.clear();
  await a.disconnect();
  const paused = await b.wait(
    "game.state",
    (p) => p.turnEndsAt === null && !p.winnerId,
  );
  assert.ok(paused.turnRemainingMs < 1150 && paused.turnRemainingMs > 700);
  const offline = (
    await b.wait("rooms.list", (p) =>
      p.rooms[0]?.players.some((p) => !p.connected),
    )
  ).rooms[0].players.find((p) => p.id === a.id);
  assert.ok(offline.reconnectUntil > Date.now());
  b.send("game.guess", {
    matchId: paused.matchId,
    revision: paused.revision,
    code: "9876",
  });
  assert.equal((await b.wait("error")).code, "GAME_PAUSED");
  await sleep(100);
  const restored = await connect(a.session.token);
  assert.equal(restored.id, a.id);
  assert.equal(restored.session.roomId, roomId);
  assert.equal((await restored.wait("secret.accepted")).code, "0123");
  const resumed = await restored.wait("game.state");
  assert.deepEqual(resumed.attempts, before.attempts);
  assert.equal(resumed.matchId, initial.matchId);
  assert.ok(
    Math.abs(resumed.turnEndsAt - resumed.serverTime - paused.turnRemainingMs) <
      30,
  );
  const stranger = await connect();
  assert.equal(stranger.session.roomId, null);
  assert.ok(!JSON.stringify(stranger.history).includes("0123"));
  assert.ok(!JSON.stringify(b.history).includes(a.session.token));
  // A second socket with the same token replaces the first without forfeiting.
  const closed = once(restored.socket, "close");
  const replacement = await connect(a.session.token);
  assert.equal((await closed)[0], 4000);
  assert.equal((await replacement.wait("game.state")).winnerId, null);
  b.clear();
  await replacement.disconnect();
  const lost = await b.wait("game.state", (p) => p.reason === "disconnect");
  assert.equal(lost.winnerId, b.id);
  const expired = await connect(a.session.token);
  assert.notEqual(expired.id, a.id);
  assert.equal(expired.session.roomId, null);
});

test("disconnect cancels countdown, restores own secret and resumes preparation safely", async (t) => {
  const { pair, start, connect } = await setup(t, {
    countdownMs: 150,
    reconnectMs: 700,
  });
  const { a, b } = await pair();
  for (const [c, code] of [
    [a, "0123"],
    [b, "4567"],
  ]) {
    c.send("secret.submit", { code });
    await c.wait("secret.accepted");
  }
  await b.wait("rooms.list", (p) => p.rooms[0]?.phase === "countdown");
  b.clear();
  await a.disconnect();
  await b.wait("rooms.list", (p) => p.rooms[0]?.phase === "choosing");
  await sleep(200);
  assert.equal(b.history.filter((m) => m.type === "game.state").length, 0);
  const restored = await connect(a.session.token);
  assert.equal((await restored.wait("secret.accepted")).code, "0123");
  const resumed = await restored.wait(
    "rooms.list",
    (p) => p.rooms[0]?.phase === "countdown",
  );
  assert.ok(resumed.rooms[0].startsAt > resumed.serverTime);
  await restored.wait("game.state");
  await restored.disconnect();
  await b.disconnect();
  await sleep(750);
  const observer = await connect();
  assert.equal((await observer.wait("rooms.list")).rooms.length, 0);
});
