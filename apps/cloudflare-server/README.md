# Cloudflare game server

Production WebSocket adapter for the shared game services. The Worker accepts upgrades at `/`, checks the exact request origin and forwards connections to the SQLite-backed `GameLobby` Durable Object. `GET /health` returns the service status.

## Run locally

Run commands from the repository root after installing dependencies:

```sh
pnpm dev:cloudflare
```

Set `NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8787` in `apps/web/.env.local`, then run `pnpm dev:web` in another terminal. Restart Next.js after changing the variable. The development configuration allows the local origins listed in [wrangler.jsonc](wrangler.jsonc). Wrangler stores local state in `.wrangler/`, which is excluded from Git and separate from production.

## Modules

| Module | Responsibility |
| --- | --- |
| [worker.ts](src/worker.ts) | HTTP routing, origin checks and the Durable Object binding. |
| [lobby.ts](src/lobby.ts) | Hibernating WebSockets, socket attachments, sessions, queued responses and alarms. |
| [engine.ts](src/engine.ts) | Composition of shared game services and restoration of saved state. |
| [deadlines.ts](src/deadlines.ts) | A scheduler that reconstructs callbacks from absolute deadlines without using `setTimeout`. |
| [storage.ts](src/storage.ts) | Atomic persistence of changed records and the next alarm; removal of empty rooms. |

The game services live in [the shared server implementation](../websocket-server/README.md). They receive a scheduler dependency: system timers in Node.js and Durable Object alarms here. Expired deadlines are processed before incoming commands. State is persisted before queued acknowledgements are sent to players.

Socket attachments restore connection identity after hibernation. If sockets are lost, the usual 30-second reconnect window applies. Deployments can interrupt connections; persistence does not extend the recovery window or reset a turn deadline.

## Capacity and connection handling

One named object, `public-v1`, coordinates a maximum of **16 rooms and 64 connections**, including lobby observers. Scaling beyond this design requires a room directory and connection routing across objects. Renaming the object creates a separate lobby rather than distributing existing rooms.

- Clients send a heartbeat every 5 seconds. `setWebSocketAutoResponse` replies without waking a hibernating object.
- Alarms also check a 20-second connection activity lease.
- A connection has 10 seconds to complete its session handshake.
- Messages must be text, at most 4096 bytes, with at most 60 game messages per 10 seconds per connection.

These are basic resource limits, not comprehensive abuse prevention. Active games, alarms and storage operations consume Cloudflare quotas. The migration uses `new_sqlite_classes`; this configuration does not promise unlimited free hosting.

## Checks and deployment

```sh
pnpm typecheck:cloudflare
pnpm test:cloudflare
pnpm build:cloudflare
```

The build is a **dry run** and does not publish anything. Runtime tests start local workerd, force hibernation with open sockets, and verify deadlines, recovery, rematches and private state. They require local port access.

[DEPLOYMENT.md](../../DEPLOYMENT.md) documents production origins, credentials and the GitHub Actions deployment workflow. See the [architecture overview](../../docs/architecture.md) for the end-to-end data flow.
