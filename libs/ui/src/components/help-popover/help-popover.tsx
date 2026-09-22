import styles from "./help-popover.module.css";
import type { ReactNode } from "react";
export function HelpPopover({
  labels,
  label = labels.label,
  title,
  children,
  open,
}: {
  labels: HelpPopoverLabels;
  label?: string;
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className={styles.help} open={open}>
      <summary aria-label={label} title={label}>
        ?
      </summary>
      <div className={styles.helpPopover}>
        <strong>{title}</strong>
        {children}
      </div>
    </details>
  );
}

export type HelpPopoverLabels = { label: string };
