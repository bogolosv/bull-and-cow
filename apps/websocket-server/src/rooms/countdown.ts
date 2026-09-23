import { systemTimers, type Timers } from "../time/timers";
import type { Room } from "@bull-and-cow/shared";

import type { ServerState } from "../state/state";

export function createCountdown(
  state: ServerState,
  startMatch: (room: Room) => void,
  durationMs = 5000,
  clock: Timers = systemTimers,
) {
  const { rooms, countdowns } = state;
  function update(room: Room) {
    if (room.phase === "playing" || room.phase === "finished") return;
    const timer = countdowns.get(room.id);
    if (timer) clock.cancel(timer);
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
    schedule(room);
  }
  function schedule(room: Room) {
    if (room.phase === "countdown" && room.startsAt !== null) {
      countdowns.set(
        room.id,
        clock.schedule(
          () => {
            countdowns.delete(room.id);
            if (
              room.phase !== "countdown" ||
              room.players.length !== 2 ||
              !room.players.every(
                (player) => player.ready && player.connected,
              ) ||
              !rooms.has(room.id)
            )
              return;
            startMatch(room);
          },
          Math.max(0, room.startsAt - Date.now()),
        ),
      );
    }
  }
  function dispose() {
    for (const timer of countdowns.values()) clock.cancel(timer);
    countdowns.clear();
  }
  return {
    update,
    dispose,
    restore: () => {
      for (const room of rooms.values()) schedule(room);
    },
  };
}
export type Countdown = ReturnType<typeof createCountdown>;
