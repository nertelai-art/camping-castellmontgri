// L'editor visual: la web porta marques `data-edit="entitat:referència"` als blocs que es poden editar, i el panell
// les llegeix per saber què s'ha clicat. La referència és el que la web ja coneix de cada contingut (la clau d'una
// secció, el `slug` d'un servei…), no l'identificador intern: el panell el resol en obrir l'editor.

import { ENTITIES, isEntity, LOCALES, type EntityName, type Locale } from "./entities";

export type EditTarget = { entity: EntityName; ref: string };

/** Llegeix una marca `data-edit`. `null` si no és d'una entitat que el panell sàpiga editar. */
export function parseEditMark(mark: string | null | undefined): EditTarget | null {
  if (!mark) return null;
  const at = mark.indexOf(":");
  if (at <= 0) return null;
  const entity = mark.slice(0, at);
  const ref = mark.slice(at + 1);
  return isEntity(entity) && ref ? { entity, ref } : null;
}

export const editMark = (target: EditTarget) => `${target.entity}:${target.ref}`;

/** Adreça de l'editor visual amb aquest contingut obert. */
export const visualHref = (target: EditTarget) => `/admin/visual/${target.entity}/${encodeURIComponent(target.ref)}`;

/** El contingut obert segons l'adreça del panell (`/admin/visual/services/reception`), o `null` si no n'hi ha cap. */
export function targetFromPath(pathname: string): EditTarget | null {
  const [, admin, visual, entity, ref, ...rest] = pathname.split("/");
  if (admin !== "admin" || visual !== "visual" || !entity || !ref || rest.length) return null;
  try {
    return parseEditMark(`${entity}:${decodeURIComponent(ref)}`);
  } catch {
    return null;
  }
}

/** Com s'anomena un bloc a les molles de pa: «Secció», «Restaurant»… */
export const targetKind = (target: EditTarget) => {
  const { singular } = ENTITIES[target.entity];
  return singular.charAt(0).toUpperCase() + singular.slice(1);
};

/** Avisos entre els formularis del panell i l'editor visual (esdeveniments de finestra). */
export const SAVED_EVENT = "admin:saved";
export const DRAFT_EVENT = "admin:draft";
export const LOCALE_EVENT = "admin:locale";
export type DraftDetail = { name: string; value: string };

/**
 * Un camp del formulari, tal com es diu (`ca.title`, `hours`): de quin idioma és i quin camp del contingut.
 * Sense idioma, el camp val per a tots.
 */
export function parseFieldName(name: string): { locale: Locale | null; field: string } {
  const at = name.indexOf(".");
  const prefix = name.slice(0, at);
  return at > 0 && (LOCALES as readonly string[]).includes(prefix) ? { locale: prefix as Locale, field: name.slice(at + 1) } : { locale: null, field: name };
}
