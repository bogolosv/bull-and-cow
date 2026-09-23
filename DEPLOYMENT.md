# Vercel + Cloudflare

Проєкт підготовлений локально. Наведені нижче кроки виконуються пізніше власником акаунтів; репозиторій сам не створює платні ресурси й не публікує застосунок.

## 1. GitHub і Vercel

Відправте потрібні коміти на GitHub, створіть Vercel Project з цього репозиторію. Root Directory залиште коренем репозиторію. `vercel.json` задає Next.js, установлення через pnpm, збірку `next build apps/web` та Output Directory `apps/web/.next`.

Виберіть Node.js 22.x. Використовуйте версію pnpm із `packageManager` у кореневому `package.json`; за потреби увімкніть Corepack через `ENABLE_EXPERIMENTAL_COREPACK=1` у Vercel. Не замінюйте збірку на статичний експорт: застосунок використовує серверне визначення мови.

Запишіть стабільний production URL проєкту, наприклад `https://YOUR-PROJECT.vercel.app`. Він потрібен для Cloudflare. Перша публікація без WebSocket URL покаже помилку сервера; фінальну збірку виконайте після кроку 2.

Vercel Hobby призначений для особистих некомерційних проєктів. Перед комерційним запуском перевірте актуальні умови та квоти обох платформ.

## 2. Cloudflare Worker

Авторизуйте Wrangler локально (токени не додаються у Git):

```sh
pnpm exec wrangler login
```

У `apps/cloudflare-server/wrangler.jsonc` замініть порожній `env.production.vars.ALLOWED_ORIGINS` на точний production origin Vercel **без завершального `/`**. Кілька адрес розділяються комами. Не ставте `*` і не дозволяйте весь `*.vercel.app`: чужі проєкти не повинні відкривати ігрові з’єднання. Preview URL додавайте явно, лише якщо потрібні.

```json
"vars": {
  "ALLOWED_ORIGINS": "https://YOUR-PROJECT.vercel.app"
}
```

За наявності кількох Cloudflare-акаунтів задайте `CLOUDFLARE_ACCOUNT_ID` у середовищі перед запуском. Потім:

```sh
pnpm typecheck:cloudflare
pnpm test:cloudflare
pnpm build:cloudflare
pnpm deploy:cloudflare
```

Остання команда публікує Worker. Міграція `v1` створює SQLite-backed Durable Object, доступний у Workers Free. Порожній список production origins навмисно блокує всі ігрові підключення, доки ви не задасте адресу сайту.

Wrangler покаже адресу `https://bull-cow-game.YOUR-SUBDOMAIN.workers.dev`. Перевірте `/health`: очікується `{"status":"ok"}`. Власний домен для початку не потрібен.

## 3. З’єднати сервіси

У Vercel → Project → Settings → Environment Variables додайте для Production:

```dotenv
NEXT_PUBLIC_WS_URL=wss://bull-cow-game.YOUR-SUBDOMAIN.workers.dev
```

Значення публічне й вбудовується у клієнт **під час збірки**, тому після зміни виконайте Redeploy. Не використовуйте `ws://` або `localhost` у публічній HTTPS-версії. Для Preview задайте URL окремо й додайте точний origin у Cloudflare.

Після redeploy перевірте:

- створення та приєднання з двох браузерів;
- загадування, 30 секунд на хід, здачу й реванш;
- закриття вкладки та повернення за тим самим посиланням протягом 30 секунд;
- встановлення PWA на пристрої й екран без інтернету.

## Оновлення

Frontend можна оновлювати через Git-інтеграцію Vercel. Worker публікується окремо командою `pnpm deploy:cloudflare`. Зміни протоколу потрібно узгоджувати між сервісами; стара встановлена PWA може певний час використовувати попередній клієнт.

Стан ігор зберігається в Durable Object, але це не довічна історія матчів: секрети видаляються після результату, порожні кімнати очищаються. Імена binding, класу, міграцій та `public-v1` є частиною адресації сховища — не змінюйте їх як косметичний рефакторинг.

Деталі поточних лімітів і локальної перевірки: [Cloudflare README](apps/cloudflare-server/README.md).
