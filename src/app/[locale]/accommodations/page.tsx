import type { Metadata } from "next";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AccommodationExplorer } from "@/components/site/accommodation-explorer";
import { RevealOnScroll } from "@/components/site/reveal-on-scroll";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { routing } from "@/i18n/routing";
import { getAccommodationCategories, getMediaByFolder, getSections, getSiteSettings } from "@/lib/supabase/content";

// Tots els allotjaments, en una pàgina a part: a la portada, al mòbil, només se n'ensenyen uns quants.

export async function generateMetadata({ params }: PageProps<"/[locale]/accommodations">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [{ brandName }, sections] = await Promise.all([getSiteSettings(locale), getSections(locale)]);
  const section = sections.accommodation;
  return {
    title: section ? `${section.title} · ${brandName}` : brandName,
    description: section?.body?.split("\n\n")[0] ?? undefined,
    alternates: {
      canonical: `/${locale}/accommodations`,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}/accommodations`])), "x-default": `/${routing.defaultLocale}/accommodations` },
    },
  };
}

export default async function Accommodations({ params }: PageProps<"/[locale]/accommodations">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, settings, sections, categories, accreditations, flags] = await Promise.all([
    getTranslations("accommodation"),
    getSiteSettings(locale),
    getSections(locale),
    getAccommodationCategories(locale),
    getMediaByFolder("accreditations", locale),
    getMediaByFolder("flags", locale),
  ]);
  const section = sections.accommodation;
  if (!section) notFound();

  return (
    <>
      <SiteHeader settings={settings} locale={locale} flags={flags} home={false} />
      <main id="main">
        <section data-edit="sections:accommodation" aria-labelledby="accommodation-title" className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-32 lg:pt-14">
          <Link href={`/${locale}#accommodation`} className="inline-flex items-center gap-2 text-base font-bold text-terra hover:underline">
            <span aria-hidden="true">←</span>
            {t("backHome")}
          </Link>
          <div className="mt-8">
            <SectionHeading id="accommodation-title" index={1} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} level={1} />
          </div>
          {/* Aquí no hi ha mapa: «Veure al mapa» no hi porta enlloc. */}
          <AccommodationExplorer categories={categories} bookingUrl={settings.bookingUrl} onMap={[]} mapLinks={false} />
        </section>
      </main>
      <SiteFooter settings={settings} accreditations={accreditations} locale={locale} />
      <RevealOnScroll />
    </>
  );
}
