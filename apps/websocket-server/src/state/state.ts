import type { Room } from "@bull-and-cow/shared";
import type { Match } from "../matches/game";

export type PlayerSession = {
  playerId: string;
  roomId: string | null;
  token: string;
  reconnectUntil: number | null;
};

// One independent in-memory store per server instance. Secrets are never public.
export function createState() {
  return {
    rooms: new Map<string, Room>(),
    matches: new Map<string, Match>(),
    secrets: new Map<string, Map<string, string>>(),
    countdowns: new Map<string, ReturnType<typeof setTimeout>>(),
  };
}
export type ServerState = ReturnType<typeof createState>;
