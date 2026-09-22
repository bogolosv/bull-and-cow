"use client";
import { useId, useState } from "react";
import styles from "./secret-code-input.module.css";

export type SecretCodeInputProps = {
  labels: SecretCodeInputLabels;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
};

export function SecretCodeInput({
  labels,
  value,
  onChange,
  disabled,
  label = labels.label,
}: SecretCodeInputProps) {
  const id = useId();
  const [position, setPosition] = useState(0);
  const repeated = [...value].filter(
    (digit, index) => value.indexOf(digit) !== index,
  );
  const invalid = repeated.length > 0;
  return (
    <div className={styles.field}>
      <label className={styles.srOnly} htmlFor={id}>
        {label}
      </label>
      <div className={styles.control} data-disabled={disabled || undefined}>
        <div className={styles.tiles} aria-hidden="true">
          {Array.from({ length: 4 }, (_, index) => (
            <span
              key={`${index}-${value[index] || "empty"}`}
              className={`${styles.tile} ${Math.min(position, 3) === index ? styles.active : ""} ${value[index] && repeated.includes(value[index]) ? styles.invalid : ""}`}
            >
              {value[index] || <span className={styles.placeholder}>—</span>}
            </span>
          ))}
        </div>
        <input
          id={id}
          className={styles.input}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          maxLength={4}
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={invalid ? `${id}-error` : undefined}
          onChange={(event) => {
            const next = event.target.value.replace(/[^0-9]/g, "").slice(0, 4);
            onChange(next);
            setPosition(event.target.selectionStart ?? next.length);
          }}
          onSelect={(event) =>
            setPosition(event.currentTarget.selectionStart ?? 0)
          }
        />
      </div>
      <p className={styles.error} id={`${id}-error`} aria-live="polite">
        {invalid ? labels.duplicate : "\u00a0"}
      </p>
    </div>
  );
}

export type SecretCodeInputLabels = { label: string; duplicate: string };
