"use client";
import { useEffect, useState } from "react";
import { GameTimer } from "@bull-and-cow/ui";
import { useI18n } from "@bull-and-cow/i18n/react";
import { useGame } from "./game-provider";
import { useRemainingSeconds } from "../hooks/use-remaining-seconds";
export function RecoveryStatus() {
  const { rooms, roomId, status, clockOffset } = useGame();
  const { messages: m } = useI18n();
  const [localDeadline, setLocalDeadline] = useState<number | null>(null);
  useEffect(() => {
    setLocalDeadline(status === "connecting" ? Date.now() + 30_000 : null);
  }, [status]);
  const room = rooms.find((r) => r.id === roomId);
  const disconnected = room?.players.find((p) => !p.connected);
  const deadline =
    status === "connecting"
      ? localDeadline
      : (disconnected?.reconnectUntil ?? null);
  const seconds = useRemainingSeconds(
    deadline,
    status === "connecting" ? 0 : clockOffset,
  );
  if (!room || room.phase === "finished" || deadline === null) return null;
  return (
    <GameTimer
      seconds={seconds}
      label={
        status === "connecting"
          ? m.app.reconnect
          : `${disconnected?.name} — ${m.app.waitingReconnect}`
      }
    />
  );
}
