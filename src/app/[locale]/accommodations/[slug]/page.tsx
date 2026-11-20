import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { AccommodationGallery } from "@/components/site/accommodation-gallery";
import { AmenityGlyph, BedGlyph } from "@/components/site/amenity-icons";
import { Price, Specs } from "@/components/site/accommodation-parts";
import { RevealOnScroll } from "@/components/site/reveal-on-scroll";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { routing } from "@/i18n/routing";
import { bookingLink } from "@/lib/booking/link";
import { accommodationHref } from "@/lib/content/accommodation";
import { amenities, bedLayout } from "@/lib/content/equipment";
import { paragraphs } from "@/lib/content/rich-text";
import {
  getAccommodationCategories,
  getAccreditations,
  getMediaByFolder,
  getSections,
  getServices,
  getSiteSettings,
} from "@/lib/supabase/content";

// La pàgina de cada allotjament: les fotos, les dades amb icones, com es dorm, l'equipament, el càmping i la zona, i la reserva al costat.

async function findAccommodation(locale: Parameters<typeof getAccommodationCategories>[0], slug: string) {
  const categories = await getAccommodationCategories(locale);
  for (const category of categories) {
    const accommodation = category.accommodations.find((a) => a.slug === slug);
    if (accommodation) return { accommodation, category };
  }
  return null;
}

export async function generateMetadata({ params }: PageProps<"/[locale]/accommodations/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const [{ brandName }, found] = await Promise.all([getSiteSettings(locale), findAccommodation(locale, slug)]);
  if (!found) return {};
  const { accommodation: a } = found;
  const path = `accommodations/${slug}`;
  return {
    title: `${a.name} · ${brandName}`,
    description: paragraphs(a.description)[0]?.replace(/\*\*/g, "") ?? undefined,
    alternates: {
      canonical: `/${locale}/${path}`,
      languages: { ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}/${path}`])), "x-default": `/${routing.defaultLocale}/${path}` },
    },
    openGraph: a.cover ? { images: [{ url: a.cover.src }] } : undefined,
  };
}

export default async function AccommodationPage({ params }: PageProps<"/[locale]/accommodations/[slug]">) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, tNav, settings, found, sections, services, accreditations, flags] = await Promise.all([
    getTranslations("accommodation"),
    getTranslations("nav"),
    getSiteSettings(locale),
    findAccommodation(locale, slug),
    getSections(locale),
    getServices(locale),
    getAccreditations(locale),
    getMediaByFolder("flags", locale),
  ]);
  if (!found) notFound();
  const { accommodation: a, category } = found;

  // La de la portada primer, i la resta de la galeria sense repetir-la.
  const photos = a.cover ? [a.cover, ...a.gallery.filter((m) => m.src !== a.cover?.src)] : a.gallery;
  const beds = bedLayout(a.features);
  const equipment = amenities(a.features, a.airConditioning ? [t("airConditioning")] : []);
  const others = category.accommodations.filter((o) => o.slug !== a.slug).slice(0, 3);
  const camping = sections.welcome;
  const zone = sections.surroundings;
  const address = [settings.address.street, [settings.address.postalCode, settings.address.locality].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <>
      <SiteHeader settings={settings} locale={locale} flags={flags} home={false} />
      <main id="main" data-edit={`accommodations:${a.slug}`} className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-32">
        <nav aria-label={t("breadcrumb")} className="mb-5 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link href={`/${locale}`} className="hover:text-olive hover:underline">
                {t("home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/${locale}#accommodation`} className="hover:text-olive hover:underline">
                {tNav("accommodation")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-bold text-ink">
              {a.name}
            </li>
          </ol>
        </nav>

        <AccommodationGallery photos={photos} name={a.name} slug={a.slug} />

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="min-w-0">
            <p className="accommodation-build text-xs font-bold uppercase tracking-[0.22em] text-terra" style={{ ["--i" as string]: 2 }}>
              {category.name}
            </p>
            <h1 data-edit-field="name" className="accommodation-build font-display mt-3 text-4xl leading-[1.04] text-olive sm:text-5xl" style={{ ["--i" as string]: 3 }}>
              {a.name}
            </h1>
            <div className="accommodation-build mt-6 border-y border-line py-5" style={{ ["--i" as string]: 4 }}>
              <Specs a={a} large />
            </div>

            {a.description && (
              <RichText field="description" text={a.description} className="accommodation-build mt-8 grid gap-4 text-lg leading-relaxed text-muted [&_strong]:text-ink" />
            )}

            {beds.length > 0 && (
              <section aria-labelledby="layout-title" className="reveal mt-14">
                <h2 id="layout-title" className="font-display text-3xl text-olive">
                  {t("layout")}
                </h2>
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {beds.map((room) => (
                    <li key={room.label} className="flex items-center gap-4 rounded-2xl border border-line p-4">
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-paper-2 text-olive">
                        <BedGlyph kind={room.kind} className="size-6" />
                      </span>
                      <span className="font-bold text-ink">
                        {room.count > 1 && <span className="text-terra">{room.count} × </span>}
                        {room.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {equipment.length > 0 && (
              <section aria-labelledby="equipment-title" className="reveal mt-14">
                <h2 id="equipment-title" className="font-display text-3xl text-olive">
                  {t("equipment")}
                </h2>
                <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                  {equipment.map((item) => (
                    <li key={item.text} className="flex items-center gap-3 text-ink">
                      <AmenityGlyph icon={item.icon} className="size-6 shrink-0 text-olive" />
                      {item.text}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {camping && (
              <section aria-labelledby="camping-title" className="reveal mt-16 border-t border-line pt-14">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">{t("camping")}</p>
                <h2 id="camping-title" className="font-display mt-3 text-3xl text-olive sm:text-4xl">
                  {settings.brandName}
                </h2>
                {address && (
                  <p className="mt-3 flex items-center gap-2 font-bold text-ink">
                    <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-terra" aria-hidden="true">
                      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
                    </svg>
                    {address}
                  </p>
                )}
                <RichText text={camping.body} className="mt-5 grid gap-4 leading-relaxed text-muted [&_strong]:text-ink" />
                {camping.gallery.length > 0 && (
                  <ul className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {camping.gallery.slice(0, 5).map((photo, i) => (
                      <li key={photo.path} className={`relative aspect-square overflow-hidden rounded-xl bg-paper-2 ${i >= 3 ? "max-sm:hidden" : ""}`}>
                        <MediaImage media={photo} alt="" fill sizes="(min-width: 640px) 9rem, 30vw" className="object-cover" />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {services.length > 0 && (
              <section aria-labelledby="services-title" className="reveal mt-14">
                <h2 id="services-title" className="font-display text-3xl text-olive">
                  {t("campingServices")}
                </h2>
                <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {services.slice(0, 12).map((s) => (
                    <li key={s.slug} className="flex items-center gap-3 rounded-2xl bg-paper-2 p-3.5 text-sm font-bold text-ink">
                      {s.icon ? (
                        <Image src={s.icon.src} alt="" width={28} height={28} className="size-7 shrink-0 object-contain" unoptimized={s.icon.src.endsWith(".svg")} />
                      ) : (
                        <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-terra" />
                      )}
                      {s.name}
                    </li>
                  ))}
                </ul>
                <Link href={`/${locale}/services`} className="mt-5 inline-block font-bold text-terra hover:underline">
                  {tNav("services")}
                </Link>
              </section>
            )}

            {zone && (
              <section aria-labelledby="zone-title" className="reveal mt-14 grid items-center gap-6 rounded-[2rem] bg-paper-2 p-4 sm:grid-cols-[14rem_1fr] sm:p-5">
                {zone.media && (
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-square">
                    <MediaImage media={zone.media} alt="" fill sizes="(min-width: 640px) 14rem, 100vw" className="object-cover" />
                  </div>
                )}
                <div className="px-2 pb-2 sm:px-0 sm:pb-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-terra">{t("zone")}</p>
                  <h2 id="zone-title" className="font-display mt-2 text-2xl text-olive sm:text-3xl">
                    {zone.title}
                  </h2>
                  <RichText text={zone.body} className="mt-3 line-clamp-4 leading-relaxed text-muted [&_strong]:text-ink" />
                  <Link href={`/${locale}/surroundings`} className="mt-4 inline-block font-bold text-terra hover:underline">
                    {t("discoverZone")}
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* La reserva: al costat i fixa en baixar a l'escriptori; al mòbil, una barra a baix de tot. */}
          <aside aria-label={t("bookTitle")} className="lg:sticky lg:top-24 lg:self-start">
            <div className="accommodation-build rounded-[1.75rem] border border-line bg-card p-6 shadow-[0_28px_60px_-36px_rgb(35_42_20/.45)]" style={{ ["--i" as string]: 4 }}>
              <h2 className="font-display text-2xl text-olive">{t("bookTitle")}</h2>
              <div className="mt-4">
                <Price value={a.priceFrom} large />
              </div>
              {settings.bookingUrl && (
                <a
                  href={bookingLink(settings.bookingUrl, { locale })}
                  target="_blank"
                  rel="noopener"
                  className="mt-6 block rounded-full bg-band-olive px-6 py-4 text-center text-lg font-bold text-on-dark transition hover:brightness-125"
                >
                  {tNav("book")}
                </a>
              )}
              <p className="mt-3 text-center text-sm text-muted">{t("bookHint")}</p>
              {settings.phone?.e164 && (
                <a href={`tel:${settings.phone.e164}`} className="mt-5 flex items-center justify-center gap-2 border-t border-line pt-5 font-bold text-olive hover:underline">
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                    <path
                      d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {settings.phone.display}
                </a>
              )}
            </div>
          </aside>
        </div>

        {others.length > 0 && (
          <section aria-labelledby="others-title" className="reveal mt-24">
            <h2 id="others-title" className="font-display text-3xl text-olive sm:text-4xl">
              {t("others")}
            </h2>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((o) => (
                <li key={o.slug} className="group/card relative rounded-3xl border border-line bg-card p-2.5 transition hover:border-olive">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-2">
                    {o.cover && (
                      <Image
                        src={o.cover.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition duration-700 group-hover/card:scale-105"
                        style={{ objectPosition: o.cover.position }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 px-2.5 pb-2 pt-4">
                    <Link
                      href={accommodationHref(locale, o.slug)}
                      className="font-display text-2xl leading-tight text-olive after:absolute after:inset-0 after:rounded-3xl group-hover/card:text-terra"
                    >
                      {o.name}
                    </Link>
                    <Specs a={o} />
                    <Price value={o.priceFrom} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      {/* Al mòbil, la reserva sempre a mà. */}
      {settings.bookingUrl && (
        <div className="booking-dock fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
          <Price value={a.priceFrom} />
          <a href={bookingLink(settings.bookingUrl, { locale })} target="_blank" rel="noopener" className="ml-auto rounded-full bg-band-olive px-6 py-3 font-bold text-on-dark">
            {tNav("book")}
          </a>
        </div>
      )}
      <SiteFooter settings={settings} accreditations={accreditations} locale={locale} />
      {/* Perquè la barra de reserva del mòbil no tapi el final del peu. */}
      {settings.bookingUrl && <div aria-hidden="true" className="h-20 bg-band-olive lg:hidden" />}
      <RevealOnScroll />
    </>
  );
}
