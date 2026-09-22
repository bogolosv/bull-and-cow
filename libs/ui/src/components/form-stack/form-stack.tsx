import styles from "./form-stack.module.css";
import type { ReactNode } from "react";
export function FormStack({ children }: { children: ReactNode }) {
  return <div className={styles.formStack}>{children}</div>;
}
