// Què es pot editar des del panell i com. Cada entitat té una taula base (el que no depèn de l'idioma)
// i una de traduccions. Aquesta descripció la fan servir el formulari, la validació i el desat: afegir
// un camp editable és afegir-lo aquí.

import { routing } from "@/i18n/routing";
import { MAP_ICONS, type MapIcon } from "@/lib/map/icons";
import { MAP_KINDS, type MapKind } from "@/lib/map/kinds";

export const LOCALES = routing.locales;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { es: "Castellà", ca: "Català", fr: "Francès", en: "Anglès", nl: "Neerlandès" };

/** `list`: una línia per element; es desa com a llista (text[]). */
type TextField = { name: string; label: string; help?: string; required?: boolean; long?: boolean; list?: boolean };
type BaseField =
  | { name: string; label: string; help?: string; kind: "text"; required?: boolean; long?: boolean }
  | { name: string; label: string; help?: string; kind: "number"; decimal?: boolean; min?: number; max?: number }
  | { name: string; label: string; help?: string; kind: "date" }
  /** Un punt sobre el mapa: ocupa les columnes `x` i `y` (en % de la il·lustració). */
  | { name: "x"; label: string; help?: string; kind: "position" }
  /** Una tria d'una llista tancada. Amb `optional`, «cap» es desa com a sense valor. */
  | { name: string; label: string; help?: string; kind: "select"; options: readonly { value: string; label: string }[]; optional?: boolean }
  | { name: string; label: string; help?: string; kind: "boolean" }
  | { name: string; label: string; help?: string; kind: "status" };

export type EntityConfig = {
  /** Com es diu al menú i als títols. */
  title: string;
  singular: string;
  /** El nom és femení: «una activitat», «aquesta opinió». */
  feminine?: boolean;
  description: string;
  table: string;
  /** Columna que identifica la fila (i que va a l'URL). */
  key: string;
  /** Taula de traduccions. `null` si el contingut s'escriu en un sol idioma (les opinions) i tot són camps base. */
  translations: string | null;
  /** Sense traduccions, el camp base que fa de nom a les llistes. */
  nameField?: string;
  /** Columna de la taula de traduccions que apunta a la base. `null` si la taula base només té una fila. */
  foreignKey: string | null;
  /** Si la taula només té una fila, el seu identificador: la llista hi porta directament. */
  single?: string;
  /** Camps per idioma. El primer és el nom que es veu a les llistes. */
  text: readonly TextField[];
  /** Camps que no depenen de l'idioma. */
  base: readonly BaseField[];
  /**
   * Si se'n poden afegir i esborrar des del panell: els valors amb què neix una fila nova (sempre en esborrany).
   * Amb `slug`, la taula demana un identificador de text únic i se'n genera un.
   */
  create?: { defaults: Record<string, string | number>; slug?: boolean };
  /** La foto principal: la columna de la taula base que apunta a `media`. */
  image?: { column: string; label: string };
  /** Etiquetes de caché que s'invaliden en desar: les taules des d'on la web llegeix aquest contingut. */
  tags: readonly string[];
};

const STATUS: BaseField = { name: "status", label: "Estat", kind: "status", help: "Només el que està publicat es veu a la web." };
const HOURS: BaseField = { name: "hours", label: "Horari", kind: "text", help: "Tal com s'ha de veure, p. ex. «18:00 - 23:00h»." };
const KIND_NAMES: Record<MapKind, string> = {
  accommodation: "Allotjament",
  food: "Menjar i beure",
  pool: "Piscines",
  leisure: "Lleure i esport",
  service: "Servei",
  landmark: "Lloc d'interès",
};
const ICON_NAMES: Record<MapIcon, string> = {
  reception: "Recepció",
  parking: "Aparcament",
  bus: "Parada de bus",
  charging: "Càrrega de vehicles",
  animation: "Animació",
  recycling: "Reciclatge",
  emergency: "Emergències",
  atm: "Caixer",
  dump: "Buidatge d'autocaravanes",
  carwash: "Rentat de cotxes",
  church: "Església",
  sanitary: "Sanitaris",
  supermarket: "Supermercat",
  laundry: "Bugaderia",
  dishwashing: "Rentaplats",
  disco: "Discoteca",
  arcade: "Sala de jocs",
  waterpark: "Parc aquàtic",
  pool: "Piscina",
  grill: "Grill",
  cafe: "Cafeteria",
  snackbar: "Snack-bar",
  pub: "Pub",
  lera: "L'Era",
  snacks: "Menjar per emportar",
  pizza: "Pizzeria",
  ponies: "Ponis",
  pingpong: "Ping-pong",
  minigolf: "Minigolf",
  tennis: "Tennis",
  basket: "Bàsquet",
  football: "Futbol",
  playground: "Parc infantil",
  petanca: "Petanca",
  archery: "Tir amb arc",
  bikes: "Bicicletes",
  naturalpark: "Parc natural",
  touroperator: "Operador turístic",
  viewpoint: "Mirador",
};
const RICH = "Pots separar paràgrafs amb una línia en blanc i posar **negreta** entre dos asteriscs.";

export const ENTITIES = {
  sections: {
    title: "Seccions de la portada",
    singular: "secció",
    feminine: true,
    description: "Els títols i textos de cada bloc de la pàgina principal.",
    table: "sections",
    image: { column: "media_id", label: "Foto de la secció" },
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
    create: { defaults: {}, slug: true },
    image: { column: "media_id", label: "Foto" },
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
    create: { defaults: {}, slug: true },
    image: { column: "cover_media_id", label: "Foto" },
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
    feminine: true,
    description: "Activitats per a infants, famílies i adults.",
    table: "activities",
    create: { defaults: {}, slug: true },
    image: { column: "cover_media_id", label: "Foto" },
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
    image: { column: "cover_media_id", label: "Foto principal" },
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
    image: { column: "media_id", label: "Foto" },
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
    title: "Punts del mapa",
    singular: "punt",
    description: "El nom de cada punt del mapa, on és i si s'hi veu.",
    table: "map_points",
    key: "id",
    translations: "map_point_translations",
    foreignKey: "map_point_id",
    text: [{ name: "label", label: "Nom", required: true }],
    base: [
      { name: "x", label: "On és", kind: "position", help: "Clica sobre el mapa o arrossega el punt. Amb les fletxes del teclat s'afina." },
      { name: "kind", label: "Tipus de lloc", kind: "select", options: MAP_KINDS.map((value) => ({ value, label: KIND_NAMES[value] })), help: "Decideix el color del punt i a quin grup surt a la llista del mapa." },
      { name: "icon", label: "Icona", kind: "select", optional: true, options: MAP_ICONS.map((value) => ({ value, label: ICON_NAMES[value] })), help: "Sense icona, el punt es pinta amb el color del tipus." },
      STATUS,
    ],
    create: { defaults: { x: 50, y: 50, kind: "service" } },
    tags: ["map_points"],
  },
  testimonials: {
    title: "Opinions",
    singular: "opinió",
    feminine: true,
    description: "El que diuen els clients. Cada opinió es mostra en l'idioma en què es va escriure.",
    table: "testimonials",
    key: "id",
    translations: null,
    foreignKey: null,
    nameField: "author",
    text: [],
    base: [
      { name: "author", label: "Qui ho diu", kind: "text", required: true },
      { name: "title", label: "Títol", kind: "text" },
      { name: "quote", label: "Opinió", kind: "text", required: true, long: true },
      { name: "rating", label: "Estrelles (1 a 5)", kind: "number", min: 1, max: 5 },
      { name: "source", label: "D'on surt", kind: "text", help: "P. ex. «Google» o «Tripadvisor»." },
      { name: "locale", label: "Idioma de l'opinió", kind: "select", options: LOCALES.map((value) => ({ value, label: LOCALE_NAMES[value] })) },
      STATUS,
    ],
    create: { defaults: { author: "", quote: "", locale: "es" } },
    tags: ["testimonials"],
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
      } else if (value < (field.min ?? value) || value > (field.max ?? value)) {
        errors.push(`${field.label}: ha de ser entre ${field.min} i ${field.max}.`);
      } else base[field.name] = value;
    } else if (field.kind === "select") {
      const value = text(field.name);
      if (value === "" && field.optional) base[field.name] = null;
      else if (!field.options.some((option) => option.value === value)) errors.push(`${field.label}: valor desconegut.`);
      else base[field.name] = value;
    } else if (field.kind === "position") {
      for (const axis of ["x", "y"] as const) {
        const raw = text(axis);
        const value = Number(raw);
        if (raw === "" || !Number.isFinite(value) || value < 0 || value > 100) errors.push(`${field.label}: la posició no és vàlida.`);
        else base[axis] = Math.round(value * 100) / 100;
      }
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
  for (const locale of config.translations ? LOCALES : []) {
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
/** Com es diu un contingut a les llistes i al registre: el camp principal en català o, si no, en castellà. */
export function displayName(config: EntityConfig, translations: Partial<Translations>, fallback: string, base: Record<string, unknown> = {}): string {
  if (config.single) return config.title;
  if (config.nameField) return String(base[config.nameField] || "Sense nom");
  const main = config.text[0]!.name;
  // Un identificador generat (uuid) no diu res a ningú; una clau escrita a mà («hero», «pools») sí.
  return translations.ca?.[main] || translations.es?.[main] || (config.key === "id" ? "Sense nom" : fallback);
}

/** Un camp de llista, tal com s'escriu al formulari (una línia per element), convertit en llista. */
export const toList = (value: string) => value.split("\n").map((line) => line.trim()).filter(Boolean);

export function missingLocales(config: EntityConfig, translations: Partial<Translations>): Locale[] {
  if (!config.translations) return [];
  const main = config.text[0]!.name;
  return LOCALES.filter((locale) => !translations[locale]?.[main]);
}
