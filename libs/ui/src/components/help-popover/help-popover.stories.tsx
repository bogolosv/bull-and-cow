import { uk, getMessages } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { HelpPopover } from "./help-popover";
const meta = {
  title: "Display/HelpPopover",
  component: HelpPopover,
  decorators: [
    (Story) => (
      <div
        style={{
          width: "18rem",
          minHeight: "16rem",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    labels: uk.ui.HelpPopover,
    label: "Як грати?",
    title: "Усе просто",
    children: (
      <p>
        Бик — цифра й місце правильні. Корова — цифра правильна, місце — ні.
      </p>
    ),
  },
} satisfies Meta<typeof HelpPopover>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Closed: Story = {};
export const Open: Story = { args: { open: true } };
export const Keyboard: Story = {
  play: async ({ canvasElement, globals }) => {
    const m = getMessages(globals.locale === "en" ? "en" : "uk");
    const trigger = within(canvasElement).getByLabelText(m.app.help);
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await expect(
      within(canvasElement).getByText(m.app.lobbyHelpTitle),
    ).toBeVisible();
    await userEvent.keyboard("{Enter}");
    await expect(
      within(canvasElement).getByText(m.app.lobbyHelpTitle),
    ).not.toBeVisible();
  },
};
