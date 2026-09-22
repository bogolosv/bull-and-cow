"use client";
import { useState } from "react";
import { Button } from "../button";
import styles from "./surrender-control.module.css";
export function SurrenderControl({
  labels,
  onConfirm,
  disabled = false,
}: {
  labels: SurrenderControlLabels;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className={styles.control}>
      {confirming ? (
        <div
          className={styles.confirmation}
          role="group"
          aria-label={labels.label}
        >
          <p className={styles.message}>{labels.message}</p>
          <div className={styles.actions}>
            <Button
              variant="soft"
              disabled={disabled}
              onClick={() => setConfirming(false)}
            >
              {labels.cancel}
            </Button>
            <Button variant="secondary" disabled={disabled} onClick={onConfirm}>
              {labels.confirm}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          disabled={disabled}
          onClick={() => setConfirming(true)}
        >
          {labels.surrender}
        </Button>
      )}
    </div>
  );
}

export type SurrenderControlLabels = {
  label: string;
  message: string;
  cancel: string;
  confirm: string;
  surrender: string;
};
