import "./global.css";
import { GameProvider } from "../components/game-provider";
import { I18nProvider } from "@bull-and-cow/i18n/react";
import { getMessages } from "@bull-and-cow/i18n";
import { getRequestLocale } from "../lib/locale";
export async function generateMetadata() {
  const { app } = getMessages(await getRequestLocale());
  return { title: app.metaTitle, description: app.metaDescription };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>
          <GameProvider>{children}</GameProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
