import "server-only";
import type { Locale } from "@/i18n/routing";
import { localesFor, pickTranslation } from "@/lib/content/translate";
import { isMapIcon } from "@/lib/map/icons";
import { mediaUrl, type MediaRef } from "./media";
import { contentClient } from "./server";

// Lectures del contingut de la web. Retornen tipus del domini, ja traduïts a l'idioma de la pàgina.

type RawMedia = { path: string; width: number | null; height: number | null; media_translations: { locale: string; alt: string }[] } | null;

const MEDIA = "path, width, height, media_translations(locale, alt)";

function toMedia(raw: RawMedia, locale: Locale, fallbackAlt = ""): MediaRef | null {
  if (!raw) return null;
  return {
    src: mediaUrl(raw.path),
    path: raw.path,
    width: raw.width,
    height: raw.height,
    alt: pickTranslation(raw.media_translations, locale)?.alt || fallbackAlt,
  };
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`No s'ha pogut llegir ${what}: ${result.error.message}`);
  return result.data as T;
}

// ─── Configuració global ──────────────────────────────────────────────────────
export async function getSiteSettings(locale: Locale) {
  const db = contentClient();
  const [settings, translations] = await Promise.all([
    db.from("site_settings").select(`*, logo:media!site_settings_logo_media_id_fkey(${MEDIA})`).single(),
    db.from("site_settings_translations").select("*").in("locale", localesFor(locale)),
  ]);
  const s = unwrap(settings, "la configuració");
  const t = pickTranslation(unwrap(translations, "la configuració"), locale);
  return {
    brandName: s.brand_name,
    legalName: s.legal_name,
    logo: toMedia(s.logo, locale, s.brand_name),
    phone: s.phone_display ? { display: s.phone_display, e164: s.phone_e164 } : null,
    emails: { info: s.email_info, reservations: s.email_reservations },
    address: {
      street: s.street,
      postalCode: s.postal_code,
      locality: s.locality,
      region: s.region,
      country: s.country,
    },
    geo: s.lat != null && s.lng != null ? { lat: s.lat, lng: s.lng } : null,
    season: { open: s.season_open, close: s.season_close, notice: t?.season_notice ?? null },
    licenseCode: s.license_code,
    bookingUrl: s.booking_url,
    clientPortalUrl: s.client_portal_url,
    seo: { title: t?.seo_title ?? s.brand_name, description: t?.seo_description ?? null },
  };
}
export type SiteSettings = Awaited<ReturnType<typeof getSiteSettings>>;

// ─── Seccions ─────────────────────────────────────────────────────────────────
export type Section = {
  key: string;
  title: string;
  body: string | null;
  highlight: string | null;
  ctaLabel: string | null;
  media: MediaRef | null;
};

/** Seccions visibles, indexades per clau (`hero`, `welcome`, `gastronomy`…). */
export async function getSections(locale: Locale): Promise<Record<string, Section>> {
  const result = await contentClient()
    .from("sections")
    .select(`key, sort_order, media:media!sections_media_id_fkey(${MEDIA}), section_translations(locale, title, body, highlight, cta_label)`)
    .eq("is_visible", true)
    .in("section_translations.locale", localesFor(locale))
    .order("sort_order");
  const sections: Record<string, Section> = {};
  for (const s of unwrap(result, "les seccions")) {
    const t = pickTranslation(s.section_translations, locale);
    if (!t) continue;
    sections[s.key] = {
      key: s.key,
      title: t.title,
      body: t.body,
      highlight: t.highlight,
      ctaLabel: t.cta_label,
      media: toMedia(s.media, locale, t.title),
    };
  }
  return sections;
}

// ─── Allotjaments ─────────────────────────────────────────────────────────────
export async function getAccommodationCategories(locale: Locale) {
  const langs = localesFor(locale);
  const result = await contentClient()
    .from("accommodation_categories")
    .select(
      `key, media:media!accommodation_categories_media_id_fkey(${MEDIA}),
       accommodation_category_translations(locale, name, description),
       accommodations(
         slug, capacity_max, size_m2, bedrooms, bathrooms, air_conditioning, is_accessible, sort_order,
         cover:media!accommodations_cover_media_id_fkey(${MEDIA}),
         accommodation_translations(locale, name, description, features),
         accommodation_media(sort_order, media(${MEDIA}))
       )`,
    )
    .in("accommodation_category_translations.locale", langs)
    .in("accommodations.accommodation_translations.locale", langs)
    .order("sort_order")
    .order("sort_order", { referencedTable: "accommodations" });

  return unwrap(result, "els allotjaments").map((c) => {
    const ct = pickTranslation(c.accommodation_category_translations, locale);
    return {
      key: c.key,
      name: ct?.name ?? c.key,
      description: ct?.description ?? null,
      media: toMedia(c.media, locale, ct?.name),
      accommodations: c.accommodations.map((a) => {
        const t = pickTranslation(a.accommodation_translations, locale);
        const name = t?.name ?? a.slug;
        const gallery = [...a.accommodation_media]
          .sort((x, y) => x.sort_order - y.sort_order)
          .map((m) => toMedia(m.media, locale, name))
          .filter((m): m is MediaRef => m !== null);
        return {
          slug: a.slug,
          category: c.key,
          name,
          description: t?.description ?? null,
          features: t?.features ?? [],
          capacityMax: a.capacity_max,
          sizeM2: a.size_m2,
          bedrooms: a.bedrooms,
          bathrooms: a.bathrooms,
          airConditioning: a.air_conditioning,
          isAccessible: a.is_accessible,
          cover: toMedia(a.cover, locale, name),
          gallery,
        };
      }),
    };
  });
}
export type AccommodationCategory = Awaited<ReturnType<typeof getAccommodationCategories>>[number];
export type Accommodation = AccommodationCategory["accommodations"][number];

// ─── Serveis ──────────────────────────────────────────────────────────────────
export async function getServices(locale: Locale) {
  const result = await contentClient()
    .from("services")
    .select(
      `slug, icon:media!services_icon_media_id_fkey(${MEDIA}), media:media!services_media_id_fkey(${MEDIA}),
       service_translations(locale, name, description)`,
    )
    .in("service_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "els serveis").map((s) => {
    const t = pickTranslation(s.service_translations, locale);
    const name = t?.name ?? s.slug;
    return {
      slug: s.slug,
      name,
      description: t?.description ?? null,
      icon: toMedia(s.icon, locale),
      media: toMedia(s.media, locale, name),
    };
  });
}
export type Service = Awaited<ReturnType<typeof getServices>>[number];

// ─── Restauració ──────────────────────────────────────────────────────────────
export async function getRestaurants(locale: Locale) {
  const result = await contentClient()
    .from("restaurants")
    .select(
      `slug, zone, hours, cover:media!restaurants_cover_media_id_fkey(${MEDIA}),
       restaurant_translations(locale, name, description, menu_url)`,
    )
    .in("restaurant_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "els restaurants").map((r) => {
    const t = pickTranslation(r.restaurant_translations, locale);
    const name = t?.name ?? r.slug;
    return {
      slug: r.slug,
      zone: r.zone,
      hours: r.hours,
      name,
      description: t?.description ?? null,
      menuUrl: t?.menu_url ?? null,
      cover: toMedia(r.cover, locale, name),
    };
  });
}
export type Restaurant = Awaited<ReturnType<typeof getRestaurants>>[number];

// ─── Animació ─────────────────────────────────────────────────────────────────
export async function getActivities(locale: Locale) {
  const result = await contentClient()
    .from("activities")
    .select(`slug, audience, zone, hours, cover:media!activities_cover_media_id_fkey(${MEDIA}), activity_translations(locale, name, description)`)
    .in("activity_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "les activitats").map((a) => {
    const t = pickTranslation(a.activity_translations, locale);
    const name = t?.name ?? a.slug;
    return {
      slug: a.slug,
      audience: a.audience,
      hours: a.hours,
      name,
      description: t?.description ?? null,
      cover: toMedia(a.cover, locale, name),
    };
  });
}
export type Activity = Awaited<ReturnType<typeof getActivities>>[number];

// ─── Opinions (en l'idioma original) ─────────────────────────────────────────
export async function getTestimonials() {
  const result = await contentClient()
    .from("testimonials")
    .select("id, author, source, locale, title, quote, rating")
    .order("sort_order");
  return unwrap(result, "les opinions");
}
export type Testimonial = Awaited<ReturnType<typeof getTestimonials>>[number];

// ─── Imatges soltes per carpeta (entorn, acreditacions) ─────────────────────
export async function getMediaByFolder(folder: string, locale: Locale) {
  const result = await contentClient()
    .from("media")
    .select(MEDIA)
    .like("path", `${folder}/%`)
    .order("path");
  return unwrap(result, `les imatges de ${folder}`)
    .map((m) => toMedia(m, locale))
    .filter((m): m is MediaRef => m !== null);
}

// ─── Plànol ───────────────────────────────────────────────────────────────────
export type MapTarget = { type: "service" | "restaurant" | "activity" | "accommodation" | "category"; slug: string };

export async function getMapPoints(locale: Locale) {
  const result = await contentClient()
    .from("map_points")
    .select(
      `id, kind, x, y, icon, accommodation_category_key,
       service:services(slug), restaurant:restaurants(slug), activity:activities(slug), accommodation:accommodations(slug),
       map_point_translations(locale, label)`,
    )
    .in("map_point_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "el plànol").map((p) => {
    const target: MapTarget | null = p.service
      ? { type: "service", slug: p.service.slug }
      : p.restaurant
        ? { type: "restaurant", slug: p.restaurant.slug }
        : p.activity
          ? { type: "activity", slug: p.activity.slug }
          : p.accommodation
            ? { type: "accommodation", slug: p.accommodation.slug }
            : p.accommodation_category_key
            ? { type: "category", slug: p.accommodation_category_key }
            : null;
    return {
      id: p.id,
      kind: p.kind,
      x: Number(p.x),
      y: Number(p.y),
      icon: isMapIcon(p.icon) ? p.icon : null,
      label: pickTranslation(p.map_point_translations, locale)?.label ?? "",
      target,
    };
  });
}
export type MapPoint = Awaited<ReturnType<typeof getMapPoints>>[number];
