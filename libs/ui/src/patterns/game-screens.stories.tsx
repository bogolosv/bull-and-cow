import { useI18n } from "@bull-and-cow/i18n/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import {
  Button,
  ConnectionStatus,
  Countdown,
  Divider,
  EmptyState,
  FormStack,
  GameLayout,
  GameTitle,
  HelpPopover,
  Note,
  Panel,
  PlayerCard,
  PlayerPair,
  RoomCard,
  RoomHeading,
  RoomList,
  SectionHeading,
  StatusArea,
  TextField,
  WaitingDots,
} from "../../.storybook/localized-components";

const meta = {
  title: "Layouts/GameScreens",
  component: GameLayout,
  args: { children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GameLayout>;
export default meta;
type Story = StoryObj<typeof meta>;
function Toolbar() {
  const { messages: m } = useI18n();
  return (
    <>
      <ConnectionStatus status="online" />
      <HelpPopover title={m.app.lobbyHelpTitle}>
        <p>{m.app.lobbyHelp}</p>
      </HelpPopover>
    </>
  );
}
function LobbyPreview({ populated = false }: { populated?: boolean }) {
  const { messages: m } = useI18n();
  return (
    <GameLayout toolbar={<Toolbar />}>
      <GameTitle />
      <Panel variant="lobby">
        <FormStack>
          <TextField
            label={m.app.name}
            defaultValue="Богдан"
            leadingIcon="☺"
            trailingIcon="✎"
          />
          <Button leadingIcon="＋" trailingIcon="→">
            {m.app.create}
          </Button>
        </FormStack>
        <Divider>{m.app.orJoin}</Divider>
        <SectionHeading count={populated ? 2 : 0}>{m.app.rooms}</SectionHeading>
        {populated ? (
          <RoomList>
            {["Олена", "Володимир"].map((name) => (
              <li key={name}>
                <RoomCard playerName={name} />
              </li>
            ))}
          </RoomList>
        ) : (
          <EmptyState message={m.app.empty} />
        )}
      </Panel>
      <Note>{m.app.tagline}</Note>
    </GameLayout>
  );
}
function RoomPreview({
  phase = "waiting",
}: {
  phase?: "waiting" | "countdown";
}) {
  const { messages: m } = useI18n();
  return (
    <GameLayout toolbar={<Toolbar />}>
      <RoomHeading roomCode="ABC123">
        {phase === "waiting" ? m.app.waiting : m.app.getReady}
      </RoomHeading>
      <Panel variant="room">
        <PlayerPair
          first={<PlayerCard name="Богдан" />}
          second={
            <PlayerCard
              name={phase === "waiting" ? m.app.unknownPlayer : "Олена"}
              kind="cow"
              state={phase === "waiting" ? "waiting" : "opponent"}
            />
          }
        />
        <StatusArea
          message={phase === "waiting" ? m.app.needPlayer : m.app.starting}
        >
          {phase === "waiting" ? (
            <WaitingDots />
          ) : (
            <Countdown seconds={3} progress={0.6} />
          )}
        </StatusArea>
        {phase === "waiting" && <Button variant="soft">{m.app.invite}</Button>}
      </Panel>
      <Button variant="ghost">← {m.app.leave}</Button>
    </GameLayout>
  );
}
export const EmptyLobby: Story = { render: () => <LobbyPreview /> };
export const AvailableRooms: Story = {
  render: () => <LobbyPreview populated />,
};
export const WaitingRoom: Story = { render: () => <RoomPreview /> };
export const CountdownRoom: Story = {
  render: () => <RoomPreview phase="countdown" />,
};
function LiveTimer() {
  const [progress, setProgress] = useState(1);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(
      () => setProgress(Math.max(0, 1 - (Date.now() - start) / 5000)),
      100,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <GameLayout>
      <Countdown seconds={Math.ceil(progress * 5)} progress={progress} />
    </GameLayout>
  );
}
export const LiveCountdown: Story = { render: () => <LiveTimer /> };
