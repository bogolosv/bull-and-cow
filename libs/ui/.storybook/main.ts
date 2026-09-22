import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  viteFinal: async (config) => ({
    ...config,
    resolve: {
      ...config.resolve,
      alias: {
        "@bull-and-cow/i18n/react": fileURLToPath(
          new URL("../../i18n/src/react.tsx", import.meta.url),
        ),
        "@bull-and-cow/i18n": fileURLToPath(
          new URL("../../i18n/src/index.ts", import.meta.url),
        ),
      },
    },
    server: { ...config.server, host: "127.0.0.1" },
  }),
};
export default config;
