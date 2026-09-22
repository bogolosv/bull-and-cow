import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mascot } from "./mascot";
const meta = {
  title: "Game/Mascot",
  component: Mascot,
  decorators: [
    (Story) => (
      <div
        style={{ width: "var(--size-mascot)", height: "var(--size-mascot)" }}
      >
        <Story />
      </div>
    ),
  ],
  args: { kind: "bull" },
} satisfies Meta<typeof Mascot>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Bull: Story = {};
export const Cow: Story = { args: { kind: "cow" } };
export const Ghost: Story = { args: { kind: "cow", ghost: true } };
