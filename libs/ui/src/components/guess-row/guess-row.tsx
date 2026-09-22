import type { CSSProperties } from "react";
import { Mascot } from "../mascot";
import styles from "./guess-row.module.css";
export function GuessRow({
  labels,
  code,
  bulls,
  cows,
  number,
}: {
  labels: GuessRowLabels;
  code: string;
  bulls: number;
  cows: number;
  number: number;
}) {
  return (
    <div
      className={styles.row}
      aria-label={`${labels.attempt} ${number}: ${code.split("").join(" ")}, ${labels.bulls} ${bulls}, ${labels.cows} ${cows}`}
    >
      <span className={styles.number} aria-hidden="true">
        {String(number).padStart(2, "0")}
      </span>
      <div className={styles.digits} aria-hidden="true">
        {[...code].map((digit, index) => (
          <span
            key={index}
            className={styles.digit}
            style={{ "--index": index } as CSSProperties}
          >
            {digit}
          </span>
        ))}
      </div>
      <div className={styles.results} aria-hidden="true">
        <span className={`${styles.score} ${bulls ? styles.bulls : ""}`}>
          <span className={styles.mascot}>
            <Mascot />
          </span>
          {bulls}
        </span>
        <span className={`${styles.score} ${cows ? styles.cows : ""}`}>
          <span className={styles.mascot}>
            <Mascot kind="cow" />
          </span>
          {cows}
        </span>
      </div>
    </div>
  );
}

export type GuessRowLabels = { attempt: string; bulls: string; cows: string };
