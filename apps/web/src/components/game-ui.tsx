"use client";
import { useI18n } from "@bull-and-cow/i18n/react";
import { isLocale } from "@bull-and-cow/i18n";

import {
  Alert,
  LanguageSelect,
  ConnectionStatus,
  GameLayout,
  HelpPopover,
} from "@bull-and-cow/ui";
import { Pwa } from "./pwa/pwa";
import { RecoveryStatus } from "./recovery-status";
import { useGame } from "./game-provider";

export function GameShell({
  children,
  room = false,
}: {
  children: React.ReactNode;
  room?: boolean;
}) {
  const { messages: m, locale, setLocale } = useI18n();
  const { status, error } = useGame();
  return (
    <GameLayout
      toolbar={
        <>
          <ConnectionStatus labels={m.ui.ConnectionStatus} status={status} />
          <LanguageSelect
            value={locale}
            label={m.app.language}
            options={[
              { value: "uk", label: "Українська", shortLabel: "УК" },
              { value: "en", label: "English", shortLabel: "EN" },
            ]}
            onChange={(value) => {
              if (isLocale(value)) setLocale(value);
            }}
          />
          <HelpPopover
            labels={m.ui.HelpPopover}
            label={m.app.help}
            title={room ? m.app.roomHelpTitle : m.app.lobbyHelpTitle}
          >
            <p>{room ? m.app.roomHelp : m.app.lobbyHelp}</p>
            <p>
              {m.app.bullRule}
              <br />
              {m.app.cowRule}
            </p>
          </HelpPopover>
        </>
      }
    >
      {children}
      <RecoveryStatus />
      <Pwa hidden={room} />
      {error && <Alert>{m.errors[error]}</Alert>}
    </GameLayout>
  );
}
