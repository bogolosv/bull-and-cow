# Vercel + Cloudflare

Frontend розміщено на Vercel, а ігровий сервер — у Cloudflare. Нижче описані первинне налаштування та автоматичні оновлення.

## 1. GitHub і Vercel

Відправте потрібні коміти на GitHub, створіть Vercel Project з цього репозиторію. Root Directory залиште коренем репозиторію. `vercel.json` задає Next.js, установлення через pnpm, збірку `next build apps/web` та Output Directory `apps/web/.next`.

Виберіть Node.js 22.x. Використовуйте версію pnpm із `packageManager` у кореневому `package.json`; за потреби увімкніть Corepack через `ENABLE_EXPERIMENTAL_COREPACK=1` у Vercel. Не замінюйте збірку на статичний експорт: застосунок використовує серверне визначення мови.

Production URL проєкту: https://bull-and-cow.vercel.app. Ця адреса вже додана до дозволених origins Cloudflare. Перша публікація без WebSocket URL покаже помилку сервера; фінальну збірку виконайте після кроку 2.

Vercel Hobby призначений для особистих некомерційних проєктів. Перед комерційним запуском перевірте актуальні умови та квоти обох платформ.

## 2. Cloudflare Worker

Авторизуйте Wrangler локально (токени не додаються у Git):

```sh
pnpm exec wrangler login
```

У `apps/cloudflare-server/wrangler.jsonc` значення `env.production.vars.ALLOWED_ORIGINS` уже містить production origin Vercel **без завершального `/`**. Якщо адреса зміниться, оновіть його. Кілька адрес розділяються комами. Не ставте `*` і не дозволяйте весь `*.vercel.app`: чужі проєкти не повинні відкривати ігрові з’єднання. Preview URL додавайте явно, лише якщо потрібні.

```json
"vars": {
  "ALLOWED_ORIGINS": "https://bull-and-cow.vercel.app"
}
```

За наявності кількох Cloudflare-акаунтів задайте `CLOUDFLARE_ACCOUNT_ID` у середовищі перед запуском. Потім:

```sh
pnpm typecheck:cloudflare
pnpm test:cloudflare
pnpm build:cloudflare
pnpm deploy:cloudflare
```

Остання команда публікує Worker. Міграція `v1` створює SQLite-backed Durable Object, доступний у Workers Free. Порожній список production origins блокує всі ігрові підключення.

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

Frontend оновлюється через Git-інтеграцію Vercel. Workflow `.github/workflows/deploy-cloudflare.yml` публікує Worker після кожного push у `main`, якщо перевірка типів, тести Durable Objects і пробна збірка пройшли успішно. Він використовує Node.js 22, версію pnpm із `package.json` і Wrangler із lockfile. Публікації виконуються послідовно, без переривання поточної.

### Одноразове налаштування GitHub Actions

1. У [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) створіть токен за шаблоном **Edit Cloudflare Workers**, обмеживши Account Resources акаунтом цієї гри. Токен збережіть одразу в GitHub, не в репозиторії та не в чаті.
2. У GitHub відкрийте репозиторій → **Settings → Secrets and variables → Actions → New repository secret**.
3. Додайте два repository secrets:
   - `CLOUDFLARE_API_TOKEN` — створений токен Cloudflare.
   - `CLOUDFLARE_ACCOUNT_ID` — ID акаунта з Cloudflare Dashboard або `pnpm exec wrangler whoami`. Це ID акаунта, а не Worker чи Zone ID.
4. Закомітьте й відправте workflow у `main`. У вкладці **Actions → Deploy Cloudflare** перевірте результат.
5. Для ручного повторного запуску виберіть **Run workflow → main**. Запуски з інших гілок не публікують production.

Без секретів workflow покаже явну помилку перед публікацією. Локальний `wrangler login` не авторизує GitHub Actions. Ручна команда `pnpm deploy:cloudflare` також залишається доступною.

Vercel і Cloudflare публікуються незалежно: збій перевірок Worker не зупиняє збірку Vercel. Зміни протоколу мають залишатися сумісними між версіями; стара встановлена PWA може певний час використовувати попередній клієнт.

Довідка: [Cloudflare — GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

Стан ігор зберігається в Durable Object, але це не довічна історія матчів: секрети видаляються після результату, порожні кімнати очищаються. Імена binding, класу, міграцій та `public-v1` є частиною адресації сховища — не змінюйте їх як косметичний рефакторинг.

Деталі поточних лімітів і локальної перевірки: [Cloudflare README](apps/cloudflare-server/README.md).
