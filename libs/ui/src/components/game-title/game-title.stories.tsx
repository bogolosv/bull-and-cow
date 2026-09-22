import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameTitle } from "./game-title";
const meta = {
  title: "Game/GameTitle",
  component: GameTitle,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { labels: uk.ui.GameTitle },
} satisfies Meta<typeof GameTitle>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
