import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerCard } from "./player-card";
const meta = {
  title: "Game/PlayerCard",
  component: PlayerCard,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { labels: uk.ui.PlayerCard, name: "Богдан" },
} satisfies Meta<typeof PlayerCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Self: Story = {};
export const Opponent: Story = {
  args: { name: "Олена", kind: "cow", state: "opponent" },
};
export const Waiting: Story = {
  args: { name: "Хто ж це буде?", kind: "cow", state: "waiting" },
};
export const LongName: Story = {
  args: { name: "ГравецьЗДужеДовгимІменемБезПробілів" },
};
