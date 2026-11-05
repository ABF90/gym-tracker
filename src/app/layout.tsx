import type { Metadata, Viewport } from "next";
import { Readex_Pro } from "next/font/google";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, dirOf, isLocale, LOCALE_COOKIE } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/provider";
import { ToastProvider } from "@/components/ui/toast";
import { SyncProvider } from "@/lib/sync/provider";
import "./globals.css";

const readex = Readex_Pro({
  variable: "--font-readex",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gym Tracker",
  description: "Premium resistance and cardio training tracker",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(stored) ? stored : DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={dirOf(locale)} className={`${readex.variable} h-full`}>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale}>
          <ToastProvider>
            <SyncProvider>{children}</SyncProvider>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
