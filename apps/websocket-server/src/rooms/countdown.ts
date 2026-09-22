import type { Room } from "@bull-and-cow/shared";

import type { ServerState } from "../state/state";

export function createCountdown(
  state: ServerState,
  startMatch: (room: Room) => void,
  durationMs = 5000,
) {
  const { rooms, countdowns } = state;
  function update(room: Room) {
    if (room.phase === "playing" || room.phase === "finished") return;
    const timer = countdowns.get(room.id);
    if (timer) clearTimeout(timer);
    countdowns.delete(room.id);
    const bothReady =
      room.players.length === 2 &&
      room.players.every((player) => player.ready && player.connected);
    room.phase = bothReady
      ? "countdown"
      : room.players.length === 2
        ? "choosing"
        : "waiting";
    room.startsAt = bothReady ? Date.now() + durationMs : null;
    if (room.phase === "countdown") {
      countdowns.set(
        room.id,
        setTimeout(() => {
          countdowns.delete(room.id);
          if (
            room.phase !== "countdown" ||
            room.players.length !== 2 ||
            !room.players.every((player) => player.ready && player.connected) ||
            !rooms.has(room.id)
          )
            return;
          startMatch(room);
        }, durationMs),
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
