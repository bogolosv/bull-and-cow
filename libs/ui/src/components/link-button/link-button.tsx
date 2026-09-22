import styles from "./link-button.module.css";
import type { AnchorHTMLAttributes } from "react";
export function LinkButton({
  className = "",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} className={`${styles.textButton} ${className}`}>
      {children}
    </a>
  );
}
