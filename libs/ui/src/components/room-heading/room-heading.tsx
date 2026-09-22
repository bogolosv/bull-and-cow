import styles from "./room-heading.module.css";
export function RoomHeading({
  labels,
  roomCode,
  children,
}: {
  labels: RoomHeadingLabels;
  roomCode: string;
  children: React.ReactNode;
}) {
  return (
    <header className={styles.roomTitle}>
      <p className={styles.roomEyebrow}>
        {labels.room} <span>#{roomCode}</span>
      </p>
      <h1>{children}</h1>
    </header>
  );
}

export type RoomHeadingLabels = { room: string };
