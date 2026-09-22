import { z } from "zod";

export const errorCodeSchema = z.enum([
  "SESSION_REQUIRED",
  "MATCH_CHANGED",
  "GAME_PAUSED",
  "REMATCH_UNAVAILABLE",
  "ALREADY_IN_ROOM",
  "ROOM_UNAVAILABLE",
  "GAME_IN_PROGRESS",
  "GAME_NOT_ACTIVE",
  "NOT_YOUR_TURN",
  "DUPLICATE_GUESS",
  "CANNOT_SURRENDER",
  "INVALID_JSON",
  "INVALID_CODE",
  "INVALID_MESSAGE",
  "INVALID_NAME",
  "NOT_IN_ROOM",
  "SECRET_ALREADY_SET",
  "WAIT_FOR_OPPONENT",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

export const playerNameSchema = z.string().trim().min(1).max(32);
export const secretCodeSchema = z
  .string()
  .regex(/^[0-9]{4}$/)
  .refine((code) => new Set(code).size === 4);
export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  phase: z.enum(["waiting", "choosing", "countdown", "playing", "finished"]),
  startsAt: z.number().nullable(),
  score: z.record(z.string(), z.number().int().nonnegative()),
  rematchPlayerIds: z.array(z.string()),
  players: z
    .array(
      z.object({
        id: z.string(),
        name: playerNameSchema,
        ready: z.boolean(),
        connected: z.boolean(),
        reconnectUntil: z.number().nullable(),
      }),
    )
    .max(2),
});

export const gameStateSchema = z.object({
  roomId: z.string(),
  matchId: z.string(),
  turnEndsAt: z.number().nullable(),
  turnRemainingMs: z.number().nonnegative(),
  serverTime: z.number(),
  revision: z.number().int().nonnegative(),
  turnPlayerId: z.string().nullable(),
  winnerId: z.string().nullable(),
  reason: z.enum(["solved", "surrender", "disconnect", "timeout"]).nullable(),
  opponentName: z.string(),
  opponentAttempts: z.number().int().nonnegative(),
  attempts: z.array(
    z.object({
      id: z.string(),
      code: secretCodeSchema,
      bulls: z.number().int().min(0).max(4),
      cows: z.number().int().min(0).max(4),
    }),
  ),
});
export type GameState = z.infer<typeof gameStateSchema>;

export const clientMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("session.resume"),
    payload: z.object({ token: z.string().uuid().nullable() }),
  }),
  z.object({
    type: z.literal("game.rematch"),
    payload: z.object({ matchId: z.string() }),
  }),
  z.object({ type: z.literal("rooms.list") }),
  z.object({
    type: z.literal("room.create"),
    payload: z.object({ playerName: playerNameSchema }),
  }),
  z.object({
    type: z.literal("room.join"),
    payload: z.object({ roomId: z.string(), playerName: playerNameSchema }),
  }),
  z.object({ type: z.literal("room.leave") }),
  z.object({
    type: z.literal("game.guess"),
    payload: z.object({
      code: secretCodeSchema,
      matchId: z.string(),
      revision: z.number().int().nonnegative(),
    }),
  }),
  z.object({
    type: z.literal("game.surrender"),
    payload: z.object({ matchId: z.string() }),
  }),
  z.object({
    type: z.literal("secret.submit"),
    payload: z.object({ code: secretCodeSchema }),
  }),
]);

export const serverMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("session.ready"),
    payload: z.object({
      token: z.string(),
      playerId: z.string(),
      roomId: z.string().nullable(),
    }),
  }),
  z.object({ type: z.literal("rematch.accepted") }),
  z.object({ type: z.literal("game.state"), payload: gameStateSchema }),
  z.object({
    type: z.literal("rooms.list"),
    payload: z.object({ rooms: z.array(roomSchema), serverTime: z.number() }),
  }),
  z.object({
    type: z.literal("room.joined"),
    payload: z.object({ roomId: z.string(), playerId: z.string() }),
  }),
  z.object({ type: z.literal("room.left") }),
  z.object({
    type: z.literal("secret.accepted"),
    payload: z.object({ roomId: z.string(), code: secretCodeSchema }),
  }),
  z.object({
    type: z.literal("error"),
    payload: z.object({ code: errorCodeSchema }),
  }),
]);

export type Room = z.infer<typeof roomSchema>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type ServerMessage = z.infer<typeof serverMessageSchema>;
