import type { Meta, StoryObj } from "@storybook/react-vite";
import { GameLayout } from "./game-layout";
import { Panel } from "../panel";

const meta = {
  title: "Layouts/GameLayout",
  component: GameLayout,
  args: { children: <Panel>Контент по центру</Panel> },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof GameLayout>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
