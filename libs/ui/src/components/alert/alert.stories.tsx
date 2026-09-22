import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert } from "./alert";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  args: { children: "Відновлюємо зв’язок…" },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
