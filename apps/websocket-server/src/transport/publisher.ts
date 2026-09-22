import type { ServerMessage } from "@bull-and-cow/shared";
import { matchView } from "../matches/game";
import type { ServerState } from "../state/state";

export type Transport = {
  send: (playerId: string, message: ServerMessage) => void;
  broadcast: (message: ServerMessage) => void;
};

export function createPublisher(state: ServerState, transport: Transport) {
  const roomSnapshot = (): ServerMessage => ({
    type: "rooms.list",
    payload: { rooms: [...state.rooms.values()], serverTime: Date.now() },
  });
  return {
    send: transport.send,
    sendRooms: (playerId: string) => transport.send(playerId, roomSnapshot()),
    publishRooms: () => transport.broadcast(roomSnapshot()),
    publishMatch: (roomId: string) => {
      const match = state.matches.get(roomId);
      if (!match) return;
      for (const player of match.players) {
        transport.send(player.id, {
          type: "game.state",
          payload: matchView(match, player.id, roomId),
        });
      }
    },
  };
}
export type Publisher = ReturnType<typeof createPublisher>;
