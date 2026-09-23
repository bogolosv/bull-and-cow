const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Miniflare } = require("miniflare");
const { buildSync } = require("esbuild");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test(
  "real Durable Object: origin checks, hibernation, alarms, sessions, rematch and private state",
  { timeout: 65000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), "bull-cow-cf-"));
    const script = join(directory, "worker.mjs");
    buildSync({
      entryPoints: ["apps/cloudflare-server/src/worker.ts"],
      outfile: script,
      bundle: true,
      format: "esm",
      platform: "node",
      external: ["cloudflare:workers", "node:crypto"],
      tsconfig: "tsconfig.base.json",
    });
    const mf = new Miniflare({
      name: "test-game",
      modules: true,
      modulesRoot: directory,
      scriptPath: script,
      compatibilityDate: "2026-07-21",
      compatibilityFlags: ["nodejs_compat"],
      durableObjects: {
        GAME_LOBBY: { className: "GameLobby", useSQLite: true },
      },
      durableObjectsPersist: join(directory, "data"),
      bindings: { ALLOWED_ORIGINS: "https://game.example" },
    });
    const clients = [];
    t.after(async () => {
      for (const c of clients) {
        clearInterval(c.heartbeat);
        try {
          c.socket.close();
        } catch {}
      }
      await mf.dispose();
      rmSync(directory, { recursive: true, force: true });
    });
    assert.equal((await mf.dispatchFetch("http://local/health")).status, 200);
    assert.equal(
      (
        await mf.dispatchFetch("http://local/", {
          headers: { Upgrade: "websocket", Origin: "https://evil.example" },
        })
      ).status,
      403,
    );
    async function connect(token = null) {
      const response = await mf.dispatchFetch("http://local/", {
        headers: { Upgrade: "websocket", Origin: "https://game.example" },
      });
      assert.equal(response.status, 101);
      const socket = response.webSocket;
      const inbox = [],
        history = [];
      let pongs = 0;
      socket.addEventListener("message", (event) => {
        if (event.data === "bull-cow:pong") {
          pongs++;
          return;
        }
        const message = JSON.parse(event.data);
        inbox.push(message);
        history.push(message);
      });
      socket.accept();
      const c = {
        socket,
        history,
        get pongs() {
          return pongs;
        },
        clear() {
          inbox.length = 0;
        },
        send(type, payload) {
          socket.send(JSON.stringify({ type, payload }));
        },
        async wait(type, predicate = () => true, timeout = 5000) {
          const end = Date.now() + timeout;
          while (Date.now() < end) {
            const index = inbox.findIndex(
              (m) => m.type === type && predicate(m.payload),
            );
            if (index >= 0) return inbox.splice(index, 1)[0].payload;
            await sleep(10);
          }
          throw Error(`Missing ${type}: ${JSON.stringify(inbox)}`);
        },
      };
      c.heartbeat = setInterval(() => {
        try {
          socket.send("bull-cow:ping");
        } catch {}
      }, 5000);
      clients.push(c);
      c.send("session.resume", { token });
      c.session = await c.wait("session.ready");
      return c;
    }
    const a = await connect(),
      b = await connect(),
      observer = await connect();
    a.send("room.create", { playerName: "Alice" });
    const { roomId } = await a.wait("room.joined");
    b.send("room.join", { roomId, playerName: "Bob" });
    await b.wait("room.joined");
    for (const [c, code] of [
      [a, "0123"],
      [b, "4567"],
    ]) {
      c.send("secret.submit", { code });
      await c.wait("secret.accepted");
    }
    await a.wait("rooms.list", (p) => p.rooms[0]?.phase === "countdown");
    await mf.unsafeEvictDurableObject("test-game", "GameLobby", {
      name: "public-v1",
      webSockets: "hibernate",
    });
    const initial = await a.wait("game.state", () => true, 8000);
    await b.wait("game.state");
    assert.ok(initial.turnEndsAt - initial.serverTime > 29000);
    assert.equal(initial.attempts.length, 0);
    const first = initial.turnPlayerId === a.session.playerId ? a : b;
    first.send("game.guess", {
      matchId: initial.matchId,
      revision: 0,
      code: "8901",
    });
    await a.wait("game.state", (p) => p.revision === 1);
    await b.wait("game.state", (p) => p.revision === 1);
    // Evict the JS object while leaving both actual sockets attached.
    await mf.unsafeEvictDurableObject("test-game", "GameLobby", {
      name: "public-v1",
      webSockets: "hibernate",
    });
    a.socket.send("bull-cow:ping");
    await sleep(50);
    assert.ok(a.pongs > 0);
    clearInterval(a.heartbeat);
    a.socket.close();
    const paused = await b.wait(
      "game.state",
      (p) => p.turnEndsAt === null && !p.winnerId,
    );
    const restored = await connect(a.session.token);
    assert.equal(restored.session.playerId, a.session.playerId);
    assert.equal(restored.session.roomId, roomId);
    assert.equal((await restored.wait("secret.accepted")).code, "0123");
    const resumed = await restored.wait("game.state");
    assert.equal(resumed.matchId, initial.matchId);
    assert.ok(resumed.turnRemainingMs <= paused.turnRemainingMs);
    assert.ok(resumed.attempts.length + resumed.opponentAttempts === 1);
    restored.send("game.surrender", { matchId: initial.matchId });
    const finished = await b.wait(
      "game.state",
      (p) => p.reason === "surrender",
    );
    assert.equal(finished.winnerId, b.session.playerId);
    await restored.wait("game.state", (p) => p.reason === "surrender");
    restored.send("game.rematch", { matchId: initial.matchId });
    await restored.wait("rematch.accepted");
    await mf.unsafeEvictDurableObject("test-game", "GameLobby", {
      name: "public-v1",
      webSockets: "hibernate",
    });
    b.send("game.rematch", { matchId: initial.matchId });
    await b.wait("rematch.accepted");
    await restored.wait(
      "rooms.list",
      (p) =>
        p.rooms[0]?.phase === "choosing" &&
        p.rooms[0]?.score[b.session.playerId] === 1,
    );
    restored.clear();
    b.clear();
    for (const [c, code] of [
      [restored, "1357"],
      [b, "2468"],
    ]) {
      c.send("secret.submit", { code });
      await c.wait("secret.accepted");
    }
    const next = await restored.wait(
      "game.state",
      (p) => p.matchId !== initial.matchId,
      8000,
    );
    await b.wait("game.state", (p) => p.matchId === next.matchId);
    assert.equal(next.attempts.length, 0);
    restored.send("game.surrender", { matchId: initial.matchId });
    assert.equal((await restored.wait("error")).code, "MATCH_CHANGED");
    await mf.unsafeEvictDurableObject("test-game", "GameLobby", {
      name: "public-v1",
      webSockets: "hibernate",
    });
    const timedOut = await restored.wait(
      "game.state",
      (p) => p.reason === "timeout",
      33000,
    );
    assert.notEqual(timedOut.winnerId, next.turnPlayerId);
    assert.equal(
      observer.history.filter((m) => m.type === "game.state").length,
      0,
    );
    assert.ok(!JSON.stringify(observer.history).includes("0123"));
    assert.ok(!JSON.stringify(b.history).includes(a.session.token));
  },
);
