import styles from "./game-timer.module.css";
export function GameTimer({
  seconds,
  label,
  paused = false,
}: {
  seconds: number;
  label: string;
  paused?: boolean;
}) {
  const remaining = Math.min(30, Math.max(0, Math.ceil(seconds)));
  return (
    <div
      className={`${styles.timer} ${remaining <= 5 && !paused ? styles.urgent : ""}`}
      role="timer"
      aria-label={paused ? label : `${label}: ${remaining}`}
    >
      <span className={styles.label}>{label}</span>
      <strong className={styles.value} aria-hidden="true">
        {paused ? "Ⅱ" : `00:${String(remaining).padStart(2, "0")}`}
      </strong>
      <span className={styles.track} aria-hidden="true">
        <span
          className={styles.fill}
          style={{ width: `${(remaining / 30) * 100}%` }}
        />
      </span>
    </div>
  );
}
