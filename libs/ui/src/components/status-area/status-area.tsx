import styles from "./status-area.module.css";
import type { ReactNode } from "react";
export function StatusArea({
  children,
  message,
}: {
  children: ReactNode;
  message: string;
}) {
  return (
    <div className={styles.startState}>
      {children}
      <p role="status">{message}</p>
    </div>
  );
}
