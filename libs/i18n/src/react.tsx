"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMessages, LOCALE_COOKIE, type Locale } from "./index";
const Context = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | null>(null);
export function I18nProvider({
  initialLocale,
  children,
  persist = true,
}: {
  initialLocale: Locale;
  children: ReactNode;
  persist?: boolean;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  useEffect(() => {
    updateLocale(initialLocale);
  }, [initialLocale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    if (persist) {
      document.title = getMessages(locale).app.metaTitle;
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", getMessages(locale).app.metaDescription);
    }
  }, [locale, persist]);
  function setLocale(next: Locale) {
    updateLocale(next);
    if (persist)
      document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  return (
    <Context.Provider value={{ locale, setLocale }}>
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("I18nProvider is required");
  return { ...value, messages: getMessages(value.locale) };
}
