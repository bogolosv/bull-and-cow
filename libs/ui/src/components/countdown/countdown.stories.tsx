import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Countdown } from "./countdown";
const meta = {
  title: "Feedback/Countdown",
  component: Countdown,
  args: { labels: uk.ui.Countdown, seconds: 5, progress: 1 },
} satisfies Meta<typeof Countdown>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Start: Story = {};
export const Halfway: Story = { args: { seconds: 3, progress: 0.5 } };
export const LastSecond: Story = { args: { seconds: 1, progress: 0.2 } };
export const Finished: Story = { args: { seconds: 0, progress: 0 } };
export const Clamped: Story = { args: { seconds: -1, progress: 2 } };
