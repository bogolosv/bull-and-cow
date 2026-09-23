# Game services and Node.js WebSocket server

This directory contains the game services used by both server runtimes and a local Node.js / `ws` adapter. The Node.js adapter keeps state in memory; restarting it clears rooms and sessions. The [Cloudflare adapter](../cloudflare-server/README.md) adds durable storage and alarm scheduling.

## Run locally

From the repository root, after installing dependencies:

```sh
pnpm dev:server
```

The default endpoint is `ws://localhost:3001`; `PORT` overrides it. Set the frontend's `NEXT_PUBLIC_WS_URL` to this endpoint and run `pnpm dev:web` in another terminal. See the [root setup guide](../../README.md#run-locally).

## Module boundaries

| Module | Responsibility |
| --- | --- |
| [main.ts](src/main.ts) | Read the port and start the server. |
| [server.ts](src/server.ts) | Create per-server state, compose services, route messages and handle connections. |
| `transport/protocol.ts` | Parse JSON and validate messages with shared Zod schemas. |
| `transport/heartbeat.ts` | Detect lost connections through ping/pong. |
| `transport/publisher.ts` | Publish public room snapshots and private match views through injected `send` / `broadcast` functions. |
| `state/state.ts` | Define rooms, matches, secrets and timer state. |
| `rooms/rooms.ts` | Create, join and leave rooms; remove players and clean up empty rooms. |
| `rooms/secrets.ts` | Accept secret codes and track readiness. |
| `rooms/countdown.ts` | Start or cancel the countdown and transition into a match. |
| `rooms/rematch.ts` | Require both players to accept a new round while preserving the series score. |
| `matches/game.ts` | Score guesses, update match state and construct player-specific views. |
| `matches/matches.ts` | Enforce turns and deadlines, pause/resume timers, and resolve surrender or match completion. |
| `sessions/sessions.ts` | Issue session tokens, restore private state and enforce the reconnect window. |
| `time/timers.ts` | Define the scheduler interface and default system timers. |

Services receive dependencies through factory functions. They do not create WebSocket connections or rely on global mutable state. `server.ts` is the Node.js composition point.

## State and timing guarantees

Secrets are separate from public rooms. Match history is filtered per player through `matchView`; updates should go through the publisher to preserve that boundary. Session tokens are sent only to their owner and never included in room snapshots.

`createGameServer(port, timing?)` accepts test overrides for `turnMs`, `reconnectMs` and `countdownMs`. Defaults are **30, 30 and 5 seconds** respectively. The server owns the deadline; clients display the remaining time. A separate `matchId` for each round rejects delayed commands from previous rounds.

Disconnect detection starts a recovery window rather than immediately removing the player. An active turn pauses during recovery. If the window expires, the opponent wins; reconnecting restores the player's private state. Explicit leaving during play is rejected, while surrender ends the match.

The timer interface lets Cloudflare replace system timers with alarms. Service `restore()` methods reconstruct callbacks from saved absolute deadlines without granting additional time. Sessions can also receive restored state.

## Checks

Run from the repository root:

```sh
pnpm test:lobby
pnpm test:game
pnpm test:lifecycle
pnpm exec tsc -p apps/websocket-server/tsconfig.app.json --noEmit
pnpm exec nx lint websocket-server
```

Integration tests bundle the server and start it on an available local port, exercising the complete path from WebSocket messages to responses. See [architecture and trade-offs](../../docs/architecture.md) for the production storage model.
