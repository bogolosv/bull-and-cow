import { randomUUID } from "node:crypto";
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

export function createGameServer(port: number) {
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
  const countdown = createCountdown(state, publisher);
  const matches = createMatches(state, publisher);
  const rooms = createRooms(state, publisher, countdown, matches);
  const secrets = createSecrets(state, publisher, countdown);

  wss.on("connection", (socket) => {
    const session: PlayerSession = { playerId: randomUUID(), roomId: null };
    connections.set(session.playerId, socket);
    const reply = (message: ServerMessage) => send(socket, message);
    publisher.sendRooms(session.playerId);
    socket.on("message", (data) => {
      const message = parseMessage(data.toString(), reply);
      if (!message) return;
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
        case "game.surrender":
          matches.surrender(session);
          break;
      }
    });
    socket.on("close", () => {
      connections.delete(session.playerId);
      rooms.removePlayer(session);
    });
    socket.on("error", (error) =>
      console.error("WebSocket error:", error.message),
    );
    attachHeartbeat(socket);
  });
  wss.once("close", countdown.dispose);
  return wss;
}
