import styles from "./room-card.module.css";
import { Mascot } from "../mascot";
import { Button } from "../button";
export type RoomCardProps = {
  labels: RoomCardLabels;
  playerName: string;
  disabled?: boolean;
  onJoin?: () => void;
};
export function RoomCard({
  labels,
  playerName,
  disabled,
  onJoin,
}: RoomCardProps) {
  return (
    <div className={styles.roomRow}>
      <div className={styles.miniAvatar}>
        <Mascot />
      </div>
      <div className={styles.roomLabel}>
        <strong>{playerName}</strong>
        <span>{labels.waiting}</span>
      </div>
      <Button
        variant="secondary"
        disabled={disabled}
        aria-label={`${labels.join} ${playerName}`}
        onClick={onJoin}
        trailingIcon="↗"
      >
        {labels.play}
      </Button>
    </div>
  );
}

export type RoomCardLabels = { waiting: string; join: string; play: string };
