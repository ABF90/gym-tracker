"use client";

import { createContext, use, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, dirOf, LOCALE_COOKIE, type Dictionary, type Locale } from ".";

type I18nValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const router = useRouter();

  const setLocale = useCallback(
    (next: Locale) => {
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      document.documentElement.dir = dirOf(next);
      router.refresh();
    },
    [router],
  );

  return (
    <I18nContext value={{ locale, dir: dirOf(locale), t: dictionaries[locale], setLocale }}>
      {children}
    </I18nContext>
  );
}

export function useI18n() {
  const value = use(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return value;
}
