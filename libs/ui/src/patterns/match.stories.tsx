import { useI18n } from "@bull-and-cow/i18n/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import {
  Button,
  FormStack,
  GameLayout,
  GuessRow,
  HelpPopover,
  MatchResult,
  Panel,
  RoomHeading,
  SectionHeading,
  SecretCodeInput,
  SurrenderControl,
  TurnIndicator,
} from "../../.storybook/localized-components";
const meta = {
  title: "Layouts/Match",
  component: GameLayout,
  args: { children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GameLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
function MatchPreview({
  yourTurn = true,
  populated = false,
}: {
  yourTurn?: boolean;
  populated?: boolean;
}) {
  const { messages: m } = useI18n();
  const [value, setValue] = useState("");
  const [surrendered, setSurrendered] = useState(false);
  return (
    <GameLayout
      toolbar={
        <HelpPopover title={m.app.help}>
          <p>
            {m.app.bullRule} {m.app.cowRule}
          </p>
        </HelpPopover>
      }
    >
      <RoomHeading roomCode="ABC123">
        {surrendered ? m.app.finished : m.app.solve}
      </RoomHeading>
      <Panel variant="room">
        {surrendered ? (
          <MatchResult
            won={false}
            reason="surrender"
            attempts={populated ? 2 : 0}
            onExit={() => setSurrendered(false)}
          />
        ) : (
          <FormStack>
            <TurnIndicator yourTurn={yourTurn} opponentName="Олена" />
            <SectionHeading count={populated ? 2 : 0}>
              {m.app.attempts}
            </SectionHeading>
            {populated && (
              <div>
                <GuessRow code="0123" bulls={1} cows={1} number={1} />
                <GuessRow code="0428" bulls={2} cows={2} number={2} />
              </div>
            )}
            <SecretCodeInput
              label={m.app.guess}
              value={value}
              onChange={setValue}
              disabled={!yourTurn}
            />
            <Button
              disabled={
                !yourTurn || !/^\d{4}$/.test(value) || new Set(value).size !== 4
              }
            >
              {yourTurn ? m.app.check : m.app.waitTurn}
            </Button>
          </FormStack>
        )}
      </Panel>
      {!surrendered && (
        <SurrenderControl onConfirm={() => setSurrendered(true)} />
      )}
    </GameLayout>
  );
}
export const FirstTurn: Story = { render: () => <MatchPreview /> };
export const YourTurn: Story = { render: () => <MatchPreview populated /> };
export const OpponentTurn: Story = {
  render: () => <MatchPreview populated yourTurn={false} />,
};
export const Victory: Story = {
  render: function Render() {
    const { messages: m } = useI18n();
    return (
      <GameLayout>
        <RoomHeading roomCode="ABC123">{m.app.finished}</RoomHeading>
        <Panel variant="room">
          <MatchResult won reason="solved" attempts={5} />
        </Panel>
      </GameLayout>
    );
  },
};
