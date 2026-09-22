import type { Meta, StoryObj } from "@storybook/react-vite";
import { RoomList } from "./room-list";
import { RoomCard } from "../../../.storybook/localized-components";

const meta = {
  title: "Layouts/RoomList",
  component: RoomList,
  args: {
    children: (
      <>
        <li>
          <RoomCard playerName="Олена" />
        </li>
        <li>
          <RoomCard playerName="Богдан" />
        </li>
      </>
    ),
  },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RoomList>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
