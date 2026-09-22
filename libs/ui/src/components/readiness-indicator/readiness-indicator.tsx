import { Mascot } from "../mascot";
import styles from "./readiness-indicator.module.css";
export function ReadinessIndicator({
  labels,
  selfReady,
  opponentReady,
  opponentName = labels.opponent,
}: {
  labels: ReadinessIndicatorLabels;
  selfReady: boolean;
  opponentReady: boolean;
  opponentName?: string;
}) {
  return (
    <div
      className={styles.row}
      role="status"
      aria-label={`${labels.you}: ${selfReady ? labels.ready : labels.choosing}. ${opponentName}: ${opponentReady ? labels.ready : labels.choosing}.`}
    >
      <span className={styles.player} aria-hidden="true">
        <span className={styles.avatar}>
          <Mascot />
        </span>
        {labels.you}{" "}
        <span className={selfReady ? styles.ready : styles.pending}>
          {selfReady ? "✓" : "○"}
        </span>
      </span>
      <span className={styles.player} aria-hidden="true">
        <span className={styles.avatar}>
          <Mascot kind="cow" />
        </span>
        <span className={styles.name}>{opponentName}</span>
        <span className={opponentReady ? styles.ready : styles.pending}>
          {opponentReady ? "✓" : "○"}
        </span>
      </span>
    </div>
  );
}

export type ReadinessIndicatorLabels = {
  opponent: string;
  you: string;
  ready: string;
  choosing: string;
};
