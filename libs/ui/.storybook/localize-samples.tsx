import { cloneElement, isValidElement, type ReactNode } from "react";
import { uk, en, type Locale } from "@bull-and-cow/i18n";
// Localize demo content supplied to language-neutral primitives. Names and
// user-entered values are deliberately left untouched.
function textPairs(source: object, target: object): [string, string][] {
  return Object.entries(source).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[value, (target as Record<string, string>)[key]] as [string, string]]
      : textPairs(value, (target as Record<string, object>)[key]),
  );
}
const english = new Map<string, string>([
  ...textPairs(uk, en),
  ["← Вийти з кімнати", "← Leave room"],
  ["Введи ім’я гравця", "Enter a player name"],
  ["Місце для контенту", "Content goes here"],
  ["Контент по центру", "Centered content"],
  ["Ім’я", "Name"],
  ["Зберегти", "Save"],
]);
function content(value: ReactNode): ReactNode {
  if (typeof value === "string") return english.get(value) ?? value;
  if (Array.isArray(value)) return value.map(content);
  if (isValidElement<Record<string, unknown>>(value))
    return cloneElement(value, localizeSamples(value.props, "en"));
  return value;
}
export function localizeSamples(
  args: Record<string, unknown>,
  locale: Locale,
): Record<string, unknown> {
  if (locale === "uk") return args;
  const translated = { ...args };
  for (const key of [
    "children",
    "label",
    "placeholder",
    "error",
    "message",
    "title",
  ]) {
    if (key in args) translated[key] = content(args[key] as ReactNode);
  }
  return translated;
}
