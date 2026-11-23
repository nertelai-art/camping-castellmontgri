import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { MapTeaser } from "@/components/site/map-teaser";
import { routing } from "@/i18n/routing";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteUrl } from "@/lib/site-url";
import { getSections, getSiteSettings } from "@/lib/supabase/content";
import { body, display } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [{ seo, brandName }, sections] = await Promise.all([getSiteSettings(locale), getSections(locale)]);
  return {
    metadataBase: new URL(siteUrl),
    ...pageMetadata({ locale, path: "", title: seo.title, description: seo.description, image: sections.hero?.media?.src, siteName: brandName }),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}>
      <body>
        <NextIntlClientProvider>
          {children}
          {/* El mapa flotant surt a totes les pàgines. */}
          <MapTeaser />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
