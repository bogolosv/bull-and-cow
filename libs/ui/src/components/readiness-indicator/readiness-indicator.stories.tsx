import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ReadinessIndicator } from "./readiness-indicator";
const meta = {
  title: "Game/ReadinessIndicator",
  component: ReadinessIndicator,
  args: {
    labels: uk.ui.ReadinessIndicator,
    selfReady: false,
    opponentReady: false,
  },
} satisfies Meta<typeof ReadinessIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;
export const BothChoosing: Story = {};
export const SelfReady: Story = { args: { selfReady: true } };
export const OpponentReady: Story = { args: { opponentReady: true } };
export const BothReady: Story = {
  args: { selfReady: true, opponentReady: true },
};
