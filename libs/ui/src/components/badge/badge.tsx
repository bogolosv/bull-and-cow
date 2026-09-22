import styles from "./badge.module.css";
import type { HTMLAttributes } from "react";
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warm" | "muted";
};
export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  const tones = {
    neutral: "counter",
    success: "playerBadge",
    warm: "opponentBadge",
    muted: "waitingBadge",
  } as const;
  return (
    <span
      {...props}
      className={`${styles.badge} ${tone === "neutral" ? "" : styles.playerBadge} ${styles[tones[tone]]} ${className}`}
    />
  );
}
