import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusArea } from "./status-area";
import { WaitingDots } from "../waiting-dots";

const meta = {
  title: "Layouts/StatusArea",
  component: StatusArea,
  args: { children: <WaitingDots />, message: "Чекаємо суперника" },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StatusArea>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
