import { uk, getMessages } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { SecretCodeInput } from "./secret-code-input";
const meta = {
  title: "Game/SecretCodeInput",
  component: SecretCodeInput,
  args: { labels: uk.ui.SecretCodeInput, value: "", onChange: () => undefined },
  render: function Input(args) {
    const [value, setValue] = useState(args.value);
    return <SecretCodeInput {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof SecretCodeInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Partial: Story = { args: { value: "04" } };
export const Complete: Story = { args: { value: "0482" } };
export const Duplicate: Story = { args: { value: "0442" } };
export const Disabled: Story = { args: { value: "0482", disabled: true } };
export const Keyboard: Story = {
  play: async ({ canvasElement, globals }) => {
    const labels = getMessages(globals.locale === "en" ? "en" : "uk").ui
      .SecretCodeInput;
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "0442");
    await expect(input).toHaveValue("0442");
    await expect(canvas.getByText(labels.duplicate)).toBeVisible();
    await userEvent.clear(input);
    await userEvent.type(input, "0482");
    await expect(input).toHaveValue("0482");
    await expect(input).toHaveAttribute("aria-invalid", "false");
  },
};
export const Paste: Story = {
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox");
    await userEvent.click(input);
    await userEvent.paste("0482");
    await expect(input).toHaveValue("0482");
    await userEvent.keyboard("{Backspace}");
    await expect(input).toHaveValue("048");
  },
};
