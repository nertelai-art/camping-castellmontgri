// Lectura del markdown extret del web antic (reference/content/<lang>/<clau>.md).
// Funcions pures: el seed les fa servir i els tests les proven.

export type Frontmatter = Record<string, string>;

export type Block = {
  title: string;
  /** Paràgrafs de text normal, en markdown lleuger (només **negreta**). */
  body: string[];
  /** Paràgraf sencer en negreta: l'eslògan final de cada bloc. */
  highlight: string | null;
  /** Enllaços que són un paràgraf sol ([TEXT](url)). */
  links: { label: string; url: string }[];
};

export function parseFrontmatter(md: string): { data: Frontmatter; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(md);
  if (!match) return { data: {}, content: md };
  const data: Frontmatter = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    let value = line.slice(i + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    data[line.slice(0, i).trim()] = value;
  }
  return { data, content: md.slice(match[0].length) };
}

const LINK_ONLY = /^\[([^\]]+)\]\(([^)]+)\)$/;
const BOLD_ONLY = /^\*\*([^*]+)\*\*$/;

/** Talla el contingut en blocs per cada «## ». Els «###» i més petits queden dins el bloc. */
export function parseBlocks(content: string): Block[] {
  const blocks: Block[] = [];
  let current: Block | null = null;
  for (const raw of content.split(/\r?\n\s*\r?\n/)) {
    const para = raw.trim();
    if (!para) continue;
    const heading = /^##\s+(.+)$/m.exec(para);
    if (heading && para.startsWith("## ")) {
      current = { title: heading[1]!.trim(), body: [], highlight: null, links: [] };
      blocks.push(current);
      const rest = para.slice(heading[0].length).trim();
      if (rest) addParagraph(current, rest);
      continue;
    }
    if (current) addParagraph(current, para);
  }
  return blocks;
}

function addParagraph(block: Block, para: string) {
  if (para.startsWith("#")) return; // subtítols (###, ####): no són text del bloc
  const link = LINK_ONLY.exec(para);
  if (link) {
    block.links.push({ label: link[1]!, url: link[2]! });
    return;
  }
  const bold = BOLD_ONLY.exec(para);
  if (bold) {
    block.highlight = bold[1]!.trim();
    return;
  }
  block.body.push(tidy(para));
}

/** Arregla els artefactes de l'extracció: «¡ **Hola**» → «¡**Hola**», espais dobles, salts de línia interns. */
export function tidy(text: string): string {
  return text
    .replace(/\s*\r?\n\s*/g, " ")
    .replace(/([¡¿])\s+/g, "$1")
    .replace(/ {2,}/g, " ")
    .trim();
}

/** «RECEPCIÓN» → «Recepción». Deixa igual el que ja té minúscules. */
export function sentenceCase(text: string, locale: string): string {
  const t = text.trim();
  if (t !== t.toLocaleUpperCase(locale)) return t;
  const lower = t.toLocaleLowerCase(locale);
  return lower.charAt(0).toLocaleUpperCase(locale) + lower.slice(1);
}

const MINOR_WORDS = new Set(["de", "del", "la", "el", "les", "los", "las", "i", "y", "a", "al", "d'", "the", "of", "and", "du", "des", "et", "le", "van", "het", "en"]);

/** «HELADERÍA OMBRA» → «Heladería Ombra»: per a noms propis de llocs. Les partícules queden en minúscula. */
export function titleCase(text: string, locale: string): string {
  const t = text.trim();
  if (t !== t.toLocaleUpperCase(locale)) return t;
  return t
    .toLocaleLowerCase(locale)
    .split(/(\s+|-|\/)/)
    .map((word, i) => {
      if (i > 0 && MINOR_WORDS.has(word)) return word;
      // Article apostrofat: «l'era» → «L'Era» a l'inici, «l'Arc» al mig.
      const elided = /^([ld]')(\p{L})(.*)$/u.exec(word);
      if (elided) {
        const article = i > 0 ? elided[1]! : elided[1]!.toLocaleUpperCase(locale);
        return article + elided[2]!.toLocaleUpperCase(locale) + elided[3];
      }
      return word.replace(/\p{L}/u, (c) => c.toLocaleUpperCase(locale));
    })
    .join("");
}

export type Testimonial = { title: string; quote: string; author: string };

/** Opinions del bloc «¿Qué dicen de nosotros?»: #### "títol", paràgrafs, **autor**. Sense repeticions del carrusel. */
export function parseTestimonials(content: string): Testimonial[] {
  const out = new Map<string, Testimonial>();
  const parts = content.split(/^####\s+/m).slice(1);
  for (const part of parts) {
    const [firstLine, ...rest] = part.split(/\r?\n/);
    const paragraphs = rest.join("\n").split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
    const authorIndex = paragraphs.findIndex((p) => BOLD_ONLY.test(p));
    if (authorIndex < 0) continue;
    const author = BOLD_ONLY.exec(paragraphs[authorIndex]!)![1]!.trim();
    const quote = paragraphs.slice(0, authorIndex).map(tidy).join("\n\n");
    const title = firstLine!.trim().replace(/^["“]|["”]$/g, "");
    if (!out.has(author + title)) out.set(author + title, { title, quote, author });
  }
  return [...out.values()];
}

/** «49+22» (casa + terrassa) → 49; «12.5» → 12.5; buit → null. */
export function parseSize(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Píxels de la il·lustració → percentatge (2 decimals), que és com es guarden els punts del plànol. */
export function toPercent(value: number, size: number): number {
  if (value < 0 || value > size) throw new Error(`Coordenada fora del plànol: ${value} de ${size}`);
  return Math.round((value / size) * 10000) / 100;
}
