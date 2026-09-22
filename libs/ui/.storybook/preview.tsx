import { localizeSamples } from "./localize-samples";
import { I18nProvider } from "@bull-and-cow/i18n/react";
import { getMessages, isLocale, formatCount } from "@bull-and-cow/i18n";
import type { Preview } from "@storybook/react-vite";
import "../src/styles/index.css";

const preview: Preview = {
  initialGlobals: { locale: "uk" },
  globalTypes: {
    locale: {
      description: "Language",
      toolbar: {
        icon: "globe",
        items: [
          { value: "uk", title: "Українська" },
          { value: "en", title: "English" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const locale = isLocale(context.globals.locale)
        ? context.globals.locale
        : "uk";
      const messages = getMessages(locale);
      const name = context.title
        .split("/")
        .slice(-1)[0] as keyof typeof messages.ui;
      const labels = messages.ui[name];
      const extra =
        name === "Countdown"
          ? {
              label: `${messages.ui.Countdown.label} ${formatCount(locale, Number(context.args.seconds), "second")}`,
            }
          : name === "MatchResult"
            ? {
                attemptsText: formatCount(
                  locale,
                  Number(context.args.attempts),
                  "attempt",
                ),
              }
            : name === "HelpPopover"
              ? {
                  label: messages.app.help,
                  title: messages.app.lobbyHelpTitle,
                  children: (
                    <p>
                      {messages.app.bullRule} {messages.app.cowRule}
                    </p>
                  ),
                }
              : {};
      return (
        <I18nProvider initialLocale={locale} persist={false}>
          <Story
            args={{
              ...localizeSamples(context.args, locale),
              ...(labels ? { labels } : {}),
              ...extra,
            }}
          />
        </I18nProvider>
      );
    },
  ],
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    controls: { matchers: { color: /(background|color)$/i } },
    options: {
      storySort: {
        order: [
          "Foundations",
          "Actions",
          "Forms",
          "Display",
          "Feedback",
          "Game",
          "Layouts",
        ],
      },
    },
    a11y: { test: "todo" },
    docs: { codePanel: true },
  },
};
export default preview;
