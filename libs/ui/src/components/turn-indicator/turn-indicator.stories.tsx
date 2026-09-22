import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TurnIndicator } from "./turn-indicator";
const meta = {
  title: "Game/TurnIndicator",
  component: TurnIndicator,
  args: { labels: uk.ui.TurnIndicator, yourTurn: true, opponentName: "Олена" },
} satisfies Meta<typeof TurnIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;
export const YourTurn: Story = {};
export const OpponentTurn: Story = { args: { yourTurn: false } };
export const LongName: Story = {
  args: { yourTurn: false, opponentName: "НайзагадковішийСуперникУВсесвіті" },
};
