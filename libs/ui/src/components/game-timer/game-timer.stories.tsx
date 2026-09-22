import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameTimer } from "./game-timer";
const meta = {
  title: "Game/GameTimer",
  component: GameTimer,
  args: { seconds: 30, label: "Час на хід" },
} satisfies Meta<typeof GameTimer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Full: Story = {};
export const Urgent: Story = { args: { seconds: 4 } };
export const Paused: Story = {
  args: { seconds: 18, paused: true, label: "Таймер призупинено" },
};
