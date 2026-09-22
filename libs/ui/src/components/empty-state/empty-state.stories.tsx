import type { Meta, StoryObj } from "@storybook/react-vite";
import { EmptyState } from "./empty-state";
const meta = {
  title: "Game/EmptyState",
  component: EmptyState,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { message: "Поки нікого. Будеш першим?" },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Loading: Story = { args: { message: "Шукаємо кімнати…" } };
