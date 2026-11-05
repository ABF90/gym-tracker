import type { Locale } from "./i18n";

// Gregorian calendar and Latin digits in both languages keep numbers easy to read on gauges.
const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-u-ca-gregory-nu-latn" : "en-GB");

/** Today's date in the user's local time zone as YYYY-MM-DD (not UTC). */
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses a YYYY-MM-DD string as a local calendar date. */
export function parseLocalDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(value: string, days: number) {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return localDateString(date);
}

export function formatDate(value: string | Date, locale: Locale, style: "long" | "short" = "short") {
  const date = typeof value === "string" ? parseLocalDate(value) : value;
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: style === "long" ? "long" : undefined,
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(date);
}

/** 754 → "12:34"; 3754 → "1:02:34". */
export function formatClock(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Human duration such as "25 min" / "1 h 05 min". */
export function formatDuration(totalSeconds: number, locale: Locale) {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const hu = locale === "ar" ? "س" : "h";
  const mu = locale === "ar" ? "د" : "min";
  const su = locale === "ar" ? "ث" : "s";
  if (h > 0) return `${h} ${hu} ${String(m).padStart(2, "0")} ${mu}`;
  if (m > 0) return sec ? `${m} ${mu} ${sec} ${su}` : `${m} ${mu}`;
  return `${sec} ${su}`;
}

/** Trims trailing zeros: 12 → "12", 12.5 → "12.5", 12.25 → "12.25". */
export function formatNumber(value: number, maxFractionDigits = 2) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxFractionDigits,
    useGrouping: true,
  }).format(value);
}

export function newId() {
  return crypto.randomUUID();
}
