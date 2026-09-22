import styles from "./panel.module.css";
import type { ComponentPropsWithoutRef } from "react";
export type PanelProps = ComponentPropsWithoutRef<"section"> & {
  variant?: "default" | "lobby" | "room" | "fallback";
};
export function Panel({
  variant = "default",
  className = "",
  ...props
}: PanelProps) {
  const variantClass = {
    default: "panel",
    lobby: "lobbyPanel",
    room: "roomPanel",
    fallback: "fallbackPanel",
  } as const;
  return (
    <section
      {...props}
      className={`${styles.panel} ${styles[variantClass[variant]]} ${className}`}
    />
  );
}
