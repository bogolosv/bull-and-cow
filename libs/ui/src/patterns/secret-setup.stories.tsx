import { useI18n } from "@bull-and-cow/i18n/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Button,
  Countdown,
  FormStack,
  GameLayout,
  HelpPopover,
  Panel,
  ReadinessIndicator,
  RoomHeading,
  SecretCodeInput,
  SecretCodePreview,
  StatusArea,
  WaitingDots,
} from "../../.storybook/localized-components";
const meta = {
  title: "Layouts/SecretSetup",
  component: GameLayout,
  args: { children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GameLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
function Setup({
  accepted = false,
  countdown = false,
}: {
  accepted?: boolean;
  countdown?: boolean;
}) {
  const { messages: m } = useI18n();
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(accepted);
  return (
    <GameLayout
      toolbar={
        <>
          <span />
          <HelpPopover label={m.app.help} title={m.app.choose}>
            <p>{m.app.roomHelp}</p>
          </HelpPopover>
        </>
      }
    >
      <RoomHeading roomCode="ABC123">
        {countdown ? m.app.getReady : confirmed ? m.app.locked : m.app.choose}
      </RoomHeading>
      <Panel variant="room">
        {confirmed ? (
          <>
            <SecretCodePreview code={code || "0482"} />
            <StatusArea message={countdown ? m.app.starting : m.app.waiting}>
              {countdown ? (
                <Countdown seconds={3} progress={0.6} />
              ) : (
                <WaitingDots />
              )}
            </StatusArea>
          </>
        ) : (
          <FormStack>
            <p>{m.app.secretHint}</p>
            <SecretCodeInput value={code} onChange={setCode} />
            <Button
              disabled={!/^[0-9]{4}$/.test(code) || new Set(code).size !== 4}
              onClick={() => setConfirmed(true)}
            >
              {m.app.lock}
            </Button>
          </FormStack>
        )}
        <ReadinessIndicator selfReady={confirmed} opponentReady={countdown} />
      </Panel>
      <Button
        variant="ghost"
        onClick={() => {
          setConfirmed(false);
          setCode("");
        }}
      >
        ← {m.app.leave}
      </Button>
    </GameLayout>
  );
}
export const Choosing: Story = { render: () => <Setup /> };
export const Confirmed: Story = { render: () => <Setup accepted /> };
export const BothReady: Story = { render: () => <Setup accepted countdown /> };
