// Markdown lleuger del contingut editable: paràgrafs separats per una línia buida i **negreta**.
// Res més: sense HTML, així un text de l'admin no pot injectar marcat.

export type Inline = { text: string; bold: boolean };

export const paragraphs = (text: string | null | undefined): string[] =>
  (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export type Block = { kind: "heading"; level: 2 | 3; inlines: Inline[] } | { kind: "paragraph"; inlines: Inline[] };

/**
 * Per als textos llargs (les pàgines legals): els paràgrafs que comencen amb «#» són títols. «#» i «##» fan un títol de secció
 * i «###», un subtítol. A la resta del web no es fa servir: un títol enmig d'una descripció curta no hi pinta res.
 */
export const documentBlocks = (text: string | null | undefined): Block[] =>
  paragraphs(text).map((p) => {
    const heading = /^(#{1,3})\s+(.*)$/s.exec(p);
    if (!heading) return { kind: "paragraph", inlines: parseInline(p) };
    return { kind: "heading", level: heading[1]!.length === 3 ? 3 : 2, inlines: parseInline(heading[2]!.trim()) };
  });

export function parseInline(paragraph: string): Inline[] {
  return paragraph
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith("**") && part.endsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false }));
}
