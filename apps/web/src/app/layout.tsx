import "./global.css";
import type { Viewport } from "next";
export const viewport: Viewport = {
  themeColor: "#faf8fd",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
import { GameProvider } from "../components/game-provider";
import { I18nProvider } from "@bull-and-cow/i18n/react";
import { getMessages } from "@bull-and-cow/i18n";
import { getRequestLocale } from "../lib/locale";
export async function generateMetadata() {
  const { app } = getMessages(await getRequestLocale());
  return {
    title: app.metaTitle,
    description: app.metaDescription,
    applicationName: "Bull & Cow",
    appleWebApp: {
      capable: true,
      title: "Bull & Cow",
      statusBarStyle: "default" as const,
    },
    icons: {
      apple: "/icons/apple-touch-icon.png",
      icon: "/icons/icon-192.png",
    },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getRequestLocale();
  return (
    <html lang={locale}>
      <head>
        <meta
          name="google-adsense-account"
          content="ca-pub-2000177386752711"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2000177386752711"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <I18nProvider initialLocale={locale}>
          <GameProvider>{children}</GameProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
