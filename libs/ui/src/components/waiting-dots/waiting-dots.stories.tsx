import type { Meta, StoryObj } from "@storybook/react-vite";
import { WaitingDots } from "./waiting-dots";

const meta = {
  title: "Feedback/WaitingDots",
  component: WaitingDots,
  args: {},
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WaitingDots>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
