import styles from "./turn-indicator.module.css";
export function TurnIndicator({
  labels,
  yourTurn,
  opponentName = labels.opponent,
}: {
  labels: TurnIndicatorLabels;
  yourTurn: boolean;
  opponentName?: string;
}) {
  return (
    <div
      key={String(yourTurn)}
      className={`${styles.indicator} ${yourTurn ? styles.active : ""}`}
      role="status"
    >
      <span className={styles.spark} aria-hidden="true">
        {yourTurn ? "✦" : "◷"}
      </span>
      <span>
        {yourTurn ? labels.yourTurn : `${labels.theirTurn} ${opponentName}`}
      </span>
    </div>
  );
}

export type TurnIndicatorLabels = {
  opponent: string;
  yourTurn: string;
  theirTurn: string;
};
