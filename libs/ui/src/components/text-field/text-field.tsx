"use client";

import styles from "./text-field.module.css";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  error?: string;
};
export function TextField({
  id,
  label,
  leadingIcon,
  trailingIcon,
  error,
  className = "",
  "aria-describedby": describedBy,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className={`${styles.nameField} ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.nameInput}>
        {leadingIcon && <span aria-hidden="true">{leadingIcon}</span>}
        <input
          {...props}
          id={inputId}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={
            [describedBy, error ? errorId : undefined]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {trailingIcon && (
          <span className={styles.pencil} aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </div>
      {error && (
        <p className={styles.inputError} id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
