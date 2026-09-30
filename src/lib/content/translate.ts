import { routing, type Locale } from "@/i18n/routing";

/** Idioma de reserva quan un text no està traduït: el castellà, que és el que el càmping sempre omple. */
export const FALLBACK_LOCALE: Locale = routing.defaultLocale;

/** Idiomes a demanar a la base de dades per a una pàgina: el de la pàgina i el de reserva. */
export const localesFor = (locale: Locale): Locale[] => (locale === FALLBACK_LOCALE ? [locale] : [locale, FALLBACK_LOCALE]);

/** Tria la traducció de l'idioma demanat o, si no n'hi ha, la de reserva. Mai deixa un buit si existeix l'espanyol. */
export function pickTranslation<T extends { locale: string }>(rows: readonly T[] | null | undefined, locale: Locale): T | null {
  if (!rows?.length) return null;
  return rows.find((r) => r.locale === locale) ?? rows.find((r) => r.locale === FALLBACK_LOCALE) ?? null;
}
