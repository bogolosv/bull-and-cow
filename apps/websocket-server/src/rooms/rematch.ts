import type { ServerState, PlayerSession } from "../state/state";
import type { Publisher } from "../transport/publisher";
export function createRematch(state: ServerState, publisher: Publisher) {
  return (session: PlayerSession, matchId: string) => {
    const room = session.roomId ? state.rooms.get(session.roomId) : undefined;
    if (
      !room ||
      room.phase !== "finished" ||
      room.players.length !== 2 ||
      !room.players.every((p) => p.connected) ||
      state.matches.get(room.id)?.id !== matchId
    ) {
      publisher.send(session.playerId, {
        type: "error",
        payload: { code: "REMATCH_UNAVAILABLE" },
      });
      return;
    }
    if (!room.rematchPlayerIds.includes(session.playerId))
      room.rematchPlayerIds.push(session.playerId);
    if (room.rematchPlayerIds.length === 2) {
      state.matches.delete(room.id);
      state.secrets.delete(room.id);
      room.rematchPlayerIds = [];
      room.startsAt = null;
      room.phase = "choosing";
      room.players.forEach((p) => {
        p.ready = false;
      });
    }
    publisher.send(session.playerId, { type: "rematch.accepted" });
    publisher.publishRooms();
  };
}
