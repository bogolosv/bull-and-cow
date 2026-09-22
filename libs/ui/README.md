# Bull & Cow UI kit

Бібліотека React-компонентів, яку використовує застосунок. Storybook показує ті самі компоненти та стилі, а не їхні копії. UI не імпортує Next.js, WebSocket, серверні типи чи `GameProvider`: дані й обробники передаються через props.

## Запуск

```sh
npm run storybook          # http://localhost:6006
npm run build-storybook    # dist/storybook/ui
npm run typecheck:ui
```

Nx-еквіваленти: `npx nx storybook ui`, `npx nx build-storybook ui`, `npx nx typecheck ui`.

## Використання

Імпортуйте глобальну основу один раз у кореневому layout:

```tsx
import '@bull-and-cow/ui/styles/index.css';
import { Button, Panel, TextField } from '@bull-and-cow/ui';

<Panel>
  <TextField label="Ім’я" value={name} onChange={event => setName(event.target.value)} />
  <Button onClick={createRoom} loading={pending}>Створити кімнату</Button>
</Panel>
```

`Button`: варіанти `primary`, `secondary`, `soft`, `ghost`; розміри `small`, `medium`, `large`; нативні button props, іконки, loading і disabled. Loading блокує повторне натискання. Для навігації використовуйте `LinkButton` або адаптер роутера на рівні застосунку.

`TextField`: нативні input props, автоматичний зв’язок label/input, стани disabled/error, іконки, `aria-invalid` і `aria-describedby`.

Інші компоненти: `Badge`, `Panel`, `Divider`, `HelpPopover`, `ConnectionStatus`, `Alert`, `Countdown`, `WaitingDots`, `Mascot`, `PlayerCard`, `RoomCard`, `EmptyState`, `GameTitle`, `RoomHeading`, `SecretCodeInput`, `SecretCodePreview`, `ReadinessIndicator`. Композиція: `GameLayout`, `FormStack`, `SectionHeading`, `RoomList`, `PlayerPair`, `StatusArea`, `Note`.

`Countdown` отримує секунди й прогрес 0–1. Він лише відображає стан: джерело часу й синхронізація залишаються в застосунку. `GameLayout` отримує toolbar через слот, не залежить від контексту гри.

## Дизайн-токени

Єдине джерело значень — `src/styles/tokens.css`:

- Палітра OKLCH та семантичні CSS custom properties: `--color-canvas`, `--color-ink`, `--color-accent`, `--color-danger` тощо.
- `--space-*` — спільна шкала відступів у rem; `--size-*` — розміри елементів та ілюстрацій.
- `--font-*`, `--radius-*`, `--shadow-*`, `--motion-*`, `--opacity-*` — типографіка, форма, глибина, рух і стани.
- Семантичні значення можна перевизначити на контейнері без зміни компонента. Приклад є в **Foundations / Tokens**.
- Кожен компонент має власний CSS Module. Імпорт стилів іншого компонента або звернення до його внутрішніх класів заборонені; композиція відбувається тільки через публічні props і слоти.
- Breakpoints: 360px, 520px, 900px. Літерали залишені в media queries, оскільки CSS custom properties там не підтримуються. SVG-координати й геометрія ілюстрацій також залишаються локальними.
- `prefers-reduced-motion` вимикає декоративні анімації.

`token-catalog.ts` містить тільки назви змінних для каталогу; значення не дублюються в TypeScript.

## Storybook

Розділи: Foundations, Actions, Forms, Display, Feedback, Game, Layouts. Є Controls, Autodocs, вкладка доступності, приклади довгих імен, помилок, disabled/loading, порожнього лобі, очікування й відліку. Демонстраційні екрани працюють без сервера.

Stories кнопки, поля та підказки містять `play`-перевірки: натискання, блокування disabled, введення тексту, відкриття та закриття клавіатурою. Вони запускаються під час відкриття відповідної story. Accessibility addon показує порушення для подальшої роботи; він поки не є блокуючим CI-тестом.

Кожен компонент — окрема папка:

```text
src/components/button/
  button.tsx
  button.module.css
  button.stories.tsx
  index.ts
```

Локальні hooks, допоміжні функції та тести, якщо вони потрібні, також розміщуйте в папці компонента. Не об’єднуйте кілька компонентів в одному файлі. Спільними залишаються токени й базовий reset у `src/styles`; комбіновані приклади екранів зберігаються в `src/patterns`.

Новий компонент додавайте в `src/components/<name>`, експортуйте через локальний `index.ts` і публічний `src/index.ts`, додавайте `*.stories.tsx` зі станами. `npm run test:ui-isolation` перевіряє структуру, локальні CSS-імпорти, наявність класів та незалежність від застосунку. Спочатку використайте наявний токен; новий додавайте до `tokens.css` тільки за потреби нової семантичної ролі.

`SecretCodeInput` — контрольоване текстове поле з цифровою клавіатурою, чотирма плитками й підсвічуванням повторів. `SecretCodePreview` приховує код і дозволяє відкрити його на 3 секунди; при втраті фокусу вікном код знову приховується. `ReadinessIndicator` отримує лише статуси готовності. Серверні правила та підтвердження належать застосунку, а не UI kit.

Ігрові компоненти: `GuessRow` — анімована спроба з оцінкою; `TurnIndicator` — поточний хід; `SurrenderControl` — підтвердження/скасування здачі; `MatchResult` — перемога або поразка з причиною. Stories у `Game` та складені приклади `Layouts/Match` працюють без сервера.

## Мови

Компоненти з власними текстами отримують обов’язковий `labels` prop. Наприклад: `<RoomCard labels={messages.ui.RoomCard} playerName={name} />`. Словник обирає застосунок; сам UI не імпортує i18n і залишається ізольованим. `LanguageSelect` отримує значення, список опцій та callback. У Storybook мова перемикається через кнопку з глобусом; інтерактивні перевірки враховують обрану мову.
