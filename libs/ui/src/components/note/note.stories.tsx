import type { Meta, StoryObj } from "@storybook/react-vite";
import { Note } from "./note";

const meta = {
  title: "Display/Note",
  component: Note,
  args: { children: "Для двох. І без поспіху." },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Note>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
