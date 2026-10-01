// Què es pot editar des del panell i com. Cada entitat té una taula base (el que no depèn de l'idioma)
// i una de traduccions. Aquesta descripció la fan servir el formulari, la validació i el desat: afegir
// un camp editable és afegir-lo aquí.

import { routing } from "@/i18n/routing";

export const LOCALES = routing.locales;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { es: "Castellà", ca: "Català", fr: "Francès", en: "Anglès", nl: "Neerlandès" };

type TextField = { name: string; label: string; help?: string; required?: boolean; long?: boolean };
type BaseField =
  | { name: string; label: string; help?: string; kind: "text" }
  | { name: string; label: string; help?: string; kind: "boolean" }
  | { name: string; label: string; help?: string; kind: "status" };

export type EntityConfig = {
  /** Com es diu al menú i als títols. */
  title: string;
  singular: string;
  description: string;
  table: string;
  /** Columna que identifica la fila (i que va a l'URL). */
  key: string;
  translations: string;
  /** Columna de la taula de traduccions que apunta a la base. */
  foreignKey: string;
  /** Camps per idioma. El primer és el nom que es veu a les llistes. */
  text: readonly TextField[];
  /** Camps que no depenen de l'idioma. */
  base: readonly BaseField[];
  /** Etiqueta de caché que s'invalida en desar (el nom de la taula base). */
  tag: string;
};

const STATUS: BaseField = { name: "status", label: "Estat", kind: "status", help: "Només el que està publicat es veu a la web." };
const HOURS: BaseField = { name: "hours", label: "Horari", kind: "text", help: "Tal com s'ha de veure, p. ex. «18:00 - 23:00h»." };
const RICH = "Pots separar paràgrafs amb una línia en blanc i posar **negreta** entre dos asteriscs.";

export const ENTITIES = {
  sections: {
    title: "Seccions de la portada",
    singular: "secció",
    description: "Els títols i textos de cada bloc de la pàgina principal.",
    table: "sections",
    key: "key",
    translations: "section_translations",
    foreignKey: "section_key",
    text: [
      { name: "title", label: "Títol", required: true },
      { name: "body", label: "Text", long: true, help: RICH },
      { name: "highlight", label: "Frase destacada" },
      { name: "cta_label", label: "Text del botó" },
    ],
    base: [{ name: "is_visible", label: "Es veu a la web", kind: "boolean" }],
    tag: "sections",
  },
  services: {
    title: "Serveis",
    singular: "servei",
    description: "Recepció, supermercat, piscines, bugaderia…",
    table: "services",
    key: "id",
    translations: "service_translations",
    foreignKey: "service_id",
    text: [
      { name: "name", label: "Nom", required: true },
      { name: "description", label: "Descripció", long: true, help: RICH },
    ],
    base: [STATUS],
    tag: "services",
  },
  restaurants: {
    title: "Restaurants i bars",
    singular: "local",
    description: "Cada restaurant, gelateria i bar, amb el seu horari i la carta.",
    table: "restaurants",
    key: "id",
    translations: "restaurant_translations",
    foreignKey: "restaurant_id",
    text: [
      { name: "name", label: "Nom", required: true },
      { name: "description", label: "Descripció", long: true, help: RICH },
      { name: "menu_url", label: "Enllaç a la carta", help: "Adreça completa (https://…) del PDF o la pàgina de la carta en aquest idioma." },
    ],
    base: [HOURS, STATUS],
    tag: "restaurants",
  },
  activities: {
    title: "Animació",
    singular: "activitat",
    description: "Activitats per a infants, famílies i adults.",
    table: "activities",
    key: "id",
    translations: "activity_translations",
    foreignKey: "activity_id",
    text: [
      { name: "name", label: "Nom", required: true },
      { name: "description", label: "Descripció", long: true, help: RICH },
    ],
    base: [HOURS, STATUS],
    tag: "activities",
  },
} as const satisfies Record<string, EntityConfig>;

export type EntityName = keyof typeof ENTITIES;
export const ENTITY_NAMES = Object.keys(ENTITIES) as EntityName[];
export const isEntity = (name: string): name is EntityName => name in ENTITIES;

export type Translations = Record<Locale, Record<string, string>>;
export type ContentInput = { base: Record<string, string | boolean>; translations: Translations };

/** Nom del camp del formulari per a un text en un idioma. */
export const fieldName = (locale: Locale, field: string) => `${locale}.${field}`;

export type ParseResult = { ok: true; value: ContentInput } | { ok: false; errors: string[] };

/**
 * Llegeix el formulari d'una entitat. Un idioma es pot deixar buit del tot (no es tradueix encara),
 * però si té algun text ha de tenir també els camps obligatoris. El castellà és l'idioma per defecte de la web
 * i sempre ha d'estar complet.
 */
export function parseContent(config: EntityConfig, form: FormData): ParseResult {
  const errors: string[] = [];
  const text = (key: string) => String(form.get(key) ?? "").replace(/\r\n/g, "\n").trim();

  const base: ContentInput["base"] = {};
  for (const field of config.base) {
    if (field.kind === "boolean") base[field.name] = form.get(field.name) === "on";
    else if (field.kind === "status") {
      const value = text(field.name);
      if (value !== "draft" && value !== "published") errors.push(`${field.label}: valor desconegut.`);
      else base[field.name] = value;
    } else base[field.name] = text(field.name);
  }

  const translations = {} as Translations;
  for (const locale of LOCALES) {
    const values: Record<string, string> = {};
    for (const field of config.text) values[field.name] = text(fieldName(locale, field.name));
    const empty = Object.values(values).every((v) => v === "");
    if (empty && locale !== routing.defaultLocale) continue;
    for (const field of config.text) {
      if (field.required && !values[field.name]) errors.push(`${LOCALE_NAMES[locale]}: falta «${field.label}».`);
      if (field.name.endsWith("_url") && values[field.name] && !/^https?:\/\//.test(values[field.name]!)) {
        errors.push(`${LOCALE_NAMES[locale]}: «${field.label}» ha de començar per https://`);
      }
    }
    translations[locale] = values;
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: { base, translations } };
}

/** Idiomes que encara no tenen el camp principal: es marquen al formulari i a les llistes. */
export function missingLocales(config: EntityConfig, translations: Partial<Translations>): Locale[] {
  const main = config.text[0]!.name;
  return LOCALES.filter((locale) => !translations[locale]?.[main]);
}
