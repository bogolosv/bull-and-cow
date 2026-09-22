import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "./divider";
const meta = {
  title: "Display/Divider",
  component: Divider,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { children: "або приєднайся" },
} satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
