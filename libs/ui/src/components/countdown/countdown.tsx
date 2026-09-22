import styles from "./countdown.module.css";
export type CountdownProps = {
  labels: CountdownLabels;
  seconds: number;
  progress: number;
  label?: string;
};
export function Countdown({
  labels,
  seconds,
  progress,
  label,
}: CountdownProps) {
  const remaining = Number.isFinite(seconds)
    ? Math.max(0, Math.ceil(seconds))
    : 0;
  const ratio = Number.isFinite(progress)
    ? Math.max(0, Math.min(1, progress))
    : 0;
  return (
    <div
      className={styles.countdown}
      role="timer"
      aria-label={label || `${labels.label} ${remaining}`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="53" />
        <circle
          cx="60"
          cy="60"
          r="53"
          pathLength="100"
          className={styles.timerProgress}
          style={{ strokeDasharray: 100, strokeDashoffset: 100 * (1 - ratio) }}
        />
      </svg>
      <span key={remaining}>{remaining || "✓"}</span>
    </div>
  );
}

export type CountdownLabels = { label: string };
