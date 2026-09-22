import { randomUUID } from "node:crypto";
import type { ServerState, PlayerSession } from "../state/state";
import type { Publisher } from "../transport/publisher";
import type { Matches } from "../matches/matches";
import type { Countdown } from "../rooms/countdown";

export function createSessions(
  state: ServerState,
  publisher: Publisher,
  matches: Matches,
  countdown: Countdown,
  removePlayer: (session: PlayerSession) => void,
  reconnectMs = 30_000,
) {
  let disposed = false;
  const sessions = new Map<string, PlayerSession>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  function clear(token: string) {
    const timer = timers.get(token);
    if (timer) clearTimeout(timer);
    timers.delete(token);
  }
  function expire(session: PlayerSession) {
    clear(session.token);
    removePlayer(session);
    sessions.delete(session.token);
  }
  function claim(token: string | null) {
    let session = token ? sessions.get(token) : undefined;
    if (session?.reconnectUntil && Date.now() >= session.reconnectUntil) {
      expire(session);
      session = undefined;
    }
    if (!session) {
      session = {
        token: randomUUID(),
        playerId: randomUUID(),
        roomId: null,
        reconnectUntil: null,
      };
      sessions.set(session.token, session);
    }
    clear(session.token);
    session.reconnectUntil = null;
    return session;
  }
  function connected(session: PlayerSession) {
    const room = session.roomId ? state.rooms.get(session.roomId) : undefined;
    const player = room?.players.find((p) => p.id === session.playerId);
    if (room && player) {
      player.connected = true;
      player.reconnectUntil = null;
      matches.resume(room);
      countdown.update(room);
      const secret = state.secrets.get(room.id)?.get(session.playerId);
      if (secret)
        publisher.send(session.playerId, {
          type: "secret.accepted",
          payload: { roomId: room.id, code: secret },
        });
      publisher.publishRooms();
      publisher.publishMatch(room.id);
    } else publisher.sendRooms(session.playerId);
  }
  function disconnected(session: PlayerSession) {
    if (disposed) return;
    const room = session.roomId ? state.rooms.get(session.roomId) : undefined;
    const player = room?.players.find((p) => p.id === session.playerId);
    if (!room || !player) {
      expire(session);
      return;
    }
    matches.pause(room);
    session.reconnectUntil = Date.now() + reconnectMs;
    player.connected = false;
    player.reconnectUntil = session.reconnectUntil;
    countdown.update(room);
    publisher.publishRooms();
    publisher.publishMatch(room.id);
    clear(session.token);
    timers.set(
      session.token,
      setTimeout(() => expire(session), reconnectMs),
    );
  }
  function dispose() {
    disposed = true;
    for (const token of timers.keys()) clear(token);
    sessions.clear();
  }
  return { claim, connected, disconnected, dispose };
}
