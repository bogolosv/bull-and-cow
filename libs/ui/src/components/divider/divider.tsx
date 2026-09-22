import styles from "./divider.module.css";
import type { ReactNode } from "react";
export function Divider({ children }: { children?: ReactNode }) {
  return (
    <div className={styles.divider}>{children && <span>{children}</span>}</div>
  );
}
