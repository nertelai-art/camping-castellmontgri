import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ENTITIES, LOCALES, missingLocales, type ContentInput, type EntityName, type Locale, type Translations } from "@/lib/admin/entities";
import { sessionClient } from "./session";

// Lectura i escriptura del panell. Tot passa amb la sessió de l'editor: RLS és qui deixa escriure o no.
// Les taules es trien per configuració (ENTITIES), i el client tipat de Supabase no sap tipar un nom de
// taula que és una variable: aquí es treballa amb el client sense tipus i la forma de les dades la garanteixen
// la configuració i la validació del formulari (parseContent).
async function db() {
  return (await sessionClient()) as unknown as SupabaseClient;
}

type Row = Record<string, unknown> & { translations: Record<string, unknown>[] };
const byLocale = (rows: Record<string, unknown>[]): Partial<Translations> =>
  Object.fromEntries(rows.map((t) => [t.locale as Locale, Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v == null ? "" : String(v)]))]));

export type ContentListItem = { id: string; name: string; published: boolean; missing: Locale[] };

/** Les files d'una entitat, per a la llista: nom (en català o, si no, castellà), si es veu a la web i què falta traduir. */
export async function listContent(entity: EntityName): Promise<ContentListItem[]> {
  const config = ENTITIES[entity];
  const supabase = await db();
  const { data, error } = await supabase.from(config.table).select(`*, translations:${config.translations}(*)`).order("sort_order");
  if (error) throw new Error(`No s'han pogut llegir ${config.title.toLowerCase()}: ${error.message}`);
  const main = config.text[0].name;
  return (data as Row[]).map((row) => {
    const translations = byLocale(row.translations);
    return {
      id: String(row[config.key]),
      name: translations.ca?.[main] || translations.es?.[main] || String(row[config.key]),
      published: "status" in row ? row.status === "published" : row.is_visible !== false,
      missing: missingLocales(config, translations),
    };
  });
}

export type ContentDetail = { id: string; base: Record<string, string | boolean>; translations: Partial<Translations> };

export async function getContent(entity: EntityName, id: string): Promise<ContentDetail | null> {
  const config = ENTITIES[entity];
  const supabase = await db();
  const { data, error } = await supabase.from(config.table).select(`*, translations:${config.translations}(*)`).eq(config.key, id).maybeSingle();
  if (error) throw new Error(`No s'ha pogut llegir la fila: ${error.message}`);
  if (!data) return null;
  const row = data as Row;
  const base: ContentDetail["base"] = {};
  for (const field of config.base) {
    const value = row[field.name];
    base[field.name] = field.kind === "boolean" ? value === true : value == null ? "" : String(value);
  }
  return { id, base, translations: byLocale(row.translations) };
}

/**
 * Desa una fila i les seves traduccions. Els idiomes que arriben buits es deixen com estaven (no s'esborren).
 * Retorna l'error en text si Supabase (o RLS) no ho ha deixat fer.
 */
export async function saveContent(entity: EntityName, id: string, input: ContentInput): Promise<string | null> {
  const config = ENTITIES[entity];
  const supabase = await db();

  // Un camp de text buit a la base és «sense valor», no una cadena buida.
  const base = Object.fromEntries(Object.entries(input.base).map(([k, v]) => [k, v === "" ? null : v]));
  if (Object.keys(base).length) {
    // `select` fa que RLS es noti: si la política no deixa modificar, no torna cap fila en lloc de fallar en silenci.
    const { data, error } = await supabase.from(config.table).update(base).eq(config.key, id).select(config.key);
    if (error) return error.message;
    if (!data?.length) return "No tens permís per modificar aquest contingut, o ja no existeix.";
  }

  const rows = LOCALES.filter((locale) => input.translations[locale]).map((locale) => ({
    [config.foreignKey]: id,
    locale,
    ...Object.fromEntries(Object.entries(input.translations[locale]).map(([k, v]) => [k, v === "" ? null : v])),
  }));
  if (rows.length) {
    const { error } = await supabase.from(config.translations).upsert(rows, { onConflict: `${config.foreignKey},locale` });
    if (error) return error.message;
  }
  return null;
}

/** Quantes files té cada entitat, per al tauler d'inici. */
export async function countContent(entity: EntityName): Promise<number> {
  const supabase = await db();
  const { count } = await supabase.from(ENTITIES[entity].table).select("*", { count: "exact", head: true });
  return count ?? 0;
}
