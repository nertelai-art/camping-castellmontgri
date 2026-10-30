// Com s'arriba a cada contingut des del panell: el menú agrupat per temes i les tasques de la pàgina d'inici.
// Qui edita pensa en el que vol fer («canviar un horari»), no en quina taula ho guarda.

import { ENTITIES, type EntityName } from "./entities";

export const NAV_GROUPS: readonly { title: string; entities: readonly EntityName[] }[] = [
  { title: "La portada", entities: ["sections", "testimonials"] },
  { title: "Allotjaments", entities: ["accommodations", "accommodation_categories"] },
  { title: "Al càmping", entities: ["restaurants", "activities", "services", "map_points"] },
  { title: "Dades", entities: ["site_settings"] },
];

export const TASKS: readonly { label: string; hint: string; entity: EntityName }[] = [
  { label: "Canviar l'horari o la carta d'un restaurant", hint: "Restaurants i bars", entity: "restaurants" },
  { label: "Canviar les fotos d'un allotjament", hint: "Allotjaments", entity: "accommodations" },
  { label: "Afegir una activitat d'animació", hint: "Animació", entity: "activities" },
  { label: "Afegir l'opinió d'un client", hint: "Opinions", entity: "testimonials" },
  { label: "Moure o afegir un punt del mapa", hint: "Punts del mapa", entity: "map_points" },
  { label: "Canviar el telèfon, les dates de temporada o l'enllaç de reserves", hint: "Dades generals", entity: "site_settings" },
];

export const entityHref = (entity: EntityName) => `/admin/${entity}`;

/** L'opció del menú activa és la de la llista i la de tot el que penja d'ella. */
export const isCurrent = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

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
