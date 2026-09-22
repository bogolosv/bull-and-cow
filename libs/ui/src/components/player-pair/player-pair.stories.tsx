import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlayerPair } from "./player-pair";
import { PlayerCard } from "../../../.storybook/localized-components";

const meta = {
  title: "Layouts/PlayerPair",
  component: PlayerPair,
  args: {
    first: <PlayerCard name="Богдан" />,
    second: <PlayerCard name="Олена" kind="cow" state="opponent" />,
  },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerPair>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
