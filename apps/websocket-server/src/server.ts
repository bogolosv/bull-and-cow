import { createSessions } from "./sessions/sessions";
import { createRematch } from "./rooms/rematch";
import { WebSocket, WebSocketServer } from "ws";
import type { ServerMessage } from "@bull-and-cow/shared";
import { createState, type PlayerSession } from "./state/state";
import { createPublisher } from "./transport/publisher";
import { createCountdown } from "./rooms/countdown";
import { createMatches } from "./matches/matches";
import { createRooms } from "./rooms/rooms";
import { createSecrets } from "./rooms/secrets";
import { parseMessage } from "./transport/protocol";
import { attachHeartbeat } from "./transport/heartbeat";

export function createGameServer(
  port: number,
  timing: { turnMs?: number; reconnectMs?: number; countdownMs?: number } = {},
) {
  const wss = new WebSocketServer({ port });
  const connections = new Map<string, WebSocket>();
  const state = createState();
  const send = (socket: WebSocket, message: ServerMessage) => {
    if (socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify(message));
  };
  const publisher = createPublisher(state, {
    send: (playerId, message) => {
      const socket = connections.get(playerId);
      if (socket) send(socket, message);
    },
    broadcast: (message) =>
      wss.clients.forEach((socket) => send(socket, message)),
  });
  const matches = createMatches(state, publisher, timing.turnMs);
  const countdown = createCountdown(state, matches.start, timing.countdownMs);
  const rooms = createRooms(state, publisher, countdown, matches);
  const secrets = createSecrets(state, publisher, countdown);

  const rematch = createRematch(state, publisher);
  const sessions = createSessions(
    state,
    publisher,
    matches,
    countdown,
    rooms.removePlayer,
    timing.reconnectMs,
  );

  wss.on("connection", (socket) => {
    let session: PlayerSession | null = null;
    const reply = (message: ServerMessage) => send(socket, message);
    // Lobby snapshots are public; private state requires a session handshake.
    reply({
      type: "rooms.list",
      payload: { rooms: [...state.rooms.values()], serverTime: Date.now() },
    });
    socket.on("message", (data) => {
      const message = parseMessage(data.toString(), reply);
      if (!message) return;
      if (message.type === "session.resume") {
        if (session) {
          reply({ type: "error", payload: { code: "SESSION_REQUIRED" } });
          return;
        }
        session = sessions.claim(message.payload.token);
        const previous = connections.get(session.playerId);
        connections.set(session.playerId, socket);
        previous?.close(4000, "Session resumed elsewhere");
        reply({
          type: "session.ready",
          payload: {
            token: session.token,
            playerId: session.playerId,
            roomId: session.roomId,
          },
        });
        sessions.connected(session);
        return;
      }
      // Non-browser clients may begin a new session with their first command.
      if (!session) {
        session = sessions.claim(null);
        connections.set(session.playerId, socket);
        reply({
          type: "session.ready",
          payload: {
            token: session.token,
            playerId: session.playerId,
            roomId: null,
          },
        });
      }
      if (connections.get(session.playerId) !== socket) return;

      switch (message.type) {
        case "rooms.list":
          publisher.sendRooms(session.playerId);
          break;
        case "room.create":
        case "room.join":
          rooms.join(session, message);
          break;
        case "room.leave":
          rooms.leave(session);
          break;
        case "secret.submit":
          secrets.submit(session, message);
          break;
        case "game.guess":
          matches.guess(session, message);
          break;
        case "game.rematch":
          rematch(session, message.payload.matchId);
          break;
        case "game.surrender":
          matches.surrender(session, message.payload.matchId);
          break;
      }
    });
    socket.on("close", () => {
      if (!session || connections.get(session.playerId) !== socket) return;
      connections.delete(session.playerId);
      sessions.disconnected(session);
    });
    socket.on("error", (error) =>
      console.error("WebSocket error:", error.message),
    );
    attachHeartbeat(socket);
  });
  wss.once("close", () => {
    countdown.dispose();
    matches.dispose();
    sessions.dispose();
  });
  return wss;
}
