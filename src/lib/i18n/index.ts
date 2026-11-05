import { ar, type Dictionary } from "./ar";
import { en } from "./en";

export type Locale = "ar" | "en";
export type { Dictionary };

export const LOCALE_COOKIE = "gt-locale";
export const DEFAULT_LOCALE: Locale = "ar";

export const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}

export function dirOf(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Replaces {name} placeholders in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
}
