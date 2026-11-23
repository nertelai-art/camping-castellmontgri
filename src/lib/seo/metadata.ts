// Les metadades de cada pàgina per als cercadors i les xarxes: el títol, una descripció neta, la URL canònica, els idiomes
// i la targeta de quan es comparteix. Un sol lloc, perquè cada pàgina digui el mateix de la mateixa manera.

import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

/** El text sense marques: ni la **negreta** ni els «## » de títol, i tot en una línia. */
export const plainText = (text: string) =>
  text
    .replace(/\*\*/g, "")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * La descripció per a Google: el primer paràgraf que no és un títol, net i tallat per una paraula (uns 160 caràcters, el que
 * Google ensenya). Sense text, res: la pàgina es queda amb la descripció general del web.
 */
export function metaDescription(text: string | null | undefined, max = 160): string | undefined {
  const first = (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^#{1,3}\s/.test(p));
  if (!first) return undefined;
  const plain = plainText(first);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max / 2 ? cut.lastIndexOf(" ") : cut.length).replace(/[\s,;:.]+$/, "")}…`;
}

/** Com diu cada idioma Open Graph (Facebook, WhatsApp, LinkedIn). */
const OG_LOCALES: Record<Locale, string> = { es: "es_ES", ca: "ca_ES", fr: "fr_FR", en: "en_GB", nl: "nl_NL" };

/** L'adreça d'una pàgina sense l'idioma («», «services», «accommodations/bungalow-x») en un idioma. */
const href = (locale: string, path: string) => (path ? `/${locale}/${path}` : `/${locale}`);

type PageInput = { locale: Locale; path: string; title: string; description?: string | null; image?: string | null; siteName: string };

/** Les metadades d'una pàgina del web en un idioma: canònica, alternatives per idioma i la targeta per compartir. */
export function pageMetadata({ locale, path, title, description, image, siteName }: PageInput): Metadata {
  const url = href(locale, path);
  return {
    title,
    description: description ?? undefined,
    alternates: {
      canonical: url,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, href(l, path)])), "x-default": href(routing.defaultLocale, path) },
    },
    openGraph: {
      type: "website",
      siteName,
      title,
      description: description ?? undefined,
      url,
      locale: OG_LOCALES[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => OG_LOCALES[l]),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title, description: description ?? undefined, images: image ? [image] : undefined },
  };
}
