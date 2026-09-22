const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildSync } = require('esbuild');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { runInNewContext } = require('node:vm');
const { WebSocket } = require('ws');

const nameCode = buildSync({ entryPoints: ['apps/web/src/lib/player-name.ts'], bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text;
function loadNames(storage) {
  const module = { exports: {} };
  runInNewContext(nameCode, { module, exports: module.exports, localStorage: storage });
  return module.exports;
}

test('player name survives repeated reads, module reloads and manual edits', () => {
  const values = new Map();
  let writes = 0;
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { writes++; values.set(key, value); } };
  const first = loadNames(storage);
  const name = first.getPlayerName();
  assert.ok(name.length > 0 && name.length <= 32);
  assert.equal(first.getPlayerName(), name);
  assert.equal(loadNames(storage).getPlayerName(), name);
  assert.equal(writes, 1, 'initial name is persisted only once');
  first.savePlayerName('Олена');
  assert.equal(loadNames(storage).getPlayerName(), 'Олена');
  first.savePlayerName('');
  assert.equal(loadNames(storage).getPlayerName(), '', 'clearing the input must not regenerate a name');
});

test('name remains stable in memory when browser storage is blocked', () => {
  const names = loadNames({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  assert.equal(names.getPlayerName(), names.getPlayerName());
  names.savePlayerName('Іван');
  assert.equal(names.getPlayerName(), 'Іван');
});

test('rooms broadcast, enforce capacity, validate names and clean up on disconnect', { timeout: 15000 }, async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'bull-cow-test-'));
  const output = join(directory, 'server.cjs');
  buildSync({ entryPoints: ['apps/websocket-server/src/main.ts'], outfile: output, tsconfig: 'tsconfig.base.json', bundle: true, platform: 'node', format: 'cjs' });
  const server = spawn(process.execPath, [output], { env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let serverError = '';
  server.stderr.on('data', (data) => { serverError += data.toString(); });
  const clients = [];
  t.after(async () => {
    clients.forEach((client) => client.terminate());
    if (server.exitCode === null) { server.kill(); await once(server, 'exit'); }
    rmSync(directory, { recursive: true, force: true });
  });
  const [started] = await Promise.race([
    once(server.stdout, 'data'),
    once(server, 'exit').then(([code]) => { throw Error(`Server exited: ${code}: ${serverError}`); }),
  ]);
  const port = started.toString().match(/:(\d+)/)[1];
  async function connect() {
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    clients.push(socket);
    const inbox = [];
    const history = [];
    socket.on('message', data => history.push(JSON.parse(data)));
    socket.on('message', (data) => inbox.push(JSON.parse(data)));
    await once(socket, 'open');
    const client = {
      socket,
      history,
      send: (message) => socket.send(JSON.stringify(message)),
      wait: async (predicate, timeout = 3000) => {
        const deadline = Date.now() + timeout;
        while (Date.now() < deadline) {
          const index = inbox.findIndex(predicate);
          if (index >= 0) return inbox.splice(index, 1)[0];
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        throw Error('Expected WebSocket message did not arrive');
      },
    };
    await client.wait((message) => message.type === 'rooms.list');
    return client;
  }
  const a = await connect(); const b = await connect(); const c = await connect();
  a.send({ type: 'room.create', payload: { playerName: '   ' } });
  await a.wait((message) => message.type === 'error');
  a.send({ type: 'room.create', payload: { playerName: ' Alice ' } });
  const joined = await a.wait((message) => message.type === 'room.joined');
  const roomId = joined.payload.roomId;
  const list = await b.wait((message) => message.type === 'rooms.list' && message.payload.rooms.length === 1);
  assert.equal(list.payload.rooms[0].players[0].name, 'Alice');
  assert.equal(list.payload.rooms[0].phase, 'waiting');
  assert.equal(list.payload.rooms[0].startsAt, null);
  assert.ok(list.payload.serverTime > 0);
  assert.equal(joined.payload.playerId, list.payload.rooms[0].players[0].id);
  a.send({ type: 'room.create', payload: { playerName: 'Alice' } });
  await a.wait((message) => message.type === 'error');
  b.send({ type: 'room.join', payload: { roomId, playerName: 'Bob' } });
  await b.wait((message) => message.type === 'room.joined');
  const choosing = await a.wait(message => message.type === 'rooms.list' && message.payload.rooms[0]?.phase === 'choosing');
  assert.equal(choosing.payload.rooms[0].startsAt, null);
  c.send({ type: 'secret.submit', payload: { code: '6789' } });
  await c.wait(message => message.type === 'error');
  for (const code of ['1123', '123', '12345', '12ab', 1234]) {
    a.send({ type: 'secret.submit', payload: { code } });
    await a.wait(message => message.type === 'error');
  }
  a.send({ type: 'secret.submit', payload: { code: '0482' } });
  const accepted = await a.wait(message => message.type === 'secret.accepted');
  assert.equal(accepted.payload.code, '0482');
  const halfReady = await b.wait(message => message.type === 'rooms.list' && message.payload.rooms[0]?.players[0]?.ready);
  assert.equal(halfReady.payload.rooms[0].phase, 'choosing');
  assert.equal(halfReady.payload.rooms[0].startsAt, null);
  a.send({ type: 'secret.submit', payload: { code: '1234' } });
  await a.wait(message => message.type === 'error');
  b.send({ type: 'secret.submit', payload: { code: '5678' } });
  await b.wait(message => message.type === 'secret.accepted');
  const countdown = await a.wait((message) => message.type === 'rooms.list' && message.payload.rooms[0]?.phase === 'countdown');
  const startAt = countdown.payload.rooms[0].startsAt;
  assert.ok(startAt > countdown.payload.serverTime);
  const otherCountdown = await b.wait((message) => message.type === 'rooms.list' && message.payload.rooms[0]?.phase === 'countdown');
  assert.equal(otherCountdown.payload.rooms[0].startsAt, startAt);
  c.send({ type: 'room.join', payload: { roomId, playerName: 'Carol' } });
  await c.wait((message) => message.type === 'error');
  b.send({ type: 'room.leave' });
  await b.wait((message) => message.type === 'room.left');
  const waiting = await a.wait((message) => message.type === 'rooms.list' && message.payload.rooms[0]?.phase === 'waiting' && message.payload.rooms[0]?.startsAt === null && message.payload.serverTime > countdown.payload.serverTime);
  assert.equal(waiting.payload.rooms[0].players.length, 1);
  assert.equal(waiting.payload.rooms[0].players[0].ready, false);
  b.send({ type: 'room.join', payload: { roomId, playerName: 'Bob' } });
  await b.wait((message) => message.type === 'room.joined');
  a.send({ type: 'secret.submit', payload: { code: '0482' } });
  await a.wait(message => message.type === 'secret.accepted');
  b.send({ type: 'secret.submit', payload: { code: '5678' } });
  await b.wait(message => message.type === 'secret.accepted');
  const restarted = await a.wait((message) => message.type === 'rooms.list' && message.payload.rooms[0]?.phase === 'countdown');
  assert.ok(restarted.payload.rooms[0].startsAt > startAt);
  await a.wait((message) => message.type === 'rooms.list' && message.payload.rooms[0]?.phase === 'playing', 7000);
  a.send({ type: 'secret.submit', payload: { code: '9876' } });
  await a.wait(message => message.type === 'error');
  assert.ok(!JSON.stringify(b.history).includes('"0482"'), 'opponent must never receive our code');
  assert.ok(!JSON.stringify(a.history).includes('"5678"'), 'we must never receive opponent code');
  assert.ok(!JSON.stringify(c.history).includes('"0482"') && !JSON.stringify(c.history).includes('"5678"'), 'lobby observers must not receive codes');
  for (const message of c.history.filter(message => message.type === 'rooms.list')) {
    for (const room of message.payload.rooms) for (const player of room.players) assert.deepEqual(Object.keys(player).sort(), ['id', 'name', 'ready']);
  }
  a.send({ type: 'room.leave' });
  await a.wait(message => message.type === 'error');
  a.send({ type: 'game.surrender' });
  const finished = await a.wait(message => message.type === 'game.state' && message.payload.reason === 'surrender');
  assert.notEqual(finished.payload.winnerId, joined.payload.playerId);
  a.send({ type: 'room.leave' });
  await a.wait((message) => message.type === 'room.left');
  await c.wait((message) => message.type === 'rooms.list' && message.payload.rooms[0]?.players[0]?.name === 'Bob');
  b.socket.close();
  // Explicit snapshot avoids matching the initial empty lobby broadcast.
  await once(b.socket, 'close');
  c.send({ type: 'rooms.list' });
  await c.wait((message) => message.type === 'rooms.list' && message.payload.rooms.length === 0);
  c.send({ type: 'room.join', payload: { roomId, playerName: 'Carol' } });
  await c.wait((message) => message.type === 'error');
});
