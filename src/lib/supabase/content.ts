import "server-only";
import type { Locale } from "@/i18n/routing";
import { localesFor, pickTranslation } from "@/lib/content/translate";
import type { MediaRef } from "./media";
import { contentClient } from "./server";

// Lectures del contingut de la web. Retornen tipus del domini, ja traduïts a l'idioma de la pàgina.

type RawMedia = { path: string; width: number | null; height: number | null; media_translations: { locale: string; alt: string }[] } | null;

const MEDIA = "path, width, height, media_translations(locale, alt)";

function toMedia(raw: RawMedia, locale: Locale): MediaRef | null {
  if (!raw) return null;
  return { path: raw.path, width: raw.width, height: raw.height, alt: pickTranslation(raw.media_translations, locale)?.alt ?? "" };
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, what: string): T {
  if (result.error) throw new Error(`No s'ha pogut llegir ${what}: ${result.error.message}`);
  return result.data as T;
}

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
    logo: toMedia(s.logo, locale),
    phone: s.phone_display ? { display: s.phone_display, e164: s.phone_e164 } : null,
    email: s.email_info,
    address: [s.street, [s.postal_code, s.locality].filter(Boolean).join(" "), s.region].filter(Boolean).join(", "),
    season: { open: s.season_open, close: s.season_close, notice: t?.season_notice ?? null },
    licenseCode: s.license_code,
    bookingUrl: s.booking_url,
    seo: { title: t?.seo_title ?? s.brand_name, description: t?.seo_description ?? null },
  };
}

export async function getSections(locale: Locale) {
  const result = await contentClient()
    .from("sections")
    .select(`key, sort_order, media:media!sections_media_id_fkey(${MEDIA}), section_translations(locale, title, body, highlight, cta_label)`)
    .eq("is_visible", true)
    .in("section_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "les seccions").flatMap((s) => {
    const t = pickTranslation(s.section_translations, locale);
    if (!t) return [];
    return [{ key: s.key, title: t.title, body: t.body, highlight: t.highlight, ctaLabel: t.cta_label, media: toMedia(s.media, locale) }];
  });
}

export async function getAccommodationCategories(locale: Locale) {
  const result = await contentClient()
    .from("accommodation_categories")
    .select(
      `key, media:media!accommodation_categories_media_id_fkey(${MEDIA}), accommodation_category_translations(locale, name, description),
       accommodations(slug, capacity_max, size_m2, bedrooms, sort_order, cover:media!accommodations_cover_media_id_fkey(${MEDIA}), accommodation_translations(locale, name))`,
    )
    .in("accommodation_category_translations.locale", localesFor(locale))
    .in("accommodations.accommodation_translations.locale", localesFor(locale))
    .order("sort_order")
    .order("sort_order", { referencedTable: "accommodations" });
  return unwrap(result, "els allotjaments").map((c) => ({
    key: c.key,
    name: pickTranslation(c.accommodation_category_translations, locale)?.name ?? c.key,
    description: pickTranslation(c.accommodation_category_translations, locale)?.description ?? null,
    media: toMedia(c.media, locale),
    accommodations: c.accommodations.map((a) => ({
      slug: a.slug,
      name: pickTranslation(a.accommodation_translations, locale)?.name ?? a.slug,
      capacityMax: a.capacity_max,
      sizeM2: a.size_m2,
      bedrooms: a.bedrooms,
      cover: toMedia(a.cover, locale),
    })),
  }));
}

export async function getServices(locale: Locale) {
  const result = await contentClient()
    .from("services")
    .select(`slug, icon:media!services_icon_media_id_fkey(${MEDIA}), service_translations(locale, name)`)
    .in("service_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "els serveis").map((s) => ({
    slug: s.slug,
    name: pickTranslation(s.service_translations, locale)?.name ?? s.slug,
    icon: toMedia(s.icon, locale),
  }));
}

export async function getRestaurants(locale: Locale) {
  const result = await contentClient()
    .from("restaurants")
    .select(`slug, zone, hours, cover:media!restaurants_cover_media_id_fkey(${MEDIA}), restaurant_translations(locale, name)`)
    .in("restaurant_translations.locale", localesFor(locale))
    .order("sort_order");
  return unwrap(result, "els restaurants").map((r) => ({
    slug: r.slug,
    zone: r.zone,
    hours: r.hours,
    name: pickTranslation(r.restaurant_translations, locale)?.name ?? r.slug,
    cover: toMedia(r.cover, locale),
  }));
}
