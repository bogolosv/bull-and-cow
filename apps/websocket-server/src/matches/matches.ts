import type { ServerState, PlayerSession } from "../state/state";
import type { Publisher } from "../transport/publisher";
import type { ClientMessage, Room } from "@bull-and-cow/shared";
import { finishMatch, makeGuess, matchView } from "./game";

export function createMatches(state: ServerState, publisher: Publisher) {
  const { rooms, matches, secrets } = state;
  const { send, publishRooms, publishMatch } = publisher;
  function endMatch(
    room: Room,
    playerId: string,
    reason: "surrender" | "disconnect",
  ) {
    const match = matches.get(room.id);
    const opponent = match?.players.find((player) => player.id !== playerId);
    if (room.phase !== "playing" || !match || !opponent) return;
    finishMatch(match, opponent.id, reason);
    room.phase = "finished";
    secrets.delete(room.id);
    publishRooms();
    publishMatch(room.id);
  }

  function guess(
    session: PlayerSession,
    message: Extract<ClientMessage, { type: "game.guess" }>,
  ) {
    const { playerId } = session;

    const room = session.roomId ? rooms.get(session.roomId) : undefined;
    const match = room ? matches.get(room.id) : undefined;
    if (!room || room.phase !== "playing" || !match) {
      send(playerId, {
        type: "error",
        payload: { code: "GAME_NOT_ACTIVE" },
      });
      return;
    }
    if (
      match.turnPlayerId !== playerId ||
      message.payload.revision !== match.revision
    ) {
      send(playerId, {
        type: "error",
        payload: { code: "NOT_YOUR_TURN" },
      });
      send(playerId, {
        type: "game.state",
        payload: matchView(match, playerId, room.id),
      });
      return;
    }
    if (
      match.attempts.some(
        (attempt) =>
          attempt.playerId === playerId &&
          attempt.code === message.payload.code,
      )
    ) {
      send(playerId, {
        type: "error",
        payload: { code: "DUPLICATE_GUESS" },
      });
      return;
    }
    const opponent = room.players.find((player) => player.id !== playerId);
    const secret = opponent && secrets.get(room.id)?.get(opponent.id);
    if (!secret) return;
    makeGuess(match, playerId, message.payload.code, secret);
    if (match.winnerId) {
      room.phase = "finished";
      secrets.delete(room.id);
      publishRooms();
    }
    publishMatch(room.id);
  }
  function surrender(session: PlayerSession) {
    const { playerId } = session;

    const room = session.roomId ? rooms.get(session.roomId) : undefined;
    if (!room || room.phase !== "playing") {
      send(playerId, {
        type: "error",
        payload: { code: "CANNOT_SURRENDER" },
      });
      return;
    }
    endMatch(room, playerId, "surrender");
  }
  return { endMatch, guess, surrender };
}
export type Matches = ReturnType<typeof createMatches>;
