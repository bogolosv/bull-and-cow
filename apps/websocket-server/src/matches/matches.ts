import type { ServerState, PlayerSession } from "../state/state";
import type { Publisher } from "../transport/publisher";
import type { ClientMessage, Room, GameState } from "@bull-and-cow/shared";
import { createMatch, finishMatch, makeGuess, matchView } from "./game";

export function createMatches(
  state: ServerState,
  publisher: Publisher,
  turnMs = 30_000,
) {
  const { rooms, matches, secrets } = state;
  const { send, publishRooms, publishMatch } = publisher;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  function clear(roomId: string) {
    const timer = timers.get(roomId);
    if (timer) clearTimeout(timer);
    timers.delete(roomId);
  }
  function complete(room: Room) {
    const match = matches.get(room.id);
    if (!match?.winnerId || room.phase !== "playing") return;
    clear(room.id);
    room.phase = "finished";
    room.score[match.winnerId] = (room.score[match.winnerId] || 0) + 1;
    secrets.delete(room.id);
    publishRooms();
    publishMatch(room.id);
  }
  function endMatch(
    room: Room,
    playerId: string,
    reason: NonNullable<GameState["reason"]>,
  ) {
    const match = matches.get(room.id),
      opponent = match?.players.find((p) => p.id !== playerId);
    if (room.phase !== "playing" || !match || !opponent) return;
    finishMatch(match, opponent.id, reason);
    complete(room);
  }
  function expireDue(room: Room) {
    const match = matches.get(room.id);
    if (
      room.phase === "playing" &&
      match?.turnEndsAt !== null &&
      match?.turnEndsAt !== undefined &&
      Date.now() >= match.turnEndsAt &&
      match.turnPlayerId
    ) {
      endMatch(room, match.turnPlayerId, "timeout");
      return true;
    }
    return false;
  }
  function arm(room: Room) {
    clear(room.id);
    const match = matches.get(room.id);
    if (
      !match ||
      room.phase !== "playing" ||
      !room.players.every((p) => p.connected)
    )
      return;
    match.turnEndsAt = Date.now() + match.turnRemainingMs;
    const deadline = match.turnEndsAt;
    timers.set(
      room.id,
      setTimeout(() => {
        if (matches.get(room.id) !== match || match.turnEndsAt !== deadline)
          return;
        if (!expireDue(room)) {
          match.turnRemainingMs = Math.max(0, deadline - Date.now());
          arm(room);
        }
      }, match.turnRemainingMs),
    );
  }
  function start(room: Room) {
    room.phase = "playing";
    room.startsAt = null;
    matches.set(room.id, createMatch(room.players, turnMs));
    arm(room);
    publishRooms();
    publishMatch(room.id);
  }
  function pause(room: Room) {
    if (expireDue(room)) return;
    const match = matches.get(room.id);
    if (room.phase !== "playing" || !match || match.turnEndsAt === null) return;
    match.turnRemainingMs = Math.max(0, match.turnEndsAt - Date.now());
    match.turnEndsAt = null;
    match.revision++;
    clear(room.id);
  }
  function resume(room: Room) {
    const match = matches.get(room.id);
    if (
      room.phase === "playing" &&
      match &&
      match.turnEndsAt === null &&
      room.players.every((p) => p.connected)
    ) {
      match.revision++;
      arm(room);
    }
  }
  function guess(
    session: PlayerSession,
    message: Extract<ClientMessage, { type: "game.guess" }>,
  ) {
    const { playerId } = session,
      room = session.roomId ? rooms.get(session.roomId) : undefined,
      match = room ? matches.get(room.id) : undefined;
    if (!room || room.phase !== "playing" || !match) {
      send(playerId, { type: "error", payload: { code: "GAME_NOT_ACTIVE" } });
      return;
    }
    if (message.payload.matchId !== match.id) {
      send(playerId, { type: "error", payload: { code: "MATCH_CHANGED" } });
      return;
    }
    if (expireDue(room)) return;
    if (!room.players.every((p) => p.connected)) {
      send(playerId, { type: "error", payload: { code: "GAME_PAUSED" } });
      return;
    }
    if (
      match.turnPlayerId !== playerId ||
      message.payload.revision !== match.revision
    ) {
      send(playerId, { type: "error", payload: { code: "NOT_YOUR_TURN" } });
      send(playerId, {
        type: "game.state",
        payload: matchView(match, playerId, room.id),
      });
      return;
    }
    if (
      match.attempts.some(
        (a) => a.playerId === playerId && a.code === message.payload.code,
      )
    ) {
      send(playerId, { type: "error", payload: { code: "DUPLICATE_GUESS" } });
      return;
    }
    const opponent = room.players.find((p) => p.id !== playerId),
      secret = opponent && secrets.get(room.id)?.get(opponent.id);
    if (!secret) return;
    makeGuess(match, playerId, message.payload.code, secret);
    if (match.winnerId) complete(room);
    else {
      match.turnRemainingMs = turnMs;
      arm(room);
      publishMatch(room.id);
    }
  }
  function surrender(session: PlayerSession, matchId: string) {
    const room = session.roomId ? rooms.get(session.roomId) : undefined;
    if (!room || room.phase !== "playing") {
      send(session.playerId, {
        type: "error",
        payload: { code: "CANNOT_SURRENDER" },
      });
      return;
    }
    if (matches.get(room.id)?.id !== matchId) {
      send(session.playerId, {
        type: "error",
        payload: { code: "MATCH_CHANGED" },
      });
      return;
    }
    if (!expireDue(room)) endMatch(room, session.playerId, "surrender");
  }
  function dispose() {
    for (const id of timers.keys()) clear(id);
  }
  return {
    start,
    endMatch,
    guess,
    surrender,
    pause,
    resume,
    expireDue,
    dispose,
  };
}
export type Matches = ReturnType<typeof createMatches>;
