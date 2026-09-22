import { expect, userEvent, within } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { LanguageSelect } from "./language-select";
const meta = {
  title: "Forms/LanguageSelect",
  component: LanguageSelect,
  args: {
    value: "uk",
    label: "Мова / Language",
    onChange: () => undefined,
    options: [
      { value: "uk", label: "Українська", shortLabel: "УК" },
      { value: "en", label: "English", shortLabel: "EN" },
    ],
  },
  render: function Select(args) {
    const [value, setValue] = useState(args.value);
    return <LanguageSelect {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof LanguageSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};

export const English: Story = { args: { value: "en" } };
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const ukrainian = canvas.getByRole("radio", { name: "Українська" });
    ukrainian.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("radio", { name: "English" })).toBeChecked();
    await userEvent.keyboard("{ArrowLeft}");
    await expect(ukrainian).toBeChecked();
  },
};
