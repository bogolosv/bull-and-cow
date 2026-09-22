import type { Meta, StoryObj } from "@storybook/react-vite";
import { colorTokens, spaceTokens } from "./token-catalog";
import { Button } from "../components/button";
import styles from "./foundations.module.css";

function Foundations() {
  return (
    <article className={styles.catalog}>
      <h1>Дизайн-токени</h1>
      <p>
        Змінні CSS — єдине джерело кольору, типографіки, відступів, радіусів,
        тіней і руху. Компоненти використовують семантичні ролі.
      </p>
      <h2>Кольори</h2>
      <div className={styles.swatches}>
        {colorTokens.map((token) => (
          <div key={token}>
            <div
              className={styles.swatch}
              style={{ background: `var(--color-${token})` }}
            />
            <code>--color-{token}</code>
          </div>
        ))}
      </div>
      <h2>Відступи</h2>
      <div className={styles.spaces}>
        {spaceTokens.map((token) => (
          <div key={token}>
            <code>--space-{token}</code>
            <span style={{ width: `var(--space-${token})` }} />
          </div>
        ))}
      </div>
      <h2>Типографіка</h2>
      {[11, 14, 18, 28, 35].map((size) => (
        <p key={size} style={{ fontSize: `var(--font-size-${size})` }}>
          Бики та корови · {size}
        </p>
      ))}
      <h2>Локальна тема</h2>
      <p>Перевизначення семантичних токенів не потребує змін у компонентах.</p>
      <div className={styles.themeDemo}>
        <Button>Стандартна тема</Button>
        <div className={styles.warmTheme}>
          <Button>Тепла тема</Button>
        </div>
      </div>
    </article>
  );
}
const meta = {
  title: "Foundations/Tokens",
  component: Foundations,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Foundations>;
export default meta;
export const Catalog: StoryObj<typeof meta> = {};
