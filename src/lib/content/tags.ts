/** Etiqueta de caché comuna a tot el contingut: l'admin la invalida quan desa. */
export const CONTENT_TAG = "content";

/**
 * Etiquetes d'una petició a l'API REST de Supabase: la comuna i la de la taula (`/rest/v1/<taula>`),
 * perquè en desar un allotjament no calgui refer la pàgina de serveis.
 */
export function tagsForRequest(url: string): string[] {
  const table = /\/rest\/v1\/([a-z_]+)/.exec(new URL(url).pathname)?.[1];
  return table ? [CONTENT_TAG, table] : [CONTENT_TAG];
}
