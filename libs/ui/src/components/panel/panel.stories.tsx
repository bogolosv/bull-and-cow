import type { Meta, StoryObj } from "@storybook/react-vite";
import { Panel } from "./panel";
const meta = {
  title: "Display/Panel",
  component: Panel,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { children: "Місце для контенту" },
} satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Lobby: Story = { args: { variant: "lobby" } };
export const Room: Story = { args: { variant: "room" } };
