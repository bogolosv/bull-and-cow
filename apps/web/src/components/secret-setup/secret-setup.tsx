"use client";
import { useI18n } from "@bull-and-cow/i18n/react";
import { useState } from "react";
import { Button, FormStack, SecretCodeInput } from "@bull-and-cow/ui";
import { secretCodeSchema } from "@bull-and-cow/shared";
import styles from "./secret-setup.module.css";

export function SecretSetup({
  pending,
  onConfirm,
}: {
  pending: boolean;
  onConfirm: (code: string) => void;
}) {
  const { messages: m } = useI18n();
  const [code, setCode] = useState("");
  const valid = secretCodeSchema.safeParse(code).success;
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (valid && !pending) onConfirm(code);
      }}
    >
      <p className={styles.subtitle}>{m.app.secretHint}</p>
      <FormStack>
        <SecretCodeInput
          labels={m.ui.SecretCodeInput}
          value={code}
          onChange={setCode}
          disabled={pending}
        />
        <Button type="submit" disabled={!valid} loading={pending}>
          {pending ? m.app.locking : m.app.lock}
        </Button>
      </FormStack>
    </form>
  );
}
