import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
const meta = {
  title: "Display/Badge",
  component: Badge,
  args: { children: "2" },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Neutral: Story = {};
export const Success: Story = {
  args: { tone: "success", children: "Це ти ✓" },
};
export const Warm: Story = { args: { tone: "warm", children: "Суперник ✓" } };
export const Muted: Story = {
  args: { tone: "muted", children: "Вільне місце" },
};
