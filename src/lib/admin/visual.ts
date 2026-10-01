// L'editor visual: la web porta marques `data-edit="entitat:referència"` als blocs que es poden editar, i el panell
// les llegeix per saber què s'ha clicat. La referència és el que la web ja coneix de cada contingut (la clau d'una
// secció, el `slug` d'un servei…), no l'identificador intern: el panell el resol en obrir l'editor.

import { ENTITIES, isEntity, type EntityName } from "./entities";

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
