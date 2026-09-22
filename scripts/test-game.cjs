const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildSync } = require("esbuild");
const { mkdtempSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { runInNewContext } = require("node:vm");
const { WebSocket } = require("ws");
const moduleObject = { exports: {} };
runInNewContext(
  buildSync({
    entryPoints: ["apps/websocket-server/src/matches/game.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    write: false,
  }).outputFiles[0].text,
  { module: moduleObject, exports: moduleObject.exports, require },
);
const { scoreGuess } = moduleObject.exports;
test("scoring counts exact positions, misplaced digits and leading zero", () => {
  for (const [secret, guess, bulls, cows] of [
    ["0482", "0482", 4, 0],
    ["0482", "4820", 0, 4],
    ["0482", "0428", 2, 2],
    ["0482", "0123", 1, 1],
    ["0482", "1356", 0, 0],
    ["9876", "9801", 2, 0],
  ])
    assert.equal(
      JSON.stringify(scoreGuess(secret, guess)),
      JSON.stringify({ bulls, cows }),
    );
});

test(
  "authoritative turns, private attempts, victory, surrender and disconnect",
  { timeout: 30000 },
  async (t) => {
    const directory = mkdtempSync(join(tmpdir(), "bull-cow-game-"));
    const output = join(directory, "server.cjs");
    buildSync({
      entryPoints: ["apps/websocket-server/src/main.ts"],
      outfile: output,
      tsconfig: "tsconfig.base.json",
      bundle: true,
      platform: "node",
      format: "cjs",
    });
    const server = spawn(process.execPath, [output], {
      env: { ...process.env, PORT: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const clients = [];
    t.after(async () => {
      clients.forEach((c) => c.terminate());
      if (server.exitCode === null) {
        server.kill();
        await once(server, "exit");
      }
      rmSync(directory, { recursive: true, force: true });
    });
    const [started] = await once(server.stdout, "data");
    const port = started.toString().match(/:(\d+)/)[1];
    async function connect(name, secret) {
      const socket = new WebSocket(`ws://127.0.0.1:${port}`);
      clients.push(socket);
      const inbox = [],
        history = [];
      socket.on("message", (data) => {
        const msg = JSON.parse(data);
        inbox.push(msg);
        history.push(msg);
      });
      await once(socket, "open");
      const client = {
        socket,
        name,
        secret,
        history,
        send: (message) => socket.send(JSON.stringify(message)),
        wait: async (predicate, timeout = 3000) => {
          const deadline = Date.now() + timeout;
          while (Date.now() < deadline) {
            const i = inbox.findIndex(predicate);
            if (i >= 0) return inbox.splice(i, 1)[0];
            await new Promise((r) => setTimeout(r, 10));
          }
          throw Error(`Missing message for ${name}: ${predicate}`);
        },
      };
      client.state = async (revision, finished = false) =>
        (
          await client.wait(
            (m) =>
              m.type === "game.state" &&
              (finished ? m.payload.winnerId : m.payload.revision === revision),
            7000,
          )
        ).payload;
      client.error = () => client.wait((m) => m.type === "error");
      client.guess = (code, revision) =>
        client.send({ type: "game.guess", payload: { code, revision } });
      await client.wait((m) => m.type === "rooms.list");
      return client;
    }
    const a = await connect("Alice", "0482"),
      b = await connect("Bob", "5678"),
      observer = await connect("Carol", "");
    async function start() {
      a.send({ type: "room.create", payload: { playerName: a.name } });
      const joinedA = (await a.wait((m) => m.type === "room.joined")).payload;
      a.id = joinedA.playerId;
      b.send({
        type: "room.join",
        payload: { roomId: joinedA.roomId, playerName: b.name },
      });
      b.id = (await b.wait((m) => m.type === "room.joined")).payload.playerId;
      for (const c of [a, b]) {
        c.send({ type: "secret.submit", payload: { code: c.secret } });
        await c.wait((m) => m.type === "secret.accepted");
      }
      const sa = await a.state(0),
        sb = await b.state(0);
      assert.equal(sa.turnPlayerId, sb.turnPlayerId);
      return {
        roomId: joinedA.roomId,
        first: sa.turnPlayerId === a.id ? a : b,
        second: sa.turnPlayerId === a.id ? b : a,
      };
    }
    async function leave(client) {
      client.send({ type: "room.leave" });
      await client.wait((m) => m.type === "room.left");
    }
    const { roomId, first, second } = await start();
    a.send({ type: "room.leave" });
    await a.error();
    a.send({ type: "room.create", payload: { playerName: "Escaped" } });
    await a.error();
    second.guess(first.secret, 0);
    await second.error();
    await second.state(0);
    for (const code of ["1123", "123", "1abc"]) {
      first.guess(code, 0);
      await first.error();
    }
    first.guess("0123", 0);
    first.guess("0123", 0); // repeated request cannot spend a second turn
    await first.error();
    const sf1 = await first.state(1),
      ss1 = await second.state(1);
    assert.equal(sf1.attempts.length, 1);
    assert.equal(sf1.attempts[0].code, "0123");
    assert.equal(sf1.turnPlayerId, second.id);
    assert.equal(ss1.attempts.length, 0);
    assert.equal(ss1.opponentAttempts, 1);
    second.guess("9012", 1);
    await first.state(2);
    await second.state(2);
    first.guess("0123", 2);
    await first.error(); // duplicate does not consume turn
    first.guess(second.secret, 0);
    await first.error();
    await first.state(2); // stale revision
    first.guess(second.secret, 2);
    const won = await first.state(null, true),
      lost = await second.state(null, true);
    assert.equal(won.reason, "solved");
    assert.equal(won.winnerId, first.id);
    assert.equal(lost.winnerId, first.id);
    assert.equal(won.turnPlayerId, null);
    assert.equal(won.attempts.at(-1).bulls, 4);
    assert.equal(lost.attempts.length, 1);
    assert.ok(!JSON.stringify(lost).includes("0123"));
    assert.ok(!JSON.stringify(won).includes("9012"));
    first.guess("3456", won.revision);
    await first.error();
    second.send({ type: "game.surrender" });
    await second.error();
    await leave(first);
    observer.send({
      type: "room.join",
      payload: { roomId, playerName: "Carol" },
    });
    await observer.error();
    await leave(second);
    await start();
    a.send({ type: "game.surrender" });
    const surrendered = await a.state(null, true),
      winner = await b.state(null, true);
    assert.equal(surrendered.winnerId, b.id);
    assert.equal(winner.reason, "surrender");
    await leave(a);
    await leave(b);
    await start();
    a.socket.close();
    const disconnected = await b.state(null, true);
    assert.equal(disconnected.winnerId, b.id);
    assert.equal(disconnected.reason, "disconnect");
    assert.equal(disconnected.opponentName, "Alice");
    await leave(b);
    observer.send({ type: "rooms.list" });
    await observer.wait(
      (m) => m.type === "rooms.list" && m.payload.rooms.length === 0,
    );
    assert.equal(
      observer.history.filter((m) => m.type === "game.state").length,
      0,
      "observers cannot see private match state",
    );
  },
);
