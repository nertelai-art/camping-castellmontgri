// Carrega el contingut del web antic (reference/) a Supabase: imatges a Storage i textos a les taules.
// Idempotent: es pot tornar a executar i actualitza en lloc de duplicar.
//
//   pnpm seed                    → fa servir .env.local
//   pnpm seed .env.preview       → un altre fitxer d'entorn
//
// Necessita la clau secreta (SUPABASE_SECRET_KEY): només per a aquest script, mai al navegador.

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import sharp from "sharp";
import type { Database } from "../src/lib/supabase/database.types.ts";
import { isMapIcon } from "../src/lib/map/icons.ts";
import { parseBlocks, parseFrontmatter, parseSize, parseTestimonials, sentenceCase, titleCase, toPercent } from "./lib/markdown.ts";

type Locale = Database["public"]["Enums"]["locale"];
const LOCALES: Locale[] = ["es", "ca", "fr", "en", "nl"];
const REF = "reference";
const MAX_WIDTH = 2400;

const envFile = process.argv[2] ?? ".env.local";
process.loadEnvFile(envFile);
// Accepta també l'adreça copiada amb «/rest/v1/» al final (és la de l'API REST, no la del projecte).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "");
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) throw new Error(`Falten NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY a ${envFile}`);

const db = createClient<Database>(url, secret, { auth: { persistSession: false } });
console.log(`▶ Seed contra ${url}`);

const json = async <T>(path: string): Promise<T> => JSON.parse(await readFile(join(REF, path), "utf8")) as T;
const md = async (locale: Locale, key: string) => {
  try {
    return parseFrontmatter(await readFile(join(REF, "content", locale, `${key}.md`), "utf8"));
  } catch {
    return null; // p. ex. «entorno» no existeix en neerlandès
  }
};

function check<T>(result: { data: T; error: { message: string } | null }, what: string): NonNullable<T> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  return result.data as NonNullable<T>;
}

// ─── 1. Imatges ───────────────────────────────────────────────────────────────
type ManifestEntry = { local: string; category: string; source: string; original?: string; cacheVariants?: string[]; status: string };

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".gif": "image/gif", ".ico": "image/x-icon",
};

/** Clau de cerca d'una imatge: el nom del fitxer, que és estable entre original i miniatures. */
const fileKey = (u: string) => basename(u.split("?")[0]!).toLowerCase();
const mediaByFile = new Map<string, string>();

async function uploadMedia() {
  const manifest = (await json<ManifestEntry[]>("images/manifest.json")).filter((m) => m.status === "ok");
  let done = 0;
  const queue = [...manifest];
  const worker = async () => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      const ext = extname(entry.local).toLowerCase();
      const mime = MIME[ext];
      if (!mime || mime === "image/x-icon") continue;

      let body: Buffer = await readFile(join(REF, entry.local));
      let contentType = mime;
      let path = `${entry.category}/${basename(entry.local)}`;
      let width: number | null = null;
      let height: number | null = null;

      if (mime !== "image/svg+xml" && mime !== "image/gif") {
        // Els originals del web fan fins a 6000 px: es reduïen a 2400 px, prou per a pantalles retina.
        const image = sharp(body).rotate();
        const meta = await image.metadata();
        // El plànol es queda a resolució original: el visor interactiu (fase 3) hi fa zoom.
        if (entry.category !== "plan" && ((meta.width ?? 0) > MAX_WIDTH || body.length > 700_000)) {
          body = await image.resize({ width: MAX_WIDTH, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
          contentType = "image/jpeg";
          path = path.replace(/\.(png|jpe?g|webp)$/i, ".jpg");
        }
        const out = await sharp(body).metadata();
        width = out.width ?? null;
        height = out.height ?? null;
      }

      check(await db.storage.from("media").upload(path, body, { contentType, upsert: true, cacheControl: "31536000" }), `pujar ${path}`);
      const row = check(
        await db
          .from("media")
          .upsert({ path, mime_type: contentType, width, height, source_url: entry.original ?? entry.source }, { onConflict: "source_url" })
          .select("id")
          .single(),
        `media ${path}`,
      );
      for (const u of [entry.source, entry.original, ...(entry.cacheVariants ?? [])]) if (u) mediaByFile.set(fileKey(u), row.id);
      if (++done % 25 === 0) console.log(`  ${done}/${manifest.length} imatges`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`✓ ${done} imatges a Storage`);
}

const mediaId = (u: string | null | undefined) => (u ? (mediaByFile.get(fileKey(u)) ?? null) : null);
/** Cerca per un tros del nom de fitxer (per a imatges del web que no surten a cap JSON). */
const mediaLike = (fragment: string) => {
  for (const [file, id] of mediaByFile) if (file.includes(fragment)) return id;
  throw new Error(`No hi ha cap imatge que contingui «${fragment}»`);
};

// ─── 2. Configuració global ──────────────────────────────────────────────────
type Global = {
  brand: { name: string; legalName: string; logo: string };
  address: { street: string; locality: string; postalCode: string; region: string; country: string };
  geo: { lat: number; lng: number };
  phones: { display: string; e164: string }[];
  emails: Record<"info" | "reservations" | "events" | "jobs" | "whistleblowing", string>;
  season: { open: string; close: string; textByLang: Record<Locale, string> };
  irtcLicence: string;
  booking: { bookingUrl: string };
  clientPortal?: { url?: string; urlPattern?: string } | string;
};

async function seedSettings() {
  const g = await json<Global>("content/global.json");
  check(
    await db.from("site_settings").upsert({
      id: true,
      brand_name: g.brand.name,
      legal_name: g.brand.legalName,
      logo_media_id: mediaId(g.brand.logo),
      phone_display: g.phones[0]?.display ?? null,
      phone_e164: g.phones[0]?.e164 ?? null,
      email_info: g.emails.info,
      email_reservations: g.emails.reservations,
      email_events: g.emails.events,
      email_jobs: g.emails.jobs,
      email_whistleblowing: g.emails.whistleblowing,
      street: g.address.street,
      locality: g.address.locality,
      postal_code: g.address.postalCode,
      region: g.address.region,
      country: g.address.country,
      lat: g.geo.lat,
      lng: g.geo.lng,
      season_open: g.season.open,
      season_close: g.season.close,
      license_code: g.irtcLicence,
      booking_url: g.booking.bookingUrl,
      client_portal_url: "https://portal.camping-castellmontgri.com",
    }),
    "site_settings",
  );
  for (const locale of LOCALES) {
    const home = await md(locale, "home");
    check(
      await db.from("site_settings_translations").upsert({
        locale,
        season_notice: g.season.textByLang[locale],
        seo_title: home?.data.title ?? null,
        seo_description: home?.data.metaDescription ?? null,
      }),
      `site_settings_translations ${locale}`,
    );
  }
  console.log("✓ configuració global");
}

// ─── 3. Seccions de la landing (blocs de la home antiga, en ordre) ───────────
const SECTIONS: { key: string; blockIndex: number; image: string }[] = [
  { key: "welcome", blockIndex: 0, image: "img-8754" },
  { key: "accommodation", blockIndex: 1, image: "2g8a2072" },
  { key: "gastronomy", blockIndex: 2, image: "banner-gastronomia-65ef" },
  { key: "services", blockIndex: 3, image: "banner-instalacions-65ef" },
  { key: "surroundings", blockIndex: 4, image: "banner-entorn-65ef" },
  { key: "entertainment", blockIndex: 5, image: "banner-animacio-65ef" },
  { key: "accommodation-intro", blockIndex: 7, image: "2g8a2147-copia-669f802d66e0" },
];

type NewSection = { image: string } & Record<Locale, { title: string; body: string; cta_label: string }>;

async function seedSections() {
  for (const [order, s] of SECTIONS.entries()) {
    check(await db.from("sections").upsert({ key: s.key, sort_order: order * 10, media_id: mediaLike(s.image) }), `section ${s.key}`);
    for (const locale of LOCALES) {
      const home = await md(locale, "home");
      const block = home && parseBlocks(home.content)[s.blockIndex];
      if (!block) continue;
      check(
        await db.from("section_translations").upsert({
          section_key: s.key,
          locale,
          title: (s.key === "welcome" ? titleCase : sentenceCase)(block.title, locale),
          body: block.body.join("\n\n") || null,
          highlight: block.highlight,
          cta_label: block.links[0] ? sentenceCase(block.links[0].label, locale) : null,
        }),
        `section_translations ${s.key}/${locale}`,
      );
    }
  }
  // Seccions noves sense equivalent al web antic (hero, plànol): textos a scripts/content/new-sections.json.
  const extra = JSON.parse(await readFile("scripts/content/new-sections.json", "utf8")) as Record<string, NewSection | string>;
  const extraKeys = Object.keys(extra).filter((k) => !k.startsWith("_"));
  for (const key of extraKeys) {
    const s = extra[key] as NewSection;
    const order = key === "hero" ? -10 : 15;
    check(await db.from("sections").upsert({ key, sort_order: order, media_id: mediaLike(s.image) }), `section ${key}`);
    for (const locale of LOCALES) {
      check(await db.from("section_translations").upsert({ section_key: key, locale, ...s[locale] }), `section_translations ${key}/${locale}`);
    }
  }
  console.log(`✓ ${SECTIONS.length + extraKeys.length} seccions`);
}

// ─── 4. Allotjaments ─────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "mobile-home", page: "mobile-home", image: "banner-mobilehome" },
  { key: "glamping", page: "glamping", image: "glamping-6a8c1e45" },
  { key: "tent", page: "tiendas", image: "banner-tenda" },
  { key: "pitch", page: "parcelas", image: "banner-parcela" },
] as const;
const CATEGORY_FROM_OLD: Record<string, string> = { "mobile-home": "mobile-home", glamping: "glamping", tienda: "tent", parcela: "pitch" };

type Accommodation = {
  slug: string;
  category: string;
  nameByLang: Record<Locale, string>;
  capacityMax: number | null;
  sizeM2: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  airConditioning: boolean;
  featuresByLang: Record<Locale, string[]>;
  descriptionByLang: Record<Locale, string>;
  thelisresaCategoryId: number | null;
  images: string[];
  listImage: string | null;
  bannerImage: string | null;
};

async function seedAccommodations() {
  for (const [order, c] of CATEGORIES.entries()) {
    check(await db.from("accommodation_categories").upsert({ key: c.key, sort_order: order * 10, media_id: mediaLike(c.image) }), `categoria ${c.key}`);
    for (const locale of LOCALES) {
      const page = await md(locale, c.page);
      const block = page && parseBlocks(page.content)[0];
      if (!block) continue;
      check(
        await db.from("accommodation_category_translations").upsert({
          category_key: c.key,
          locale,
          name: sentenceCase(block.title, locale),
          description: [...block.body, block.highlight ? `**${block.highlight}**` : null].filter(Boolean).join("\n\n") || null,
        }),
        `categoria ${c.key}/${locale}`,
      );
    }
  }

  const list = await json<Accommodation[]>("content/accommodations.json");
  for (const [order, a] of list.entries()) {
    const row = check(
      await db
        .from("accommodations")
        .upsert(
          {
            slug: a.slug,
            category_key: CATEGORY_FROM_OLD[a.category]!,
            capacity_max: a.capacityMax,
            size_m2: parseSize(a.sizeM2),
            bedrooms: a.bedrooms,
            bathrooms: a.bathrooms,
            air_conditioning: a.airConditioning,
            is_accessible: a.slug.includes("pmr"),
            booking_category_id: a.thelisresaCategoryId,
            cover_media_id: mediaId(a.listImage ?? a.bannerImage ?? a.images[0]),
            sort_order: order * 10,
            status: "published",
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single(),
      `allotjament ${a.slug}`,
    );
    for (const locale of LOCALES) {
      check(
        await db.from("accommodation_translations").upsert({
          accommodation_id: row.id,
          locale,
          name: a.nameByLang[locale] ?? a.nameByLang.es,
          description: a.descriptionByLang[locale] ?? null,
          features: a.featuresByLang[locale] ?? [],
        }),
        `allotjament ${a.slug}/${locale}`,
      );
    }
    const gallery = [...new Set(a.images.map(mediaId).filter((id): id is string => id !== null))];
    check(await db.from("accommodation_media").delete().eq("accommodation_id", row.id), `galeria ${a.slug}`);
    if (gallery.length) {
      check(
        await db.from("accommodation_media").insert(gallery.map((media_id, i) => ({ accommodation_id: row.id, media_id, sort_order: i }))),
        `galeria ${a.slug}`,
      );
    }
  }
  console.log(`✓ ${CATEGORIES.length} categories i ${list.length} allotjaments`);
}

// ─── 5. Serveis ──────────────────────────────────────────────────────────────
type Service = { id: string; titleByLang: Record<Locale, string>; textByLang: Record<Locale, string>; icon: string; image: string | null };

const slugify = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// El web antic no traduïa alguns títols a l'anglès («PUNTO DE CARGA»): slug fix per a aquests.
const SERVICE_SLUGS: Record<string, string> = { s21: "ev-charging", s18: "fridge-rental" };

async function seedServices() {
  const list = await json<Service[]>("content/services.json");
  for (const [order, s] of list.entries()) {
    const row = check(
      await db
        .from("services")
        .upsert(
          {
            slug: SERVICE_SLUGS[s.id] ?? slugify(s.titleByLang.en),
            legacy_anchor: s.id,
            icon_media_id: mediaId(s.icon),
            media_id: mediaId(s.image),
            sort_order: order * 10,
            status: "published",
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single(),
      `servei ${s.id}`,
    );
    for (const locale of LOCALES) {
      check(
        await db.from("service_translations").upsert({
          service_id: row.id,
          locale,
          name: sentenceCase(s.titleByLang[locale] ?? s.titleByLang.es, locale),
          description: s.textByLang[locale] ?? null,
        }),
        `servei ${s.id}/${locale}`,
      );
    }
  }
  console.log(`✓ ${list.length} serveis`);
}

// ─── 6. Restaurants i activitats d'animació ─────────────────────────────────
type Venue = {
  slug: string;
  zone: string | null;
  section: { sectionId: string };
  hours: string | null;
  bannerImage: string | null;
  listImage: string | null;
  byLang: Record<Locale, { name: string; description: string; menus: { url: string }[] } | undefined>;
};

/** Les cartes en PDF del web antic es pugen a Storage perquè no depenguin del domini vell. */
async function uploadDocument(source: string) {
  const path = `docs/${basename(source)}`;
  const res = await fetch(source);
  if (!res.ok) throw new Error(`No s'ha pogut baixar ${source}: ${res.status}`);
  check(
    await db.storage.from("media").upload(path, Buffer.from(await res.arrayBuffer()), { contentType: "application/pdf", upsert: true }),
    `pujar ${path}`,
  );
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}

async function seedVenues() {
  const restaurants = await json<Venue[]>("content/restaurants.json");
  const documents = new Map<string, string>();
  for (const [order, r] of restaurants.entries()) {
    const row = check(
      await db
        .from("restaurants")
        .upsert(
          {
            slug: r.slug,
            zone: r.zone?.toLowerCase() ?? null,
            hours: r.hours,
            cover_media_id: mediaId(r.listImage ?? r.bannerImage),
            sort_order: order * 10,
            status: "published",
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single(),
      `restaurant ${r.slug}`,
    );
    for (const locale of LOCALES) {
      const t = r.byLang[locale];
      if (!t) continue;
      const menu = t.menus[0]?.url;
      if (menu && !documents.has(menu)) documents.set(menu, await uploadDocument(menu));
      check(
        await db.from("restaurant_translations").upsert({
          restaurant_id: row.id,
          locale,
          name: titleCase(t.name, locale),
          description: t.description,
          menu_url: menu ? documents.get(menu)! : null,
        }),
        `restaurant ${r.slug}/${locale}`,
      );
    }
  }

  const activities = await json<Venue[]>("content/animation.json");
  for (const [order, a] of activities.entries()) {
    const row = check(
      await db
        .from("activities")
        .upsert(
          {
            slug: a.slug,
            audience: a.section.sectionId,
            zone: a.zone?.toLowerCase() ?? null,
            hours: a.hours,
            cover_media_id: mediaId(a.listImage ?? a.bannerImage),
            sort_order: order * 10,
            status: "published",
          },
          { onConflict: "slug" },
        )
        .select("id")
        .single(),
      `activitat ${a.slug}`,
    );
    for (const locale of LOCALES) {
      const t = a.byLang[locale];
      if (!t) continue;
      check(
        await db.from("activity_translations").upsert({ activity_id: row.id, locale, name: titleCase(t.name, locale), description: t.description }),
        `activitat ${a.slug}/${locale}`,
      );
    }
  }
  console.log(`✓ ${restaurants.length} restaurants i ${activities.length} activitats`);
}

// ─── 7. Opinions ─────────────────────────────────────────────────────────────
// Totes surten del web antic, però tres parlen de la COVID o de queixes concretes:
// entren com a esborrany perquè el càmping decideixi si les publica.
const PUBLISHED_TESTIMONIALS = new Set(["Joelpi", "josepbp2017"]);

async function seedTestimonials() {
  const home = await md("es", "home");
  const block = home!.content.split(/^## /m).find((part) => part.startsWith("¿QUÉ DICEN"))!;
  const list = parseTestimonials(block);
  check(await db.from("testimonials").delete().eq("source", "TripAdvisor"), "opinions");
  check(
    await db.from("testimonials").insert(
      list.map((t, i) => ({
        author: t.author,
        source: "TripAdvisor",
        locale: "es" as const,
        title: t.title,
        quote: t.quote,
        sort_order: i * 10,
        status: PUBLISHED_TESTIMONIALS.has(t.author) ? ("published" as const) : ("draft" as const),
      })),
    ),
    "opinions",
  );
  console.log(`✓ ${list.length} opinions (${PUBLISHED_TESTIMONIALS.size} publicades)`);
}

// ─── 8. Punts del plànol ─────────────────────────────────────────────────────
type MapPointSeed = {
  kind: string;
  x: number;
  y: number;
  service?: string;
  restaurant?: string;
  activity?: string;
  accommodation?: string;
  category?: string;
  icon?: string;
  label?: Record<Locale, string>;
};

async function seedMapPoints() {
  const file = JSON.parse(await readFile("scripts/content/map-points.json", "utf8")) as {
    image: { width: number; height: number };
    points: MapPointSeed[];
  };
  // Noms de cada entitat per idioma: l'etiqueta del punt és el nom del que assenyala, si no en té una de pròpia.
  type Named = { id: string; slug: string; names: { locale: Locale; name: string }[] };
  const bySlug = (rows: Named[]) => new Map(rows.map((r) => [r.slug, r]));
  const [services, restaurants, activities, accommodations, categories] = await Promise.all([
    db.from("services").select("id, slug, names:service_translations(locale, name)").then((r) => bySlug(check(r, "serveis"))),
    db.from("restaurants").select("id, slug, names:restaurant_translations(locale, name)").then((r) => bySlug(check(r, "restaurants"))),
    db.from("activities").select("id, slug, names:activity_translations(locale, name)").then((r) => bySlug(check(r, "activitats"))),
    db.from("accommodations").select("id, slug, names:accommodation_translations(locale, name)").then((r) => bySlug(check(r, "allotjaments"))),
    db.from("accommodation_category_translations").select("category_key, locale, name").then((r) => check(r, "categories")),
  ]);

  check(await db.from("map_points").delete().not("id", "is", null), "map_points");
  for (const [order, p] of file.points.entries()) {
    const linked =
      (p.service && services.get(p.service)) ||
      (p.restaurant && restaurants.get(p.restaurant)) ||
      (p.activity && activities.get(p.activity)) ||
      (p.accommodation && accommodations.get(p.accommodation)) ||
      null;
    const ref = p.service ?? p.restaurant ?? p.activity ?? p.accommodation;
    if (ref && !linked) throw new Error(`Punt ${order}: no existeix ${ref}`);
    if (p.icon && !isMapIcon(p.icon)) throw new Error(`Punt ${order}: la icona ${p.icon} no existeix`);
    const row = check(
      await db
        .from("map_points")
        .insert({
          kind: p.kind,
          x: toPercent(p.x, file.image.width),
          y: toPercent(p.y, file.image.height),
          service_id: p.service ? linked!.id : null,
          restaurant_id: p.restaurant ? linked!.id : null,
          activity_id: p.activity ? linked!.id : null,
          accommodation_id: p.accommodation ? linked!.id : null,
          accommodation_category_key: p.category ?? null,
          icon: p.icon ?? null,
          sort_order: order * 10,
          status: "published",
        })
        .select("id")
        .single(),
      `punt ${order}`,
    );
    for (const locale of LOCALES) {
      const label =
        p.label?.[locale] ??
        linked?.names.find((n) => n.locale === locale)?.name ??
        categories.find((c) => c.category_key === p.category && c.locale === locale)?.name;
      if (!label) throw new Error(`Punt ${order}: sense etiqueta en ${locale}`);
      check(await db.from("map_point_translations").insert({ map_point_id: row.id, locale, label }), `etiqueta ${order}/${locale}`);
    }
  }
  console.log(`✓ ${file.points.length} punts al plànol`);
}

await uploadMedia();
await seedSettings();
await seedSections();
await seedAccommodations();
await seedServices();
await seedVenues();
await seedTestimonials();
await seedMapPoints();

// La web té el contingut a la caché de Next per etiquetes: si hi ha una web engegada, se li diu que
// l'invalidi (si no, continuaria servint el contingut d'abans del seed).
const revalidateUrl = process.env.REVALIDATE_URL;
if (revalidateUrl && process.env.REVALIDATE_SECRET) {
  const res = await fetch(revalidateUrl, {
    method: "POST",
    headers: { "content-type": "application/json", "x-revalidate-secret": process.env.REVALIDATE_SECRET },
    body: "{}",
  }).catch((error: Error) => ({ ok: false, status: error.message }));
  console.log(res.ok ? "✓ caché de la web invalidada" : `⚠ no s'ha pogut invalidar la caché (${res.status})`);
}
console.log("✔ Seed complet");
