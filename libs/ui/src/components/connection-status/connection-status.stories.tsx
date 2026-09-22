import { uk } from "@bull-and-cow/i18n";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ConnectionStatus } from "./connection-status";
const meta = {
  title: "Feedback/ConnectionStatus",
  component: ConnectionStatus,
  args: { labels: uk.ui.ConnectionStatus, status: "online" },
} satisfies Meta<typeof ConnectionStatus>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Online: Story = {};
export const Connecting: Story = { args: { status: "connecting" } };
export const Offline: Story = { args: { status: "offline" } };
