import type { CSSProperties, ReactNode } from "react";
import { Button } from "../button";
import styles from "./match-result.module.css";
export type MatchResultProps = {
  labels: MatchResultLabels;
  won: boolean;
  reason: "solved" | "surrender" | "disconnect" | "timeout";
  attempts: number;
  attemptsText?: string;
  actions?: ReactNode;
  onExit?: () => void;
  disabled?: boolean;
};
export function MatchResult({
  labels,
  won,
  reason,
  attempts,
  attemptsText,
  actions,
  onExit,
  disabled,
}: MatchResultProps) {
  const description =
    reason === "solved"
      ? won
        ? labels.solvedWin
        : labels.solvedLoss
      : reason === "surrender"
        ? won
          ? labels.surrenderWin
          : labels.surrenderLoss
        : reason === "timeout"
          ? won
            ? labels.timeoutWin
            : labels.timeoutLoss
          : won
            ? labels.disconnectWin
            : labels.disconnectLoss;
  return (
    <section className={styles.result} aria-label={labels.label}>
      {won && (
        <div className={styles.confetti} aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  "--index": i,
                  "--x": `${((i % 6) - 2.5) * 45}px`,
                  "--y": `${-100 - (i % 4) * 24}px`,
                  "--rotation": `${i * 67}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div
        className={`${styles.emblem} ${won ? styles.winner : ""}`}
        aria-hidden="true"
      >
        {won ? "★" : "♡"}
      </div>
      <h2 className={styles.title}>{won ? labels.win : labels.loss}</h2>
      <p className={styles.description}>{description}</p>
      <p className={styles.attempts}>
        {attemptsText || (
          <>
            {labels.attempts} {attempts}
          </>
        )}
      </p>
      {actions ?? (
        <Button onClick={onExit} disabled={disabled}>
          {labels.exit}
        </Button>
      )}
    </section>
  );
}

export type MatchResultLabels = {
  solvedWin: string;
  solvedLoss: string;
  surrenderWin: string;
  surrenderLoss: string;
  timeoutWin: string;
  timeoutLoss: string;
  disconnectWin: string;
  disconnectLoss: string;
  label: string;
  win: string;
  loss: string;
  attempts: string;
  exit: string;
};
