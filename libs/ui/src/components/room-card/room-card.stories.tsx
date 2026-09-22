import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { RoomCard } from "./room-card";
const meta = {
  title: "Game/RoomCard",
  component: RoomCard,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { labels: uk.ui.RoomCard, playerName: "Олена", onJoin: fn() },
} satisfies Meta<typeof RoomCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Available: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const LongName: Story = {
  args: { playerName: "ГравецьЗДужеДовгимІменемБезПробілів" },
};
