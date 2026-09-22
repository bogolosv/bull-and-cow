import { uk } from "./uk";
import { en } from "./en";
export { uk, en };
export type { Messages } from "./uk";
export const locales = ["uk", "en"] as const;
export type Locale = (typeof locales)[number];
export const LOCALE_COOKIE = "bull-cow-locale";
export function isLocale(value: unknown): value is Locale {
  return value === "uk" || value === "en";
}
export function getMessages(locale: Locale) {
  return locale === "en" ? en : uk;
}
export function resolveLocale(cookie?: string, acceptLanguage = ""): Locale {
  if (isLocale(cookie)) return cookie;
  const preferences = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return {
        language: tag.toLowerCase().split("-")[0],
        quality: q ? Number(q.trim().slice(2)) : 1,
        index,
      };
    })
    .filter((item) => item.quality > 0 && Number.isFinite(item.quality))
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  return (
    (preferences.find((item) => isLocale(item.language))?.language as Locale) ||
    "uk"
  );
}
export function formatCount(
  locale: Locale,
  count: number,
  kind: "attempt" | "second",
) {
  const category = new Intl.PluralRules(locale).select(count);
  const forms =
    locale === "uk"
      ? kind === "attempt"
        ? { one: "спроба", few: "спроби", many: "спроб", other: "спроби" }
        : { one: "секунда", few: "секунди", many: "секунд", other: "секунди" }
      : kind === "attempt"
        ? { one: "attempt", other: "attempts" }
        : { one: "second", other: "seconds" };
  const word = forms[category as keyof typeof forms] || forms.other;
  return `${new Intl.NumberFormat(locale).format(count)} ${word}`;
}
