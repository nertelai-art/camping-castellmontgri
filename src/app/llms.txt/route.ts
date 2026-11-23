// /llms.txt (llmstxt.org): el web resumit per als assistents d'IA (ChatGPT, Claude, Perplexity…), en text pla i amb els enllaços
// a les pàgines. Tot surt del contingut del panell, en castellà (l'idioma per defecte), i s'actualitza quan es desa.

import { routing } from "@/i18n/routing";
import { metaDescription, plainText } from "@/lib/seo/metadata";
import { siteUrl } from "@/lib/site-url";
import { getAccommodationCategories, getRestaurants, getSections, getServices, getSiteSettings } from "@/lib/supabase/content";

const locale = routing.defaultLocale;
const PAGES = ["services", "entertainment", "gastronomy", "surroundings", "gallery"] as const;

const link = (name: string, path: string, description?: string | null) => `- [${name}](${siteUrl}/${locale}${path ? `/${path}` : ""})${description ? `: ${description}` : ""}`;

export async function GET() {
  const [settings, sections, categories, services, restaurants] = await Promise.all([
    getSiteSettings(locale),
    getSections(locale),
    getAccommodationCategories(locale),
    getServices(locale),
    getRestaurants(locale),
  ]);
  const { address, season } = settings;
  const where = [address.street, [address.postalCode, address.locality].filter(Boolean).join(" "), address.region].filter(Boolean).join(", ");

  const lines: unknown[] = [
    `# ${settings.brandName}`,
    "",
    `> ${plainText(settings.seo.description ?? sections.hero?.body ?? "")}`,
    "",
    sections.welcome?.body ? plainText(sections.welcome.body) : null,
    "",
    "## Datos",
    where && `- Dirección: ${where}`,
    settings.geo && `- Coordenadas: ${settings.geo.lat}, ${settings.geo.lng}`,
    settings.phone && `- Teléfono: ${settings.phone.display}`,
    settings.emails.info && `- Correo: ${settings.emails.info}`,
    season.open && season.close && `- Temporada: del ${season.open} al ${season.close}`,
    settings.bookingUrl && `- Reservas: ${settings.bookingUrl}`,
    settings.licenseCode && `- Registro de Turismo de Cataluña: ${settings.licenseCode}`,
    `- Idiomas de la web: ${routing.locales.map((l) => `${siteUrl}/${l}`).join(", ")}`,
    "",
    "## Páginas",
    link(sections.hero?.title ?? settings.brandName, "", metaDescription(sections.hero?.body)),
    sections.accommodation && link(sections.accommodation.title, "accommodations", metaDescription(sections.accommodation.body)),
    ...PAGES.map((key) => sections[key] && link(sections[key].title, key, metaDescription(sections[key].body))),
    "",
    "## Alojamientos",
    ...categories.flatMap((category) =>
      category.accommodations.map((a) => {
        const facts = [a.capacityMax && `hasta ${a.capacityMax} personas`, a.sizeM2 && `${a.sizeM2} m²`, a.bedrooms && `${a.bedrooms} ${a.bedrooms === 1 ? "habitación" : "habitaciones"}`].filter(Boolean).join(", ");
        return link(`${a.name} (${category.name})`, `accommodations/${a.slug}`, [facts, metaDescription(a.description, 200)].filter(Boolean).join(". "));
      }),
    ),
    "",
    "## Servicios",
    ...services.map((s) => `- ${s.name}${s.description ? `: ${metaDescription(s.description, 200)}` : ""}`),
    "",
    "## Restaurantes y bares",
    ...restaurants.map((r) => `- ${r.name}${r.hours ? ` (${r.hours})` : ""}${r.description ? `: ${metaDescription(r.description, 200)}` : ""}`),
  ];

  const text = lines
    // Les dades que falten (`null`, `false`, buides) no fan línia.
    .filter((line): line is string => typeof line === "string")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return new Response(`${text.trim()}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
