import styles from "./player-pair.module.css";
import type { ReactNode } from "react";
export function PlayerPair({
  first,
  second,
}: {
  first: ReactNode;
  second: ReactNode;
}) {
  return (
    <div className={styles.players}>
      {first}
      <span className={styles.versus} aria-hidden="true">
        vs
      </span>
      {second}
    </div>
  );
}
