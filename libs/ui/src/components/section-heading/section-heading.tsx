import styles from "./section-heading.module.css";
import type { ReactNode } from "react";
import { Badge } from "../badge";
export function SectionHeading({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <div className={styles.headingRow}>
      <h2>{children}</h2>
      {count !== undefined && <Badge>{count}</Badge>}
    </div>
  );
}
