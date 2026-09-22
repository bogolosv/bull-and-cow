import styles from "./game-layout.module.css";
import type { ReactNode } from "react";
export function GameLayout({
  children,
  toolbar,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
}) {
  return (
    <main className={styles.gameShell}>
      <div
        className={`${styles.ambient} ${styles.ambientOne}`}
        aria-hidden="true"
      />
      <div
        className={`${styles.ambient} ${styles.ambientTwo}`}
        aria-hidden="true"
      />
      <div className={`${styles.spark} ${styles.sparkOne}`} aria-hidden="true">
        ✦
      </div>
      <div className={`${styles.spark} ${styles.sparkTwo}`} aria-hidden="true">
        ✧
      </div>
      <div className={styles.gameContent}>
        {toolbar && <div className={styles.utilityRow}>{toolbar}</div>}
        {children}
      </div>
    </main>
  );
}
