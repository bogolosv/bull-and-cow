import styles from "./note.module.css";
import type { ReactNode } from "react";
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className={styles.bottomNote}>
      <span aria-hidden="true">✧</span>
      {children}
    </p>
  );
}
