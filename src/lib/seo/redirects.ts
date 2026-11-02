// Les adreces del web antic (reference/content/site-map.json), cap a la pàgina nova que en fa la feina. Que no es perdi el que Google ja coneix.

export type OldPage = { key: string; group: string } & Partial<Record<string, { url?: string } | string | null>>;
export type Redirect = { source: string; destination: string; permanent: true };

const LOCALES = ["es", "ca", "fr", "en", "nl"] as const;

/** On va cada pàgina antiga: per grup o, si cal afinar, per clau. Sense equivalent, a la portada. */
function target(page: OldPage): string {
  const byKey: Record<string, string> = {
    servicios: "/services",
    animacion: "/entertainment",
    restauracion: "/gastronomy",
    entorno: "/surroundings",
    "preservacion-del-entorno": "/surroundings",
    "comparar-alojamientos": "/accommodations",
    "condiciones-de-reservas": "/legal/booking-conditions",
    "politica-de-privacidad": "/legal/privacy",
    "politica-de-cookies": "/legal/cookies",
    "aviso-legal": "/legal/legal-notice",
  };
  const byGroup: Record<string, string> = {
    "accommodation-category": "/accommodations",
    accommodation: "/accommodations",
    restaurant: "/gastronomy",
    animation: "/entertainment",
  };
  return byKey[page.key] ?? byGroup[page.group] ?? "";
}

const path = (url: string) => new URL(url).pathname.replace(/\/+$/, "") || "/";

export function oldSiteRedirects(pages: OldPage[]): Redirect[] {
  const seen = new Set<string>();
  const redirects: Redirect[] = [];
  for (const page of pages) {
    for (const locale of LOCALES) {
      const entry = page[locale];
      // Hi ha pàgines que no existien en algun idioma: `null`.
      if (!entry || typeof entry !== "object" || !entry.url) continue;
      const source = path(entry.url);
      const destination = `/${locale}${target(page)}`;
      // La mateixa adreça al web nou (p. ex. /en/services), o una de repetida: res a redirigir.
      if (source === destination || seen.has(source)) continue;
      seen.add(source);
      redirects.push({ source, destination, permanent: true });
    }
  }
  return redirects;
}
