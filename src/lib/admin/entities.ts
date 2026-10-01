// Què es pot editar des del panell i com. Cada entitat té una taula base (el que no depèn de l'idioma)
// i una de traduccions. Aquesta descripció la fan servir el formulari, la validació i el desat: afegir
// un camp editable és afegir-lo aquí.

import { routing } from "@/i18n/routing";

export const LOCALES = routing.locales;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { es: "Castellà", ca: "Català", fr: "Francès", en: "Anglès", nl: "Neerlandès" };

/** `list`: una línia per element; es desa com a llista (text[]). */
type TextField = { name: string; label: string; help?: string; required?: boolean; long?: boolean; list?: boolean };
type BaseField =
  | { name: string; label: string; help?: string; kind: "text"; required?: boolean }
  | { name: string; label: string; help?: string; kind: "number"; decimal?: boolean }
  | { name: string; label: string; help?: string; kind: "date" }
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
  /** Columna de la taula de traduccions que apunta a la base. `null` si la taula base només té una fila. */
  foreignKey: string | null;
  /** Si la taula només té una fila, el seu identificador: la llista hi porta directament. */
  single?: string;
  /** Camps per idioma. El primer és el nom que es veu a les llistes. */
  text: readonly TextField[];
  /** Camps que no depenen de l'idioma. */
  base: readonly BaseField[];
  /** Etiquetes de caché que s'invaliden en desar: les taules des d'on la web llegeix aquest contingut. */
  tags: readonly string[];
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
    tags: ["sections"],
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
    tags: ["services"],
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
    tags: ["restaurants"],
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
    tags: ["activities"],
  },
  accommodations: {
    title: "Allotjaments",
    singular: "allotjament",
    description: "Cada model de bungalow, mobil-home i parcel·la, amb les seves característiques.",
    table: "accommodations",
    key: "id",
    translations: "accommodation_translations",
    foreignKey: "accommodation_id",
    text: [
      { name: "name", label: "Nom", required: true },
      { name: "description", label: "Descripció", long: true, help: RICH },
      { name: "features", label: "Equipament", long: true, list: true, help: "Una cosa per línia: «Terraza cubierta», «Wifi»…" },
    ],
    base: [
      { name: "capacity_max", label: "Persones (màxim)", kind: "number" },
      { name: "size_m2", label: "Superfície (m²)", kind: "number", decimal: true },
      { name: "bedrooms", label: "Habitacions", kind: "number" },
      { name: "bathrooms", label: "Banys", kind: "number" },
      { name: "air_conditioning", label: "Té aire condicionat", kind: "boolean" },
      { name: "is_accessible", label: "Adaptat per a mobilitat reduïda", kind: "boolean" },
      STATUS,
    ],
    // La web llegeix els allotjaments dins de la consulta de les seves categories.
    tags: ["accommodation_categories", "accommodations"],
  },
  accommodation_categories: {
    title: "Tipus d'allotjament",
    singular: "tipus",
    description: "Els grups en què es presenten els allotjaments: bungalows, mobil-homes, parcel·les…",
    table: "accommodation_categories",
    key: "key",
    translations: "accommodation_category_translations",
    foreignKey: "category_key",
    text: [
      { name: "name", label: "Nom", required: true },
      { name: "description", label: "Descripció", long: true, help: RICH },
    ],
    base: [],
    tags: ["accommodation_categories"],
  },
  map_points: {
    title: "Noms del mapa",
    singular: "punt",
    description: "El nom de cada punt del mapa i si s'hi veu. (La posició es canviarà des de l'editor del mapa.)",
    table: "map_points",
    key: "id",
    translations: "map_point_translations",
    foreignKey: "map_point_id",
    text: [{ name: "label", label: "Nom", required: true }],
    base: [STATUS],
    tags: ["map_points"],
  },
  site_settings: {
    title: "Dades generals",
    singular: "dades",
    description: "Telèfon, correus, adreça, temporada, enllaç de reserves i els textos per a Google.",
    table: "site_settings",
    key: "id",
    single: "true",
    translations: "site_settings_translations",
    foreignKey: null,
    text: [
      { name: "seo_title", label: "Títol per a Google", help: "El títol que surt als resultats de cerca i a la pestanya del navegador." },
      { name: "seo_description", label: "Descripció per a Google", long: true, help: "Una o dues frases (uns 150 caràcters)." },
      { name: "season_notice", label: "Avís de temporada", help: "P. ex. «Abierto del 27 de marzo al 4 de octubre»." },
    ],
    base: [
      { name: "brand_name", label: "Nom comercial", kind: "text", required: true },
      { name: "legal_name", label: "Raó social", kind: "text", required: true },
      { name: "phone_display", label: "Telèfon (com es veu)", kind: "text", help: "P. ex. «+34 972 75 16 30»." },
      { name: "phone_e164", label: "Telèfon (per trucar)", kind: "text", help: "Tot seguit i amb prefix: «+34972751630»." },
      { name: "email_info", label: "Correu d'informació", kind: "text" },
      { name: "email_reservations", label: "Correu de reserves", kind: "text" },
      { name: "email_events", label: "Correu d'esdeveniments", kind: "text" },
      { name: "email_jobs", label: "Correu d'ofertes de feina", kind: "text" },
      { name: "email_whistleblowing", label: "Correu del canal de denúncies", kind: "text" },
      { name: "booking_url", label: "Enllaç de reserves", kind: "text", help: "Adreça completa (https://…)." },
      { name: "client_portal_url", label: "Enllaç de l'àrea de clients", kind: "text", help: "Adreça completa (https://…)." },
      { name: "season_open", label: "Obertura de temporada", kind: "date" },
      { name: "season_close", label: "Tancament de temporada", kind: "date" },
      { name: "street", label: "Adreça", kind: "text" },
      { name: "postal_code", label: "Codi postal", kind: "text" },
      { name: "locality", label: "Població", kind: "text" },
      { name: "region", label: "Província", kind: "text" },
      { name: "license_code", label: "Número de registre turístic", kind: "text" },
    ],
    tags: ["site_settings", "site_settings_translations"],
  },
} as const satisfies Record<string, EntityConfig>;

export type EntityName = keyof typeof ENTITIES;
export const ENTITY_NAMES = Object.keys(ENTITIES) as EntityName[];
export const isEntity = (name: string): name is EntityName => name in ENTITIES;

export type Translations = Record<Locale, Record<string, string>>;
export type ContentInput = { base: Record<string, string | boolean | number | null>; translations: Translations };

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
    } else if (field.kind === "number") {
      const raw = text(field.name).replace(",", ".");
      const value = Number(raw);
      if (raw === "") base[field.name] = null;
      else if (!Number.isFinite(value) || value < 0 || (!field.decimal && !Number.isInteger(value))) {
        errors.push(`${field.label}: ha de ser un número${field.decimal ? "" : " sencer"}.`);
      } else base[field.name] = value;
    } else if (field.kind === "date") {
      const value = text(field.name);
      if (value === "") base[field.name] = null;
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) errors.push(`${field.label}: la data no és vàlida.`);
      else base[field.name] = value;
    } else {
      const value = text(field.name);
      if (field.required && !value) errors.push(`Falta «${field.label}».`);
      if (value && field.name.endsWith("_url") && !/^https?:\/\//.test(value)) errors.push(`«${field.label}» ha de començar per https://`);
      if (value && field.name.startsWith("email_") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`«${field.label}» no sembla un correu.`);
      base[field.name] = value;
    }
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
/** Un camp de llista, tal com s'escriu al formulari (una línia per element), convertit en llista. */
export const toList = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

export function missingLocales(config: EntityConfig, translations: Partial<Translations>): Locale[] {
  const main = config.text[0]!.name;
  return LOCALES.filter((locale) => !translations[locale]?.[main]);
}
