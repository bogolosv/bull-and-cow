import { getMessages } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { TextField } from "./text-field";
const meta = {
  title: "Forms/TextField",
  component: TextField,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: {
    label: "Твоє ім’я",
    placeholder: "Як тебе звати?",
    leadingIcon: "☺",
    trailingIcon: "✎",
  },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Filled: Story = { args: { defaultValue: "Богдан" } };
export const Disabled: Story = {
  args: { defaultValue: "Богдан", disabled: true },
};
export const Invalid: Story = { args: { error: "Введи ім’я гравця" } };
export const Typing: Story = {
  play: async ({ canvasElement, globals }) => {
    const input = within(canvasElement).getByRole("textbox", {
      name: getMessages(globals.locale === "en" ? "en" : "uk").app.name,
    });
    await userEvent.type(input, "Олена");
    await expect(input).toHaveValue("Олена");
  },
};
