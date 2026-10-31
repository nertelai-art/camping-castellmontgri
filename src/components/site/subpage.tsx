import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { routing, type Locale } from "@/i18n/routing";
import { getMediaByFolder, getSections, getSiteSettings } from "@/lib/supabase/content";
import { RevealOnScroll } from "./reveal-on-scroll";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

// El que tenen en comú les pàgines que surten d'una secció de la portada (gastronomia, entorn, galeria): el títol per a Google i l'embolcall.

export async function subpageMetadata(locale: string, path: string, sectionKey: string): Promise<Metadata> {
  if (!hasLocale(routing.locales, locale)) return {};
  const [{ brandName }, sections] = await Promise.all([getSiteSettings(locale), getSections(locale)]);
  const section = sections[sectionKey];
  return {
    title: section ? `${section.title} · ${brandName}` : brandName,
    description: section?.body?.split("\n\n")[0] ?? undefined,
    alternates: {
      canonical: `/${locale}/${path}`,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}/${path}`])), "x-default": `/${routing.defaultLocale}/${path}` },
    },
  };
}

export function assertLocale(locale: string): Locale {
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return locale;
}

export async function Subpage({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [t, settings, accreditations, flags] = await Promise.all([
    getTranslations("accommodation"),
    getSiteSettings(locale),
    getMediaByFolder("accreditations", locale),
    getMediaByFolder("flags", locale),
  ]);
  return (
    <>
      <SiteHeader settings={settings} locale={locale} flags={flags} home={false} />
      <main id="main">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-base font-bold text-terra hover:underline">
            <span aria-hidden="true">←</span>
            {t("backHome")}
          </Link>
        </div>
        {children}
      </main>
      <SiteFooter settings={settings} accreditations={accreditations} locale={locale} />
      <RevealOnScroll />
    </>
  );
}
