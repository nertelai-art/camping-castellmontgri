import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { metaDescription, pageMetadata } from "@/lib/seo/metadata";
import { getAccreditations, getMediaByFolder, getSection, getSiteSettings } from "@/lib/supabase/content";
import { RevealOnScroll } from "./reveal-on-scroll";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

// El que tenen en comú les pàgines que surten d'una secció de la portada (gastronomia, entorn, galeria): el títol per a Google i l'embolcall.

export async function subpageMetadata(locale: string, path: string, sectionKey: string): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};
  const [{ brandName, seo }, section] = await Promise.all([getSiteSettings(locale), getSection(locale, sectionKey)]);
  return pageMetadata({
    locale,
    path,
    title: section ? `${section.title} · ${brandName}` : brandName,
    // Una secció sense text (la galeria) es queda amb la descripció general del web.
    description: metaDescription(section?.body) ?? seo.description,
    image: section?.media?.src,
    siteName: brandName,
  });
}

export function assertLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}

export async function Subpage({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [settings, accreditations, flags] = await Promise.all([
    getSiteSettings(locale),
    getAccreditations(locale),
    getMediaByFolder("flags", locale),
  ]);
  return (
    <>
      <SiteHeader settings={settings} locale={locale} flags={flags} home={false} />
      <main id="main">
        {children}
      </main>
      <SiteFooter settings={settings} accreditations={accreditations} locale={locale} />
      <RevealOnScroll />
    </>
  );
}
