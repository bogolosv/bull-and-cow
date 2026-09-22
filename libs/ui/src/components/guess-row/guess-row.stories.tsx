import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { GuessRow } from "./guess-row";
const meta = {
  title: "Game/GuessRow",
  component: GuessRow,
  args: { labels: uk.ui.GuessRow, code: "0482", bulls: 1, cows: 2, number: 1 },
} satisfies Meta<typeof GuessRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Mixed: Story = {};
export const NoMatches: Story = { args: { bulls: 0, cows: 0 } };
export const AllCows: Story = { args: { bulls: 0, cows: 4 } };
export const Solved: Story = { args: { bulls: 4, cows: 0, number: 8 } };
