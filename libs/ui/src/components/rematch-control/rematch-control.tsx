import { Button } from "../button";
import styles from "./rematch-control.module.css";
export type RematchLabels = {
  play: string;
  waiting: string;
  requested: string;
  unavailable: string;
  exit: string;
  score: string;
};
export function RematchControl({
  labels,
  score,
  accepted,
  opponentAccepted,
  available,
  disabled,
  onConfirm,
  onExit,
}: {
  labels: RematchLabels;
  score: string;
  accepted: boolean;
  opponentAccepted: boolean;
  available: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onExit: () => void;
}) {
  return (
    <div className={styles.controls}>
      <p className={styles.score}>
        {labels.score} <strong>{score}</strong>
      </p>
      <p className={styles.message} role="status">
        {!available
          ? labels.unavailable
          : accepted
            ? labels.waiting
            : opponentAccepted
              ? labels.requested
              : ""}
      </p>
      <Button disabled={disabled || accepted || !available} onClick={onConfirm}>
        {accepted ? labels.waiting : labels.play}
      </Button>
      <Button variant="ghost" disabled={disabled} onClick={onExit}>
        {labels.exit}
      </Button>
    </div>
  );
}
