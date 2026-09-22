import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionHeading } from "./section-heading";

const meta = {
  title: "Layouts/SectionHeading",
  component: SectionHeading,
  args: { children: "Вільні кімнати", count: 2 },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
