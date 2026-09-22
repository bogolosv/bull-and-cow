import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { uk } from "@bull-and-cow/i18n";
import { RematchControl } from "./rematch-control";
const meta = {
  title: "Game/RematchControl",
  component: RematchControl,
  args: {
    labels: uk.ui.RematchControl,
    score: "2 : 1",
    accepted: false,
    opponentAccepted: false,
    available: true,
    onConfirm: fn(),
    onExit: fn(),
  },
} satisfies Meta<typeof RematchControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Waiting: Story = { args: { accepted: true } };
export const Invited: Story = { args: { opponentAccepted: true } };
export const OpponentLeft: Story = { args: { available: false } };
