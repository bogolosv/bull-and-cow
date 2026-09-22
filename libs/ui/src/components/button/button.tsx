import styles from "./button.module.css";
import type { ButtonHTMLAttributes, ReactNode } from "react";
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "soft" | "ghost";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};
const variants = {
  primary: "playButton",
  secondary: "joinButton",
  soft: "inviteButton",
  ghost: "textButton",
} as const;
export function Button({
  variant = "primary",
  size = "medium",
  fullWidth,
  loading = false,
  leadingIcon,
  trailingIcon,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${styles[variants[variant]]} ${className}`}
      data-size={size}
      data-full-width={fullWidth}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {leadingIcon && (
        <span className={styles.buttonIcon} aria-hidden="true">
          {leadingIcon}
        </span>
      )}
      {children}
      {trailingIcon && (
        <span className={styles.buttonIcon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
