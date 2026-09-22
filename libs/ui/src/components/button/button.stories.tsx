import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn, expect, userEvent, within } from "storybook/test";
import { Button } from "./button";
const meta = {
  title: "Actions/Button",
  component: Button,
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
  args: { children: "Створити кімнату", onClick: fn() },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {};
export const Secondary: Story = {
  args: { variant: "secondary", children: "Грати", trailingIcon: "↗" },
};
export const Soft: Story = {
  args: { variant: "soft", children: "Запросити друга ↗" },
};
export const Ghost: Story = {
  args: { variant: "ghost", children: "← Вийти з кімнати" },
};
export const Small: Story = { args: { size: "small" } };
export const Large: Story = { args: { size: "large" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, children: "Зачекай…" } };
export const Click: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button"));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
export const DisabledDoesNotClick: Story = {
  args: { disabled: true },
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button");
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
