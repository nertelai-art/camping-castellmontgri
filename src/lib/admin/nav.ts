// Com s'arriba a cada contingut des del panell: el menú per pàgines del web i temes, les pàgines del web que ensenya el tauler
// i les tasques de la pàgina d'inici. Qui edita pensa en el que vol fer («canviar un horari») o en la pàgina que veu, no en
// quina taula ho guarda. Les icones són noms: el panell les dibuixa (`admin-icons.tsx`), aquí només es diu quina toca.

import { LEGAL_PAGES, type LegalSlug } from "@/lib/content/legal";
import { ENTITIES, type EntityName } from "./entities";

export const entityHref = (entity: EntityName) => `/admin/${entity}`;

export const PROGRAMME_HREF = "/admin/programme";
export const HOME_HREF = "/admin/home";
export const CHANGES_HREF = "/admin/changes";

/** Galeta del panell (no de la web) que recorda si la barra lateral està plegada. */
export const SIDEBAR_COOKIE = "admin-sidebar";

/** La fitxa d'una secció: el text d'una pàgina o d'un bloc. */
export const sectionHref = (key: string) => `${entityHref("sections")}/${encodeURIComponent(key)}`;

export type NavIcon =
  | "home"
  | "layout"
  | "quote"
  | "map-pin"
  | "pool"
  | "party"
  | "utensils"
  | "mountain"
  | "images"
  | "text"
  | "bed"
  | "tags"
  | "calendar"
  | "store"
  | "sparkles"
  | "concierge"
  | "shield"
  | "cookie"
  | "scale"
  | "file"
  | "settings"
  | "history";

export const ENTITY_ICONS: Record<EntityName, NavIcon> = {
  sections: "text",
  services: "concierge",
  restaurants: "store",
  activities: "sparkles",
  accommodations: "bed",
  accommodation_categories: "tags",
  map_points: "map-pin",
  testimonials: "quote",
  site_settings: "settings",
};

export type NavItem = { href: string; title: string; icon: NavIcon };
export type NavGroup = { title: string; pages?: readonly NavItem[]; entities: readonly EntityName[] };

export const NAV_GROUPS: readonly NavGroup[] = [
  { title: "La portada", pages: [{ href: HOME_HREF, title: "Ordre i blocs", icon: "layout" }], entities: ["testimonials", "map_points"] },
  {
    title: "Pàgines del web",
    pages: [
      { href: sectionHref("services"), title: "Instal·lacions", icon: "pool" },
      { href: sectionHref("entertainment"), title: "Animació", icon: "party" },
      { href: sectionHref("gastronomy"), title: "Gastronomia", icon: "utensils" },
      { href: sectionHref("surroundings"), title: "Entorn", icon: "mountain" },
      { href: sectionHref("gallery"), title: "Galeria d'imatges", icon: "images" },
    ],
    entities: ["sections"],
  },
  { title: "Allotjaments", entities: ["accommodations", "accommodation_categories"] },
  { title: "Al càmping", pages: [{ href: PROGRAMME_HREF, title: "Programa setmanal", icon: "calendar" }], entities: ["restaurants", "activities", "services"] },
  {
    title: "Textos legals",
    pages: [
      { href: sectionHref("legal-privacy"), title: "Privacitat", icon: "shield" },
      { href: sectionHref("legal-cookies"), title: "Galetes", icon: "cookie" },
      { href: sectionHref("legal-notice"), title: "Avís legal", icon: "scale" },
      { href: sectionHref("legal-booking"), title: "Condicions de reserva", icon: "file" },
    ],
    entities: [],
  },
  { title: "Dades", entities: ["site_settings"] },
];

/** Cada grup del menú com a llista d'opcions, cadascuna amb la seva icona: primer les pàgines, després les llistes. */
export const navItems = (group: NavGroup): NavItem[] => [
  ...(group.pages ?? []),
  ...group.entities.map((entity) => ({ href: entityHref(entity), title: ENTITIES[entity].title, icon: ENTITY_ICONS[entity] })),
];

/** Totes les adreces del menú, per saber quina s'ha de marcar. */
export const NAV_HREFS = [...NAV_GROUPS.flatMap((group) => navItems(group).map((item) => item.href)), CHANGES_HREF];

/**
 * Les pàgines del web tal com les veu qui visita, per al tauler: on són (sense l'idioma), quina secció en porta el títol,
 * el text i la foto, i on s'editen. La portada s'edita des del seu ordre de blocs; la resta, des de la fitxa de la secció.
 */
export type SitePage = { title: string; path: string; section: string; icon: NavIcon; edit: string; hint: string };

export const SITE_PAGES: readonly SitePage[] = [
  { title: "Portada", path: "", section: "hero", icon: "home", edit: HOME_HREF, hint: "La foto gran amb la cerca, i els blocs de la pàgina principal" },
  { title: "Allotjaments", path: "/accommodations", section: "accommodation", icon: "bed", edit: entityHref("accommodations"), hint: "Mobile homes, bungalows i parcel·les, amb fotos i preus" },
  { title: "Instal·lacions", path: "/services", section: "services", icon: "pool", edit: sectionHref("services"), hint: "Piscines, tobogans i serveis del càmping" },
  { title: "Animació", path: "/entertainment", section: "entertainment", icon: "party", edit: sectionHref("entertainment"), hint: "Les activitats i el programa de la setmana" },
  { title: "Gastronomia", path: "/gastronomy", section: "gastronomy", icon: "utensils", edit: sectionHref("gastronomy"), hint: "Restaurants i bars, horaris i cartes" },
  { title: "Entorn", path: "/surroundings", section: "surroundings", icon: "mountain", edit: sectionHref("surroundings"), hint: "L'Estartit, les Medes i el Montgrí" },
  { title: "Galeria", path: "/gallery", section: "gallery", icon: "images", edit: sectionHref("gallery"), hint: "Les fotos del càmping" },
];

const LEGAL_TITLES: Record<LegalSlug, string> = { privacy: "Privacitat", cookies: "Galetes", "legal-notice": "Avís legal", "booking-conditions": "Condicions de reserva" };
const LEGAL_ICONS: Record<LegalSlug, NavIcon> = { privacy: "shield", cookies: "cookie", "legal-notice": "scale", "booking-conditions": "file" };

export const LEGAL_SITE_PAGES: readonly SitePage[] = (Object.keys(LEGAL_PAGES) as LegalSlug[]).map((slug) => ({
  title: LEGAL_TITLES[slug],
  path: `/legal/${slug}`,
  section: LEGAL_PAGES[slug],
  icon: LEGAL_ICONS[slug],
  edit: sectionHref(LEGAL_PAGES[slug]),
  hint: "Text legal",
}));

/** L'editor visual obert en una pàgina del web. */
export const visualPageHref = (path: string) => (path ? `/admin/visual?page=${encodeURIComponent(path)}` : "/admin/visual");

/** La pàgina on s'obre l'editor visual: només una de les pàgines del web que coneixem. Qualsevol altra cosa, la portada. */
export function startPage(raw: string | null | undefined): string {
  if (!raw) return "";
  return [...SITE_PAGES, ...LEGAL_SITE_PAGES].some((page) => page.path === raw) ? raw : "";
}

/** Els continguts dels quals se'n pot afegir un de nou, per al botó «Crea» del tauler. */
export const CREATABLE: readonly EntityName[] = (Object.keys(ENTITIES) as EntityName[]).filter((entity) => "create" in ENTITIES[entity] && ENTITIES[entity].create);

/** On el nom curt no s'entén fora de la seva llista («Nou local», «Nou punt»). */
const CREATE_LABELS: Partial<Record<EntityName, string>> = { restaurants: "Nou restaurant o bar", map_points: "Nou punt del mapa" };

/** «Nova activitat», «Nou servei»… */
export const createLabel = (entity: EntityName) => {
  const config = ENTITIES[entity];
  return CREATE_LABELS[entity] ?? `${"feminine" in config && config.feminine ? "Nova" : "Nou"} ${config.singular}`;
};

export const TASKS: readonly { label: string; hint: string; href: string }[] = [
  { label: "Posar les activitats de la setmana", hint: "Programa setmanal", href: PROGRAMME_HREF },
  { label: "Canviar l'horari o la carta d'un restaurant", hint: "Restaurants i bars", href: entityHref("restaurants") },
  { label: "Canviar les fotos d'un allotjament", hint: "Allotjaments", href: entityHref("accommodations") },
  { label: "Canviar l'ordre de la portada o amagar-ne un bloc", hint: "La portada", href: HOME_HREF },
  { label: "Canviar les fotos de la galeria", hint: "Pàgines del web", href: sectionHref("gallery") },
  { label: "Canviar el telèfon, les dates de temporada o l'enllaç de reserves", hint: "Dades generals", href: entityHref("site_settings") },
];

/** L'opció del menú activa és la de la llista i la de tot el que penja d'ella. */
export const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Quina opció del menú s'ha de marcar: la més concreta. La fitxa de Gastronomia penja de «Tots els textos» (/admin/sections) i també és
 * l'opció «Gastronomia» (/admin/sections/gastronomy): només s'ha de marcar aquesta.
 */
export const currentHref = (pathname: string, hrefs: readonly string[]) =>
  hrefs.filter((href) => isCurrent(pathname, href)).toSorted((a, b) => b.length - a.length)[0] ?? null;

export type PendingWork = { entity: EntityName; title: string; hidden: number; untranslated: number };

/** Què queda per acabar a cada contingut: el que no es veu a la web i el que li falta algun idioma. Sense res pendent, no hi surt. */
export function pendingWork(lists: readonly { entity: EntityName; items: readonly { published: boolean; missing: readonly string[] }[] }[]): PendingWork[] {
  return lists
    .map(({ entity, items }) => ({
      entity,
      title: ENTITIES[entity].title,
      hidden: items.filter((item) => !item.published).length,
      untranslated: items.filter((item) => item.missing.length > 0).length,
    }))
    .filter((work) => work.hidden > 0 || work.untranslated > 0);
}
