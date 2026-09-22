import { uk, getMessages } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { SecretCodePreview } from "./secret-code-preview";
const meta = {
  title: "Game/SecretCodePreview",
  component: SecretCodePreview,
  args: { labels: uk.ui.SecretCodePreview, code: "0482" },
} satisfies Meta<typeof SecretCodePreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Hidden: Story = {};
export const Reveal: Story = {
  play: async ({ canvasElement, globals }) => {
    const labels = getMessages(globals.locale === "en" ? "en" : "uk").ui
      .SecretCodePreview;
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button"));
    await expect(canvas.getByRole("img")).toHaveAccessibleName(
      `${labels.number} 0 4 8 2`,
    );
    await waitFor(
      () => expect(canvas.getByRole("img")).toHaveAccessibleName(labels.hidden),
      { timeout: 4000 },
    );
  },
};
