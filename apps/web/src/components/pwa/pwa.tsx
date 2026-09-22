"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@bull-and-cow/i18n/react";
import { Button } from "@bull-and-cow/ui";
import styles from "./pwa.module.css";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export function Pwa({ hidden = false }: { hidden?: boolean }) {
  const { messages: m } = useI18n();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [ios, setIos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const display = matchMedia("(display-mode: standalone)");
    const sync = () =>
      setInstalled(
        display.matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    sync();
    setIos(
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1),
    );
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    display.addEventListener("change", sync);
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator &&
      window.isSecureContext
    ) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Installation remains available; offline support retries on next load.
        });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      display.removeEventListener("change", sync);
    };
  }, []);
  if (installed || hidden) return null;
  return (
    <div className={styles.install}>
      {prompt ? (
        <Button
          variant="ghost"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setFailed(false);
            try {
              await prompt.prompt();
              await prompt.userChoice;
              setPrompt(null);
            } catch {
              setFailed(true);
              setPrompt(null);
            } finally {
              setBusy(false);
            }
          }}
        >
          {m.app.install}
        </Button>
      ) : (
        <details className={styles.help}>
          <summary>{m.app.install}</summary>
          <p>{ios ? m.app.installIos : m.app.installBrowser}</p>
        </details>
      )}
      {failed && <p role="status">{m.app.installFailed}</p>}
    </div>
  );
}
