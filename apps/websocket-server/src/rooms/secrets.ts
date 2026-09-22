import type { ServerState, PlayerSession } from "../state/state";
import type { Publisher } from "../transport/publisher";
import type { ClientMessage } from "@bull-and-cow/shared";
import type { Countdown } from "./countdown";

export function createSecrets(
  state: ServerState,
  publisher: Publisher,
  countdown: Countdown,
) {
  const { rooms, secrets } = state;
  const { send, publishRooms } = publisher;
  const updateCountdown = countdown.update;
  function submit(
    session: PlayerSession,
    message: Extract<ClientMessage, { type: "secret.submit" }>,
  ) {
    const { playerId } = session;

    const room = session.roomId ? rooms.get(session.roomId) : undefined;
    const player = room?.players.find((entry) => entry.id === playerId);
    if (!room || !player) {
      send(playerId, {
        type: "error",
        payload: { code: "NOT_IN_ROOM" },
      });
      return;
    }
    const saved = secrets.get(room.id)?.get(playerId);
    if (saved === message.payload.code) {
      send(playerId, {
        type: "secret.accepted",
        payload: { roomId: room.id, code: saved },
      });
      return;
    }
    if (player.ready || room.phase !== "choosing") {
      send(playerId, {
        type: "error",
        payload: {
          code: player.ready ? "SECRET_ALREADY_SET" : "WAIT_FOR_OPPONENT",
        },
      });
      return;
    }
    const roomSecrets = secrets.get(room.id) || new Map<string, string>();
    roomSecrets.set(playerId, message.payload.code);
    secrets.set(room.id, roomSecrets);
    player.ready = true;
    updateCountdown(room);
    // Private acknowledgement: never include codes in a room snapshot.
    send(playerId, {
      type: "secret.accepted",
      payload: { roomId: room.id, code: message.payload.code },
    });
    publishRooms();
  }
  return { submit };
}
