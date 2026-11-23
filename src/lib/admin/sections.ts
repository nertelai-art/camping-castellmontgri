// Què fa servir de veritat cada secció de la web. Totes les seccions viuen a la mateixa taula i tenen les mateixes columnes,
// però cada bloc en pinta una part: la benvinguda no té foto de secció (són les de la galeria, i n'hi caben 7), les opinions
// només tenen títol… El panell ensenya només el que es veu a la web; si un bloc canvia el que pinta, s'ha de canviar aquí.

import { ENTITIES, type EntityConfig, type EntityName } from "./entities";
import { entityHref, PROGRAMME_HREF } from "./nav";

type SectionField = "eyebrow" | "title" | "body" | "highlight";

export type SectionLayout = {
  /** On surt, en una frase. */
  where: string;
  /** Els textos que pinta, amb l'ajuda que toca en aquest bloc (si no, la general). */
  fields: readonly (SectionField | { name: SectionField; label?: string; help: string })[];
  photo?: { label: string; help: string };
  /** `max`: quantes fotos hi caben. Les que passin no es veurien. */
  gallery?: { label: string; help: string; max?: number };
  /** On s'edita la resta del que surt en aquest bloc. */
  related?: readonly { href: string; label: string }[];
};

const RICH = "Pots separar paràgrafs amb una línia en blanc i posar **negreta** entre dos asteriscs.";

const SUBPAGE = (page: string, related: SectionLayout["related"] = []): SectionLayout => ({
  where: `La pàgina ${page}, i la seva porta a la portada («Més que dormir»).`,
  fields: [
    "eyebrow",
    { name: "title", help: "El títol de la pàgina. També és el de la seva porta a la portada i el de la pestanya del navegador." },
    { name: "body", help: `El text de sota la foto. A la portada en surten les primeres línies, i el primer paràgraf és la descripció per a Google. ${RICH}` },
    { name: "highlight", help: "Una frase curta que surt destacada sota el text." },
  ],
  photo: { label: "Foto de la pàgina", help: "La foto gran de dalt de la pàgina. També és la de la seva porta a la portada." },
  related,
});

const LEGAL: SectionLayout = {
  where: "Una pàgina legal, enllaçada des del peu de la web.",
  fields: ["title", { name: "body", help: "Un paràgraf que comença amb «## » és un títol, i amb «### », un subtítol." }],
};

export const SECTION_LAYOUTS: Record<string, SectionLayout> = {
  hero: {
    where: "La portada, a dalt de tot: la foto gran amb el titular i la cerca de reserva.",
    fields: [
      { name: "title", help: "El titular gran sobre la foto. Curt: cada paraula entra per separat." },
      { name: "body", help: `La frase de sota el titular. ${RICH}` },
    ],
    photo: { label: "Foto de fons", help: "La foto gran de dalt de tot. També és la que surt quan algú comparteix la web." },
    related: [{ href: entityHref("site_settings"), label: "Vídeo promocional i enllaç de reserves (Dades generals)" }],
  },
  welcome: {
    where: "La portada, el bloc de benvinguda: el text entre fotos. També surt a la fitxa de cada allotjament.",
    fields: ["title", "body"],
    gallery: {
      label: "Fotos del bloc",
      max: 7,
      help: "La primera és la gran del mig; les altres sis van al voltant (al mòbil se n'hi veuen quatre). Les cinc primeres surten també a la fitxa de cada allotjament.",
    },
  },
  testimonials: {
    where: "La portada: les notes a les plataformes i les opinions dels clients.",
    fields: ["eyebrow", "title"],
    related: [
      { href: entityHref("review_platforms"), label: "Notes a les plataformes" },
      { href: entityHref("testimonials"), label: "Opinions" },
    ],
  },
  accommodation: {
    where: "La portada (el bloc dels allotjaments) i la pàgina Allotjaments.",
    fields: [
      "eyebrow",
      { name: "title", help: "El títol del bloc i de la pàgina Allotjaments." },
      { name: "highlight", help: "A la portada surt aquesta frase en lloc del text. Buida, hi surt el text." },
      { name: "body", help: `Surt a la pàgina Allotjaments, i el primer paràgraf és la descripció per a Google. ${RICH}` },
    ],
    related: [
      { href: entityHref("accommodations"), label: "Allotjaments" },
      { href: entityHref("accommodation_categories"), label: "Tipus d'allotjament" },
    ],
  },
  explore: {
    where: "La portada: el títol del bloc «Més que dormir». Cada porta surt de la seva pàgina (foto, títol i primeres línies).",
    fields: ["eyebrow", "title", "body", "highlight"],
    related: [
      { href: `${entityHref("sections")}/services`, label: "Instal·lacions" },
      { href: `${entityHref("sections")}/entertainment`, label: "Animació" },
      { href: `${entityHref("sections")}/gastronomy`, label: "Gastronomia" },
      { href: `${entityHref("sections")}/surroundings`, label: "Entorn" },
    ],
  },
  map: {
    where: "La portada: el mapa interactiu del càmping.",
    fields: ["eyebrow", "title", "body"],
    photo: { label: "Plànol de fons", help: "El plànol dibuixat que fa de fons mentre es carrega el mapa 3D, i el que es veu sense 3D. Sense, el bloc no surt." },
    related: [{ href: entityHref("map_points"), label: "Punts del mapa" }],
  },
  directions: {
    where: "La portada: com arribar-hi, amb el mapa de la zona i la ruta.",
    fields: ["eyebrow", "title"],
    related: [{ href: entityHref("site_settings"), label: "Adreça (Dades generals)" }],
  },
  trip: {
    where: "La portada: «El teu viatge, amb la IA».",
    fields: ["eyebrow", "title", "body", "highlight"],
    related: [{ href: entityHref("trip_assistants"), label: "Textos de cada assistent (ChatGPT, Claude, Gemini)" }],
  },
  contact: {
    where: "La portada, l'últim bloc: contacte.",
    fields: ["eyebrow", "title", "body"],
    related: [{ href: entityHref("site_settings"), label: "Telèfon, correus, adreça i temporada (Dades generals)" }],
  },
  services: SUBPAGE("Instal·lacions", [{ href: entityHref("services"), label: "Serveis" }]),
  entertainment: SUBPAGE("Animació", [
    { href: entityHref("activities"), label: "Activitats d'animació" },
    { href: PROGRAMME_HREF, label: "Programa setmanal" },
  ]),
  gastronomy: SUBPAGE("Gastronomia", [{ href: entityHref("restaurants"), label: "Restaurants i bars" }]),
  surroundings: SUBPAGE("Entorn"),
  gallery: {
    where: "La pàgina Galeria (s'hi arriba pel menú).",
    fields: ["eyebrow", "title", "body", "highlight"],
    photo: { label: "Foto de la pàgina", help: "Si en té, surt en gran a dalt de la pàgina. Sense, la pàgina comença pel títol." },
    gallery: { label: "Fotos de la galeria", help: "Totes surten a la pàgina Galeria, en aquest ordre." },
  },
  "legal-privacy": LEGAL,
  "legal-cookies": LEGAL,
  "legal-notice": LEGAL,
  "legal-booking": LEGAL,
};

/** Les seccions que surten a la web. Una que no hi és aquí no la pinta cap pàgina, i el panell no l'ensenya. */
export const isSectionInUse = (key: string) => Object.hasOwn(SECTION_LAYOUTS, key);

export type EditorConfig = EntityConfig & { where?: string; related?: SectionLayout["related"] };

/**
 * La configuració amb què s'edita una fila. Per a les seccions, només els camps, la foto i la galeria que fa servir el seu bloc.
 * La mateixa per al formulari i per a les accions de desar: un camp que el formulari no ensenya no es toca.
 */
export function editorConfig(entity: EntityName, id: string): EditorConfig {
  const config: EntityConfig = ENTITIES[entity];
  if (entity !== "sections") return config;
  const layout = SECTION_LAYOUTS[id];
  if (!layout) return { ...config, text: config.text.filter((field) => field.name === "title" || field.name === "body"), image: undefined, gallery: undefined };
  const text = layout.fields.map((entry) => {
    const name = typeof entry === "string" ? entry : entry.name;
    const field = config.text.find((f) => f.name === name)!;
    return typeof entry === "string" ? field : { ...field, label: entry.label ?? field.label, help: entry.help };
  });
  return {
    ...config,
    text,
    image: layout.photo && config.image ? { column: config.image.column, ...layout.photo } : undefined,
    gallery: layout.gallery && config.gallery ? { ...config.gallery, ...layout.gallery } : undefined,
    where: layout.where,
    related: layout.related,
  };
}

/** Si a la galeria encara hi cap una foto més. */
export const galleryHasRoom = (config: EntityConfig, count: number) => !!config.gallery && (config.gallery.max === undefined || count < config.gallery.max);
