import type { ServerState, PlayerSession } from "../state/state";
import type { Publisher } from "../transport/publisher";
import { randomUUID } from "node:crypto";
import type { ClientMessage, Room } from "@bull-and-cow/shared";
import type { Countdown } from "./countdown";
import type { Matches } from "../matches/matches";

export function createRooms(
  state: ServerState,
  publisher: Publisher,
  countdown: Countdown,
  matchService: Matches,
) {
  const { rooms, secrets, matches } = state;
  const { send, publishRooms } = publisher;
  const { endMatch } = matchService;
  const updateCountdown = countdown.update;
  function removePlayer(session: PlayerSession) {
    const { playerId } = session;

    const room = session.roomId ? rooms.get(session.roomId) : undefined;
    if (room) {
      if (room.phase === "playing") endMatch(room, playerId, "disconnect");
      room.rematchPlayerIds = [];
      room.players = room.players.filter((player) => player.id !== playerId);
      if (room.phase !== "finished") {
        secrets.delete(room.id);
        room.players.forEach((player) => {
          player.ready = false;
        });
        updateCountdown(room);
      }
      if (!room.players.length) {
        rooms.delete(room.id);
        secrets.delete(room.id);
        matches.delete(room.id);
      }
    }
    session.roomId = null;
    publishRooms();
  }
  function join(
    session: PlayerSession,
    message: Extract<ClientMessage, { type: "room.create" | "room.join" }>,
  ) {
    const { playerId } = session;

    if (session.roomId) {
      send(playerId, {
        type: "error",
        payload: { code: "ALREADY_IN_ROOM" },
      });
      return;
    }
    const room: Room | undefined =
      message.type === "room.create"
        ? {
            id: randomUUID(),
            name: message.payload.playerName,
            players: [],
            phase: "waiting",
            startsAt: null,
            score: {},
            rematchPlayerIds: [],
          }
        : rooms.get(message.payload.roomId);
    if (
      !room ||
      room.players.length >= 2 ||
      room.phase === "playing" ||
      room.phase === "finished"
    ) {
      send(playerId, {
        type: "error",
        payload: {
          code: "ROOM_UNAVAILABLE",
        },
      });
      return;
    }
    room.players.push({
      id: playerId,
      name: message.payload.playerName,
      ready: false,
      connected: true,
      reconnectUntil: null,
    });
    room.score[playerId] = 0;
    rooms.set(room.id, room);
    updateCountdown(room);
    session.roomId = room.id;
    send(playerId, {
      type: "room.joined",
      payload: { roomId: room.id, playerId },
    });
    publishRooms();
  }
  function leave(session: PlayerSession) {
    const { playerId } = session;

    if (session.roomId && rooms.get(session.roomId)?.phase === "playing") {
      send(playerId, {
        type: "error",
        payload: {
          code: "GAME_IN_PROGRESS",
        },
      });
      return;
    }
    removePlayer(session);
    send(playerId, { type: "room.left" });
  }
  return { join, leave, removePlayer };
}
