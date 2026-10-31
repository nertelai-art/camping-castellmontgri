import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AccommodationExplorer } from "@/components/site/accommodation-explorer";
import { AnchorSettle } from "@/components/site/anchor-settle";
import { Hero } from "@/components/site/hero";
import { Directions } from "@/components/site/directions";
import { Explore } from "@/components/site/explore";
import { GalleryPreview } from "@/components/site/gallery-preview";
import { CampgroundJsonLd } from "@/components/site/json-ld";
import { TripPlanner } from "@/components/site/trip-planner";
import type { Place } from "@/components/site/map-explorer";
import { MapSection } from "@/components/site/map-section";
import { RevealOnScroll } from "@/components/site/reveal-on-scroll";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Testimonials } from "@/components/site/testimonials";
import { Welcome } from "@/components/site/welcome";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";
import {
  getAccommodationCategories,
  getActivities,
  getMapPoints,
  getMediaByFolder,
  getRestaurants,
  getSections,
  getServices,
  getSiteSettings,
  getTestimonials,
  type Section,
} from "@/lib/supabase/content";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, settings, sections, categories, services, restaurants, activities, testimonials, accreditations, mapPoints, flags] =
    await Promise.all([
      getTranslations("accommodation"),
      getSiteSettings(locale),
      getSections(locale),
      getAccommodationCategories(locale),
      getServices(locale),
      getRestaurants(locale),
      getActivities(locale),
      getTestimonials(),
      getMediaByFolder("accreditations", locale),
      getMapPoints(locale),
      getMediaByFolder("flags", locale),
    ]);

  const accommodationCount = categories.reduce((n, c) => n + c.accommodations.length, 0);

  // Fitxes del plànol: el que cal mostrar de cada lloc enllaçat (sense repetir consultes).
  const places: Record<string, Place> = {};
  for (const s of services) places[`service:${s.slug}`] = { name: s.name, description: s.description, hours: null, image: s.media };
  for (const r of restaurants) places[`restaurant:${r.slug}`] = { name: r.name, description: r.description, hours: r.hours, image: r.cover };
  for (const a of activities) places[`activity:${a.slug}`] = { name: a.name, description: a.description, hours: a.hours, image: a.cover };
  for (const c of categories) {
    places[`category:${c.key}`] = { name: c.name, description: c.description, hours: null, image: c.media };
    for (const a of c.accommodations) places[`accommodation:${a.slug}`] = { name: a.name, description: a.description, hours: null, image: a.cover };
  }
  // Què té punt al plànol, perquè els botons «Veure al plànol» només surtin quan porten a algun lloc.
  const onMap = new Set(mapPoints.flatMap((p) => (p.target ? [`${p.target.type}:${p.target.slug}`] : [])));

  // El que té pàgina pròpia, a la portada només és una porta.
  const explore = [
    { href: "/services", section: sections.services },
    { href: "/entertainment", section: sections.entertainment },
    { href: "/gastronomy", section: sections.gastronomy },
    { href: "/surroundings", section: sections.surroundings },
  ].filter((item): item is { href: string; section: Section } => Boolean(item.section));

  // Numeració de guia de camp: només compten les seccions que surten.
  let n = 0;
  const next = () => ++n;

  return (
    <>
      <CampgroundJsonLd settings={settings} url={`${siteUrl}/${locale}`} image={sections.hero?.media?.src} />
      <SiteHeader settings={settings} locale={locale} flags={flags} />
      <main id="main">
        {sections.hero && <Hero section={sections.hero} settings={settings} />}

        {sections.welcome && (
          <Welcome
            section={sections.welcome}
            facts={{
              accommodations: accommodationCount,
              restaurants: restaurants.length,
              services: services.length,
              activities: activities.length,
            }}
          />
        )}

        {sections.accommodation && (
          <section data-edit="sections:accommodation" aria-labelledby="accommodation-title" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            {/* Només una frase: el text llarg d'aquesta secció és el mateix que el dels mobile homes, i la gent ve a triar. */}
            <div id="accommodation">
              <SectionHeading
                id="accommodation-title"
                index={next()}
                eyebrow={t("eyebrow")}
                title={sections.accommodation.title}
                highlight={sections.accommodation.highlight}
                body={sections.accommodation.highlight ? null : sections.accommodation.body}
              />
            </div>
            <AccommodationExplorer
              categories={categories}
              bookingUrl={settings.bookingUrl}
              allHref={`/${locale}/accommodations`}
              onMap={[...onMap].filter((k) => k.startsWith("accommodation:") || k.startsWith("category:"))}
            />
          </section>
        )}

        <Explore index={next()} items={explore} />
        {sections.gallery && <GalleryPreview section={sections.gallery} index={next()} />}

        {sections["map"] && <MapSection section={sections["map"]} points={mapPoints} places={places} index={next()} />}
        <Directions settings={settings} photo={sections.surroundings?.media ?? null} index={next()} />
        <TripPlanner camping={settings.brandName} place={settings.address.locality} url={`${siteUrl}/${locale}`} index={next()} />
        <Testimonials testimonials={testimonials} index={next()} />
      </main>
      <SiteFooter settings={settings} accreditations={accreditations} locale={locale} />
      <RevealOnScroll />
      <AnchorSettle />
    </>
  );
}
