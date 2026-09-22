import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale } from "@bull-and-cow/i18n";
export async function getRequestLocale() {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    headerStore.get("accept-language") || "",
  );
}
