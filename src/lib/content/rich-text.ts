// Markdown lleuger del contingut editable: paràgrafs separats per una línia buida i **negreta**.
// Res més: sense HTML, així un text de l'admin no pot injectar marcat.

export type Inline = { text: string; bold: boolean };

export const paragraphs = (text: string | null | undefined): string[] =>
  (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

export function parseInline(paragraph: string): Inline[] {
  return paragraph
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => (part.startsWith("**") && part.endsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false }));
}
