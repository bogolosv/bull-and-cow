import { uk, getMessages } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { SurrenderControl } from "./surrender-control";
const meta = {
  title: "Game/SurrenderControl",
  component: SurrenderControl,
  args: { labels: uk.ui.SurrenderControl, onConfirm: fn() },
} satisfies Meta<typeof SurrenderControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Confirmation: Story = {
  play: async ({ canvasElement, globals }) => {
    const labels = getMessages(globals.locale === "en" ? "en" : "uk").ui
      .SurrenderControl;
    await userEvent.click(
      within(canvasElement).getByRole("button", {
        name: labels.surrender,
      }),
    );
  },
};
export const CancelAndConfirm: Story = {
  play: async ({ canvasElement, args, globals }) => {
    const labels = getMessages(globals.locale === "en" ? "en" : "uk").ui
      .SurrenderControl;
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: labels.surrender }),
    );
    await userEvent.click(canvas.getByRole("button", { name: labels.cancel }));
    await expect(args.onConfirm).not.toHaveBeenCalled();
    await userEvent.click(
      canvas.getByRole("button", { name: labels.surrender }),
    );
    await userEvent.click(canvas.getByRole("button", { name: labels.confirm }));
    await expect(args.onConfirm).toHaveBeenCalledTimes(1);
  },
};
