import {
  createState,
  type PlayerSession,
} from "../../websocket-server/src/state/state";
import {
  createPublisher,
  type Transport,
} from "../../websocket-server/src/transport/publisher";
import { createMatches } from "../../websocket-server/src/matches/matches";
import { createCountdown } from "../../websocket-server/src/rooms/countdown";
import { createRooms } from "../../websocket-server/src/rooms/rooms";
import { createSecrets } from "../../websocket-server/src/rooms/secrets";
import { createSessions } from "../../websocket-server/src/sessions/sessions";
import { createRematch } from "../../websocket-server/src/rooms/rematch";
import type { Match } from "../../websocket-server/src/matches/game";
import type { Room, ClientMessage } from "@bull-and-cow/shared";
import { Deadlines } from "./deadlines";

export type Snapshot = {
  version: 1;
  rooms: [string, Room][];
  matches: [string, Match][];
  secrets: [string, [string, string][]][];
  sessions: [string, PlayerSession][];
};
export function createEngine(
  transport: Transport,
  saved?: Snapshot,
  timing: { turnMs?: number; countdownMs?: number; reconnectMs?: number } = {},
) {
  const state = createState();
  if (saved && saved.version !== 1)
    throw new Error("Unsupported persisted game version");
  state.rooms = new Map(saved?.rooms);
  state.matches = new Map(saved?.matches);
  state.secrets = new Map(
    saved?.secrets.map(([id, values]) => [id, new Map(values)]),
  );
  const sessionState = new Map(saved?.sessions);
  const deadlines = new Deadlines();
  const publisher = createPublisher(state, transport);
  const matches = createMatches(state, publisher, timing.turnMs, deadlines);
  const countdown = createCountdown(
    state,
    matches.start,
    timing.countdownMs,
    deadlines,
  );
  const rooms = createRooms(state, publisher, countdown, matches);
  const secrets = createSecrets(state, publisher, countdown);
  const sessions = createSessions(
    state,
    publisher,
    matches,
    countdown,
    rooms.removePlayer,
    timing.reconnectMs,
    deadlines,
    sessionState,
  );
  const rematch = createRematch(state, publisher);
  countdown.restore();
  matches.restore();
  sessions.restore();
  function command(
    session: PlayerSession,
    message: Exclude<ClientMessage, { type: "session.resume" }>,
  ) {
    switch (message.type) {
      case "rooms.list":
        publisher.sendRooms(session.playerId);
        break;
      case "room.create":
        if (state.rooms.size >= 16) {
          publisher.send(session.playerId, {
            type: "error",
            payload: { code: "ROOM_UNAVAILABLE" },
          });
          break;
        }
        rooms.join(session, message);
        break;
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
        matches.surrender(session, message.payload.matchId);
        break;
      case "game.rematch":
        rematch(session, message.payload.matchId);
        break;
    }
  }
  function snapshot(): Snapshot {
    return {
      version: 1,
      rooms: [...state.rooms],
      matches: [...state.matches],
      secrets: [...state.secrets].map(([id, values]) => [id, [...values]]),
      sessions: [...sessionState],
    };
  }
  return {
    state,
    sessionState,
    sessions,
    publisher,
    deadlines,
    command,
    snapshot,
  };
}
