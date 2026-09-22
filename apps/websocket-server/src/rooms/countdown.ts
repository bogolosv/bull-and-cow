import type { Room } from "@bull-and-cow/shared";
import { createMatch } from "../matches/game";
import type { ServerState } from "../state/state";
import type { Publisher } from "../transport/publisher";

export function createCountdown(state: ServerState, publisher: Publisher) {
  const { rooms, matches, countdowns } = state;
  const { publishRooms, publishMatch } = publisher;
  function update(room: Room) {
    const timer = countdowns.get(room.id);
    if (timer) clearTimeout(timer);
    countdowns.delete(room.id);
    const bothReady =
      room.players.length === 2 && room.players.every((player) => player.ready);
    room.phase = bothReady
      ? "countdown"
      : room.players.length === 2
        ? "choosing"
        : "waiting";
    room.startsAt = bothReady ? Date.now() + 5000 : null;
    if (room.phase === "countdown") {
      countdowns.set(
        room.id,
        setTimeout(() => {
          countdowns.delete(room.id);
          if (room.players.length !== 2 || !rooms.has(room.id)) return;
          room.phase = "playing";
          matches.set(room.id, createMatch(room.players));
          publishRooms();
          publishMatch(room.id);
        }, 5000),
      );
    }
  }
  function dispose() {
    for (const timer of countdowns.values()) clearTimeout(timer);
    countdowns.clear();
  }
  return { update, dispose };
}
export type Countdown = ReturnType<typeof createCountdown>;
