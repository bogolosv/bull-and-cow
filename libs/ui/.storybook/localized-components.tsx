import { useI18n } from "@bull-and-cow/i18n/react";
import { formatCount } from "@bull-and-cow/i18n";
import type { ComponentProps } from "react";
import * as UI from "../src/index";
export * from "../src/index";
export function GameTitle(
  props: Omit<ComponentProps<typeof UI.GameTitle>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.GameTitle labels={messages.ui.GameTitle} {...props} />;
}
export function RoomCard(
  props: Omit<ComponentProps<typeof UI.RoomCard>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.RoomCard labels={messages.ui.RoomCard} {...props} />;
}
export function PlayerCard(
  props: Omit<ComponentProps<typeof UI.PlayerCard>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.PlayerCard labels={messages.ui.PlayerCard} {...props} />;
}
export function ConnectionStatus(
  props: Omit<ComponentProps<typeof UI.ConnectionStatus>, "labels">,
) {
  const { messages } = useI18n();
  return (
    <UI.ConnectionStatus labels={messages.ui.ConnectionStatus} {...props} />
  );
}
export function SecretCodeInput(
  props: Omit<ComponentProps<typeof UI.SecretCodeInput>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.SecretCodeInput labels={messages.ui.SecretCodeInput} {...props} />;
}
export function SecretCodePreview(
  props: Omit<ComponentProps<typeof UI.SecretCodePreview>, "labels">,
) {
  const { messages } = useI18n();
  return (
    <UI.SecretCodePreview labels={messages.ui.SecretCodePreview} {...props} />
  );
}
export function RoomHeading(
  props: Omit<ComponentProps<typeof UI.RoomHeading>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.RoomHeading labels={messages.ui.RoomHeading} {...props} />;
}
export function HelpPopover(
  props: Omit<ComponentProps<typeof UI.HelpPopover>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.HelpPopover labels={messages.ui.HelpPopover} {...props} />;
}
export function TurnIndicator(
  props: Omit<ComponentProps<typeof UI.TurnIndicator>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.TurnIndicator labels={messages.ui.TurnIndicator} {...props} />;
}
export function ReadinessIndicator(
  props: Omit<ComponentProps<typeof UI.ReadinessIndicator>, "labels">,
) {
  const { messages } = useI18n();
  return (
    <UI.ReadinessIndicator labels={messages.ui.ReadinessIndicator} {...props} />
  );
}
export function SurrenderControl(
  props: Omit<ComponentProps<typeof UI.SurrenderControl>, "labels">,
) {
  const { messages } = useI18n();
  return (
    <UI.SurrenderControl labels={messages.ui.SurrenderControl} {...props} />
  );
}
export function MatchResult(
  props: Omit<ComponentProps<typeof UI.MatchResult>, "labels">,
) {
  const { messages, locale } = useI18n();
  return (
    <UI.MatchResult
      labels={messages.ui.MatchResult}
      attemptsText={formatCount(locale, props.attempts, "attempt")}
      {...props}
    />
  );
}
export function GuessRow(
  props: Omit<ComponentProps<typeof UI.GuessRow>, "labels">,
) {
  const { messages } = useI18n();
  return <UI.GuessRow labels={messages.ui.GuessRow} {...props} />;
}
export function Countdown(
  props: Omit<ComponentProps<typeof UI.Countdown>, "labels">,
) {
  const { messages, locale } = useI18n();
  return (
    <UI.Countdown
      labels={messages.ui.Countdown}
      label={`${messages.ui.Countdown.label} ${formatCount(locale, props.seconds, "second")}`}
      {...props}
    />
  );
}
