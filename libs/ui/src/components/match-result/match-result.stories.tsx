import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { MatchResult } from "./match-result";
const meta = {
  title: "Game/MatchResult",
  component: MatchResult,
  args: {
    labels: uk.ui.MatchResult,
    won: true,
    reason: "solved",
    attempts: 5,
    onExit: fn(),
  },
} satisfies Meta<typeof MatchResult>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Victory: Story = {};
export const Defeat: Story = { args: { won: false } };
export const OpponentSurrendered: Story = { args: { reason: "surrender" } };
export const Surrendered: Story = {
  args: { won: false, reason: "surrender", attempts: 0 },
};
export const Disconnected: Story = { args: { reason: "disconnect" } };
export const Pending: Story = { args: { disabled: true } };
