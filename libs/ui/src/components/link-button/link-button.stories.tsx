import type { Meta, StoryObj } from "@storybook/react-vite";
import { LinkButton } from "./link-button";
const meta = {
  title: "Actions/LinkButton",
  component: LinkButton,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { href: "#lobby", children: "← До кімнат" },
} satisfies Meta<typeof LinkButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
