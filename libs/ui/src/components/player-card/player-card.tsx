import styles from "./player-card.module.css";
import { Mascot } from "../mascot";
import { Badge } from "../badge";
export type PlayerCardProps = {
  labels: PlayerCardLabels;
  name: string;
  kind?: "bull" | "cow";
  state?: "self" | "opponent" | "waiting";
};
export function PlayerCard({
  labels,
  name,
  kind = "bull",
  state = "self",
}: PlayerCardProps) {
  const waiting = state === "waiting";
  return (
    <div className={`${styles.player} ${waiting ? styles.waitingPlayer : ""}`}>
      <div
        className={`${styles.playerPortrait} ${waiting ? styles.waitingPortrait : kind === "bull" ? styles.lavender : styles.peach}`}
      >
        <div className={styles.portraitArt}>
          <Mascot kind={kind} ghost={waiting} />
        </div>
        {waiting && (
          <span className={styles.questionBadge} aria-hidden="true">
            ?
          </span>
        )}
      </div>
      <strong>{name}</strong>
      <Badge tone={waiting ? "muted" : state === "self" ? "success" : "warm"}>
        {waiting
          ? labels.waiting
          : state === "self"
            ? labels.self
            : labels.opponent}
      </Badge>
    </div>
  );
}

export type PlayerCardLabels = {
  waiting: string;
  self: string;
  opponent: string;
};
