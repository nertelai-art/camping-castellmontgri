import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AccommodationExplorer } from "@/components/site/accommodation-explorer";
import { Entertainment } from "@/components/site/entertainment";
import { Gastronomy } from "@/components/site/gastronomy";
import { Hero } from "@/components/site/hero";
import { CampgroundJsonLd } from "@/components/site/json-ld";
import type { Place } from "@/components/site/map-explorer";
import { MapSection } from "@/components/site/map-section";
import { Pools } from "@/components/site/pools";
import { RevealOnScroll } from "@/components/site/reveal-on-scroll";
import { SectionHeading } from "@/components/site/section-heading";
import { ServicesGrid } from "@/components/site/services-grid";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Surroundings } from "@/components/site/surroundings";
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
} from "@/lib/supabase/content";
import { getTranslations } from "next-intl/server";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, settings, sections, categories, services, restaurants, activities, testimonials, surroundingsPhotos, accreditations, mapPoints] =
    await Promise.all([
      getTranslations("accommodation"),
      getSiteSettings(locale),
      getSections(locale),
      getAccommodationCategories(locale),
      getServices(locale),
      getRestaurants(locale),
      getActivities(locale),
      getTestimonials(),
      getMediaByFolder("entorno", locale),
      getMediaByFolder("accreditations", locale),
      getMapPoints(locale),
    ]);

  const pools = services.find((s) => s.slug === "swimming-pools");
  const slides = services.find((s) => s.slug === "slides");
  const otherServices = services.filter((s) => s !== pools && s !== slides);
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

  // Numeració de guia de camp: només compten les seccions que surten.
  let n = 0;
  const next = () => ++n;

  return (
    <>
      <CampgroundJsonLd settings={settings} url={`${siteUrl}/${locale}`} image={sections.hero?.media?.src} />
      <SiteHeader settings={settings} locale={locale} />
      <main id="main">
        {sections.hero && <Hero section={sections.hero} settings={settings} locale={locale} />}

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
          <section aria-labelledby="accommodation-title" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
            <div id="accommodation" className="grid gap-8 lg:grid-cols-2 lg:items-end">
              <SectionHeading
                id="accommodation-title"
                index={next()}
                eyebrow={t("eyebrow")}
                title={sections.accommodation.title}
                body={sections.accommodation.body}
                highlight={sections.accommodation.highlight}
              />
              {sections["accommodation-intro"]?.body && (
                <p className="reveal max-w-xl text-muted lg:justify-self-end">{sections["accommodation-intro"].body.split("\n\n")[0]}</p>
              )}
            </div>
            <AccommodationExplorer
              categories={categories}
              bookingUrl={settings.bookingUrl}
              onMap={[...onMap].filter((k) => k.startsWith("accommodation:") || k.startsWith("category:"))}
            />
          </section>
        )}

        {sections["map"] && <MapSection section={sections["map"]} points={mapPoints} places={places} index={next()} />}
        {sections.gastronomy && <Gastronomy section={sections.gastronomy} restaurants={restaurants} onMap={onMap} index={next()} />}
        {pools && <Pools pools={pools} slides={slides} index={next()} />}
        {sections.services && <ServicesGrid section={sections.services} services={otherServices} onMap={onMap} index={next()} />}
        {sections.entertainment && <Entertainment section={sections.entertainment} activities={activities} index={next()} />}
        {sections.surroundings && <Surroundings section={sections.surroundings} photos={surroundingsPhotos} index={next()} />}
        <Testimonials testimonials={testimonials} index={next()} />
      </main>
      <SiteFooter settings={settings} accreditations={accreditations} locale={locale} />
      <RevealOnScroll />
    </>
  );
}
