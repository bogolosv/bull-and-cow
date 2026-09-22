import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormStack } from "./form-stack";
import { TextField } from "../text-field";
import { Button } from "../button";

const meta = {
  title: "Layouts/FormStack",
  component: FormStack,
  args: {
    children: (
      <>
        <TextField label="Ім’я" />
        <Button>Зберегти</Button>
      </>
    ),
  },
  parameters: {},
  decorators: [
    (Story) => (
      <div style={{ width: "min(24rem, calc(100vw - 3rem))" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FormStack>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
