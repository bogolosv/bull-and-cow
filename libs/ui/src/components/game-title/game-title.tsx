import styles from "./game-title.module.css";
import { Mascot } from "../mascot";
export function GameTitle({
  labels,
  subtitle = labels.subtitle,
}: {
  labels: GameTitleLabels;
  subtitle?: string;
}) {
  return (
    <header className={styles.gameTitle}>
      <div className={styles.mascotPair}>
        <div className={styles.titleMascot}>
          <Mascot />
        </div>
        <span aria-hidden="true">&</span>
        <div className={styles.titleMascot}>
          <Mascot kind="cow" />
        </div>
      </div>
      <h1>
        {labels.bulls} <span>{labels.and}</span> {labels.cows}
      </h1>
      {subtitle && <p>{subtitle}</p>}
    </header>
  );
}

export type GameTitleLabels = {
  subtitle: string;
  bulls: string;
  and: string;
  cows: string;
};
