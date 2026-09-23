# Localization

Typed Ukrainian and English dictionaries, locale negotiation and React bindings. Game URLs and protocol messages are independent of the selected language.

## Dictionaries and locale selection

[uk.ts](src/uk.ts) defines the `Messages` type; [en.ts](src/en.ts) is checked with `satisfies Messages`. Text is grouped into `app`, component-specific `ui` labels and protocol `errors`.

`resolveLocale` prefers the `bull-cow-locale` cookie, then supported languages from `Accept-Language`, respecting quality weights. Ukrainian is the fallback. Next.js resolves the initial locale on the server for HTML and metadata.

## React usage

`I18nProvider` and `useI18n` are exported from `@bull-and-cow/i18n/react`. Wrap the application with a provider using the server-resolved `initialLocale`.

```tsx
import { useState } from "react";
import { useI18n } from "@bull-and-cow/i18n/react";
import { SecretCodeInput } from "@bull-and-cow/ui";

export function CodeField() {
  const { messages } = useI18n();
  const [code, setCode] = useState("");
  return (
    <SecretCodeInput
      labels={messages.ui.SecretCodeInput}
      value={code}
      onChange={setCode}
    />
  );
}
```

Use this example within a client component. `useI18n` also exposes `locale` and `setLocale`. Manual selection is saved in a cookie for one year. Switching languages updates context, `html.lang`, the document title and description without reloading, remounting the game or reconnecting its WebSocket.

The [UI kit](../ui/README.md) receives translated labels through props and does not import this library. Storybook-only adapters supply dictionaries and localized sample data from the language toolbar.

## Errors and numbers

Servers send stable codes, for example `{ type: "error", payload: { code: "NOT_YOUR_TURN" } }`. The client translates a code when rendering, so an existing error updates when the language changes. Player names and secret codes are not translated.

`formatCount` uses `Intl.PluralRules` and `Intl.NumberFormat` for attempts and seconds. Use plural-aware formatting for new numeric messages instead of joining a number to a single noun form.

## Adding a language

1. Add a dictionary satisfying `Messages`.
2. Extend `Locale`, `isLocale`, `getMessages` and plural forms in [src/index.ts](src/index.ts).
3. Add the locale to the application and Storybook selectors.
4. Update locale negotiation and pluralization tests for the new language.

Run from the repository root:

```sh
pnpm test:i18n
pnpm typecheck
```

Tests check dictionary parity, protocol error coverage, locale selection and plural forms.
