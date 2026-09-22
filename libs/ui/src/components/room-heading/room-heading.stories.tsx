import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoomHeading } from "./room-heading";

const meta = {
  title: "Game/RoomHeading",
  component: RoomHeading,
  args: {
    labels: uk.ui.RoomHeading,
    roomCode: "ABC123",
    children: "Чекаємо суперника",
  },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoomHeading>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
