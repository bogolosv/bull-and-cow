"use client";
import { useEffect, useState } from "react";
import styles from "./secret-code-preview.module.css";

export function SecretCodePreview({
  labels,
  code,
}: {
  labels: SecretCodePreviewLabels;
  code: string;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!revealed) return;
    const timer = setTimeout(() => setRevealed(false), 3000);
    const hide = () => setRevealed(false);
    window.addEventListener("blur", hide);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("blur", hide);
    };
  }, [revealed, code]);
  return (
    <div className={styles.preview}>
      <div
        className={styles.tiles}
        role="img"
        aria-label={
          revealed
            ? `${labels.number} ${code.split("").join(" ")}`
            : labels.hidden
        }
      >
        {Array.from({ length: 4 }, (_, index) => (
          <span className={styles.tile} key={index} aria-hidden="true">
            {revealed ? code[index] : "•"}
          </span>
        ))}
      </div>
      <button
        type="button"
        className={styles.reveal}
        aria-label={revealed ? labels.hideLabel : labels.showLabel}
        aria-pressed={revealed}
        onClick={() => setRevealed(!revealed)}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
        {revealed ? labels.hide : labels.show}
      </button>
    </div>
  );
}

export type SecretCodePreviewLabels = {
  number: string;
  hidden: string;
  hideLabel: string;
  showLabel: string;
  hide: string;
  show: string;
};
