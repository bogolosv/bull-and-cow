# Bull & Cow UI kit

The React components used by the application, with their real styles and states available in Storybook. Components receive data, labels and callbacks through props; they do not import Next.js, WebSocket, server types or `GameProvider`.

## Explore and check

Run from the repository root after installing dependencies:

```sh
pnpm storybook             # http://localhost:6006
pnpm build-storybook       # dist/storybook/ui
pnpm typecheck:ui
pnpm test:ui-isolation
```

Storybook includes Foundations, Actions, Forms, Display, Feedback, Game and Layouts, with Controls, Autodocs and an accessibility panel. Composed game screens run without a server. Examples include long names, errors, loading/disabled controls, an empty lobby, secret selection and match results.

Button, field and popover stories include `play` interactions for clicks, input, disabled behavior and keyboard controls. These run when the corresponding story is opened. The accessibility addon helps inspect violations; it is not a blocking automated CI check.

## Usage

Import the global foundation once in the application root:

```tsx
import "@bull-and-cow/ui/styles/index.css";
import { Button, Panel, TextField } from "@bull-and-cow/ui";
```

In a component with application-owned state and callbacks:

```tsx
<Panel>
  <TextField
    label="Your name"
    value={name}
    onChange={(event) => setName(event.target.value)}
  />
  <Button onClick={createRoom} loading={pending}>
    Create a room
  </Button>
</Panel>
```

`Button` supports `primary`, `secondary`, `soft` and `ghost` variants; `small`, `medium` and `large` sizes; native button props; icons; and loading/disabled states. Loading prevents repeat clicks. Use `LinkButton` or an application-level router adapter for navigation.

`TextField` supports native input props, associated labels, error and disabled states, icons, `aria-invalid` and `aria-describedby`. Application code should obtain the example's labels from its dictionary.

## Component groups

| Group | Examples |
| --- | --- |
| Controls and feedback | `Button`, `LinkButton`, `TextField`, `HelpPopover`, `Alert`, `ConnectionStatus`, `LanguageSelect` |
| Layout and display | `Panel`, `Badge`, `Divider`, `GameLayout`, `FormStack`, `SectionHeading`, `StatusArea`, `Note` |
| Lobby | `Mascot`, `GameTitle`, `RoomHeading`, `RoomCard`, `RoomList`, `PlayerCard`, `PlayerPair`, `EmptyState` |
| Preparation | `SecretCodeInput`, `SecretCodePreview`, `ReadinessIndicator`, `Countdown`, `WaitingDots` |
| Match | `GuessRow`, `TurnIndicator`, `GameTimer`, `SurrenderControl`, `MatchResult`, `RematchControl` |

The [public exports](src/index.ts) are the source of truth for available components and types.

`Countdown` receives seconds and progress from 0 to 1; time synchronization stays in the application. `GameLayout` accepts a toolbar slot without depending on game context. `SecretCodeInput` is controlled and highlights duplicate digits. `SecretCodePreview` reveals the code for three seconds and hides it on window blur.

`GameTimer` displays remaining time, pauses and the last-five-seconds accent. `RematchControl` displays the series score and rematch/leave actions. `MatchResult` supports completion reasons and an actions slot. Validation and game decisions belong to the server and application, not these presentation components.

## Design tokens

[src/styles/tokens.css](src/styles/tokens.css) is the source of reusable values:

- OKLCH colors and semantic properties such as `--color-canvas`, `--color-ink`, `--color-accent` and `--color-danger`.
- `--space-*` spacing in rem and `--size-*` element dimensions.
- `--font-*`, `--radius-*`, `--shadow-*`, `--motion-*` and `--opacity-*` scales.

Semantic values can be overridden on a container. **Foundations / Tokens** demonstrates them; `token-catalog.ts` lists token names without duplicating their values. Breakpoints remain literal values in media queries. SVG coordinates remain local to their illustrations. Decorative motion respects `prefers-reduced-motion`.

## Component isolation

Each component owns its source, CSS Module, stories and entry point:

```text
src/components/button/
  button.tsx
  button.module.css
  button.stories.tsx
  index.ts
```

Keep component-specific hooks and helpers in that directory. Compose through public props and slots rather than importing another component's styles or addressing its internal classes. Shared tokens and the reset live in `src/styles`; composed screen stories live in `src/patterns`.

To add a component, create its directory, export it through the local `index.ts` and [public entry point](src/index.ts), then add stories covering relevant states. Prefer an existing token before adding a new semantic value. `test:ui-isolation` checks folder structure, local style imports, class usage and independence from the application.

## Localization

Components with built-in text receive a required `labels` prop. The application selects the dictionary, including accessible labels. `LanguageSelect` receives its value, options and callback; it does not manage locale persistence.

Storybook provides a language toolbar and adapters for localized examples. See [localization](../i18n/README.md) for dictionary ownership and [architecture](../../docs/architecture.md) for the application boundaries.
