import styles from "./empty-state.module.css";
export function EmptyState({ message }: { message: string }) {
  return (
    <div className={styles.emptyRooms}>
      <div className={styles.tinySeats} aria-hidden="true">
        <span>•</span>
        <span>?</span>
      </div>
      <p>{message}</p>
    </div>
  );
}
