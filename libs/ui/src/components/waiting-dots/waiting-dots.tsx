import styles from "./waiting-dots.module.css";
export function WaitingDots() {
  return (
    <div className={styles.waitingDots} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
