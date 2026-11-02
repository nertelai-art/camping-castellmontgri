// Com s'arriba a cada contingut des del panell: el menú per pàgines del web i temes, i les tasques de la pàgina d'inici.
// Qui edita pensa en el que vol fer («canviar un horari») o en la pàgina que veu, no en quina taula ho guarda.

import { ENTITIES, type EntityName } from "./entities";

export const entityHref = (entity: EntityName) => `/admin/${entity}`;

export const PROGRAMME_HREF = "/admin/programme";
export const HOME_HREF = "/admin/home";

/** La fitxa d'una secció: el text d'una pàgina o d'un bloc. */
const section = (key: string) => `${entityHref("sections")}/${key}`;

export const NAV_GROUPS: readonly { title: string; entities: readonly EntityName[]; pages?: readonly { href: string; title: string }[] }[] = [
  { title: "La portada", pages: [{ href: HOME_HREF, title: "Ordre i blocs" }], entities: ["testimonials", "map_points"] },
  {
    title: "Pàgines del web",
    pages: [
      { href: section("services"), title: "Instal·lacions" },
      { href: section("entertainment"), title: "Animació" },
      { href: section("gastronomy"), title: "Gastronomia" },
      { href: section("surroundings"), title: "Entorn" },
      { href: section("gallery"), title: "Galeria d'imatges" },
    ],
    entities: ["sections"],
  },
  { title: "Allotjaments", entities: ["accommodations", "accommodation_categories"] },
  { title: "Al càmping", pages: [{ href: PROGRAMME_HREF, title: "Programa setmanal" }], entities: ["restaurants", "activities", "services"] },
  {
    title: "Textos legals",
    pages: [
      { href: section("legal-privacy"), title: "Privacitat" },
      { href: section("legal-cookies"), title: "Galetes" },
      { href: section("legal-notice"), title: "Avís legal" },
      { href: section("legal-booking"), title: "Condicions de reserva" },
    ],
    entities: [],
  },
  { title: "Dades", entities: ["site_settings"] },
];

export const TASKS: readonly { label: string; hint: string; href: string }[] = [
  { label: "Posar les activitats de la setmana", hint: "Programa setmanal", href: PROGRAMME_HREF },
  { label: "Canviar l'horari o la carta d'un restaurant", hint: "Restaurants i bars", href: entityHref("restaurants") },
  { label: "Canviar les fotos d'un allotjament", hint: "Allotjaments", href: entityHref("accommodations") },
  { label: "Canviar l'ordre de la portada o amagar-ne un bloc", hint: "La portada", href: HOME_HREF },
  { label: "Canviar les fotos de la galeria", hint: "Pàgines del web", href: section("gallery") },
  { label: "Afegir una activitat d'animació", hint: "Activitats d'animació", href: entityHref("activities") },
  { label: "Afegir l'opinió d'un client", hint: "Opinions", href: entityHref("testimonials") },
  { label: "Moure o afegir un punt del mapa", hint: "Punts del mapa", href: entityHref("map_points") },
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
