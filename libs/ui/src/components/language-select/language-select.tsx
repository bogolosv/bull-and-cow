"use client";
import { useId } from "react";
import styles from "./language-select.module.css";

export function LanguageSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: readonly { value: string; label: string; shortLabel?: string }[];
}) {
  const name = useId();
  return (
    <div className={styles.group} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label
          className={styles.option}
          key={option.value}
          title={option.label}
        >
          <input
            className={styles.input}
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            aria-label={option.label}
            onChange={() => onChange(option.value)}
          />
          <span className={styles.chip} aria-hidden="true">
            <span className={styles.dot} />
            {option.shortLabel ?? option.value.toUpperCase()}
          </span>
        </label>
      ))}
    </div>
  );
}
