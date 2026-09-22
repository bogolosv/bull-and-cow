import { randomInt, randomUUID } from "node:crypto";
import type { GameState, Room } from "@bull-and-cow/shared";

export function scoreGuess(secret: string, guess: string) {
  let bulls = 0;
  let cows = 0;
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === secret[i]) bulls++;
    else if (secret.includes(guess[i])) cows++;
  }
  return { bulls, cows };
}

export type Match = {
  id: string;
  turnEndsAt: number | null;
  turnRemainingMs: number;
  players: Room["players"];
  turnPlayerId: string | null;
  winnerId: string | null;
  reason: GameState["reason"];
  revision: number;
  attempts: (GameState["attempts"][number] & { playerId: string })[];
};

export function createMatch(players: Room["players"], turnMs = 30_000): Match {
  return {
    id: randomUUID(),
    turnEndsAt: null,
    turnRemainingMs: turnMs,
    players: players.map((player) => ({ ...player })),
    turnPlayerId: players[randomInt(players.length)].id,
    winnerId: null,
    reason: null,
    revision: 0,
    attempts: [],
  };
}

export function makeGuess(
  match: Match,
  playerId: string,
  code: string,
  secret: string,
) {
  const attempt = {
    id: randomUUID(),
    playerId,
    code,
    ...scoreGuess(secret, code),
  };
  match.attempts.push(attempt);
  match.revision++;
  if (attempt.bulls === 4) finishMatch(match, playerId, "solved");
  else
    match.turnPlayerId =
      match.players.find((player) => player.id !== playerId)?.id ?? null;
}

export function finishMatch(
  match: Match,
  winnerId: string,
  reason: NonNullable<GameState["reason"]>,
) {
  match.turnEndsAt = null;
  match.turnRemainingMs = 0;
  match.winnerId = winnerId;
  match.reason = reason;
  match.turnPlayerId = null;
  match.revision++;
}

export function matchView(
  match: Match,
  playerId: string,
  roomId: string,
): GameState {
  return {
    roomId,
    matchId: match.id,
    turnEndsAt: match.turnEndsAt,
    turnRemainingMs: match.turnRemainingMs,
    serverTime: Date.now(),
    revision: match.revision,
    turnPlayerId: match.turnPlayerId,
    winnerId: match.winnerId,
    reason: match.reason,
    opponentName:
      match.players.find((player) => player.id !== playerId)?.name ?? "",
    attempts: match.attempts
      .filter((attempt) => attempt.playerId === playerId)
      .map(({ id, code, bulls, cows }) => ({ id, code, bulls, cows })),
    opponentAttempts: match.attempts.filter(
      (attempt) => attempt.playerId !== playerId,
    ).length,
  };
}
