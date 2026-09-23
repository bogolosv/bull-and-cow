import { DurableObject } from "cloudflare:workers";
import type { ServerMessage } from "@bull-and-cow/shared";
import { parseMessage } from "../../websocket-server/src/transport/protocol";
import { createEngine } from "./engine";
import { GameStorage } from "./storage";
import type { Env } from "./worker";

const LEASE_MS = 20_000;
const HANDSHAKE_MS = 10_000;
type Attachment = {
  token: string | null;
  activity: number;
  windowStart: number;
  messages: number;
};

export class GameLobby extends DurableObject<Env> {
  private store: GameStorage;
  private engine!: ReturnType<typeof createEngine>;
  private connections = new Map<string, WebSocket>();
  private outbox: Array<{ socket: WebSocket; message: string }> = [];
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.store = new GameStorage(ctx.storage);
    ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("bull-cow:ping", "bull-cow:pong"),
    );
    ctx.blockConcurrencyWhile(async () => {
      const saved = await this.store.load();
      const enqueue = (socket: WebSocket, message: ServerMessage) =>
        this.outbox.push({ socket, message: JSON.stringify(message) });
      this.engine = createEngine(
        {
          send: (playerId, message) => {
            const ws = this.connections.get(playerId);
            if (ws) enqueue(ws, message);
          },
          broadcast: (message) => {
            for (const ws of ctx.getWebSockets()) enqueue(ws, message);
          },
        },
        saved,
      );
      for (const ws of ctx.getWebSockets()) {
        const attachment = ws.deserializeAttachment() as Attachment;
        const session =
          attachment.token && this.engine.sessionState.get(attachment.token);
        if (session) this.connections.set(session.playerId, ws);
      }
      let recovered = false;
      for (const session of this.engine.sessionState.values()) {
        if (
          session.reconnectUntil === null &&
          !this.connections.has(session.playerId)
        ) {
          this.engine.sessions.disconnected(session);
          recovered = true;
        }
      }
      if (recovered) await this.persist();
    });
  }
  private send(socket: WebSocket, message: ServerMessage) {
    this.outbox.push({ socket, message: JSON.stringify(message) });
  }
  private detach(socket: WebSocket) {
    const attachment = socket.deserializeAttachment() as Attachment;
    const session =
      attachment.token && this.engine.sessionState.get(attachment.token);
    if (session && this.connections.get(session.playerId) === socket) {
      this.connections.delete(session.playerId);
      this.engine.sessions.disconnected(session);
    }
    socket.serializeAttachment({ ...attachment, token: null });
  }
  private expireSockets() {
    for (const ws of this.ctx.getWebSockets()) {
      const info = ws.deserializeAttachment() as Attachment;
      const last = Math.max(
        info.activity,
        this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0,
      );
      if (Date.now() >= last + (info.token ? LEASE_MS : HANDSHAKE_MS)) {
        this.detach(ws);
        ws.close(4001, "Connection expired");
      }
    }
  }
  private async persist() {
    const deadlines = this.ctx
      .getWebSockets()
      .filter((ws) => ws.readyState === 1)
      .map((ws) => {
        const info = ws.deserializeAttachment() as Attachment;
        return (
          Math.max(
            info.activity,
            this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0,
          ) + (info.token ? LEASE_MS : HANDSHAKE_MS)
        );
      });
    const gameDeadline = this.engine.deadlines.next();
    if (gameDeadline !== null) deadlines.push(gameDeadline);
    await this.store.save(
      this.engine.snapshot(),
      deadlines.length ? Math.min(...deadlines) : null,
    );
    // Storage is committed before clients can observe an accepted action.
    for (const { socket, message } of this.outbox.splice(0)) {
      try {
        if (socket.readyState === 1) socket.send(message);
      } catch {
        /* close callback handles recovery */
      }
    }
  }
  async fetch() {
    return this.ctx.blockConcurrencyWhile(async () => {
      this.expireSockets();
      this.engine.deadlines.drain();
      if (this.ctx.getWebSockets().length >= 64) {
        await this.persist();
        return new Response("Lobby full", { status: 503 });
      }
      const pair = new WebSocketPair();
      this.ctx.acceptWebSocket(pair[1]);
      pair[1].serializeAttachment({
        token: null,
        activity: Date.now(),
        windowStart: Date.now(),
        messages: 0,
      } satisfies Attachment);
      this.send(pair[1], {
        type: "rooms.list",
        payload: {
          rooms: [...this.engine.state.rooms.values()],
          serverTime: Date.now(),
        },
      });
      await this.persist();
      return new Response(null, { status: 101, webSocket: pair[0] });
    });
  }
  async webSocketMessage(socket: WebSocket, data: string | ArrayBuffer) {
    return this.ctx.blockConcurrencyWhile(async () => {
      this.engine.deadlines.drain();
      const info = socket.deserializeAttachment() as Attachment;
      if (
        typeof data !== "string" ||
        new TextEncoder().encode(data).length > 4096
      ) {
        this.detach(socket);
        socket.close(1009, "Message too large");
        await this.persist();
        return;
      }
      const now = Date.now();
      if (now - info.windowStart >= 10_000) {
        info.windowStart = now;
        info.messages = 0;
      }
      info.messages++;
      info.activity = now;
      socket.serializeAttachment(info);
      if (info.messages > 60) {
        this.detach(socket);
        socket.close(1008, "Too many messages");
        await this.persist();
        return;
      }
      const message = parseMessage(data, (reply) => this.send(socket, reply));
      if (message) {
        if (message.type === "session.resume" && !info.token) {
          const session = this.engine.sessions.claim(message.payload.token);
          const previous = this.connections.get(session.playerId);
          if (previous && previous !== socket) {
            const old = previous.deserializeAttachment() as Attachment;
            previous.serializeAttachment({ ...old, token: null });
            previous.close(4000, "Session resumed elsewhere");
          }
          info.token = session.token;
          socket.serializeAttachment(info);
          this.connections.set(session.playerId, socket);
          this.send(socket, {
            type: "session.ready",
            payload: {
              token: session.token,
              playerId: session.playerId,
              roomId: session.roomId,
            },
          });
          this.engine.sessions.connected(session);
        } else {
          const session =
            info.token && this.engine.sessionState.get(info.token);
          if (
            !session ||
            message.type === "session.resume" ||
            this.connections.get(session.playerId) !== socket
          )
            this.send(socket, {
              type: "error",
              payload: { code: "SESSION_REQUIRED" },
            });
          else this.engine.command(session, message);
        }
      }
      await this.persist();
    });
  }
  async webSocketClose(socket: WebSocket) {
    return this.ctx.blockConcurrencyWhile(async () => {
      this.engine.deadlines.drain();
      this.detach(socket);
      await this.persist();
    });
  }
  async webSocketError(socket: WebSocket) {
    await this.webSocketClose(socket);
  }
  async alarm() {
    return this.ctx.blockConcurrencyWhile(async () => {
      this.engine.deadlines.drain();
      this.expireSockets();
      await this.persist();
    });
  }
}
