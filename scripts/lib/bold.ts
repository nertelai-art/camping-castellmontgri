// Posar en **negreta** les paraules clau d'un text del panell: la primera vegada que surt cadascuna, si no és ja en negreta enlloc.
// Passar-lo dues vegades dona el mateix text.

/** Les parts del text que ja són negreta, com a intervals [inici, final). */
const boldRanges = (text: string) => [...text.matchAll(/\*\*[^*]+\*\*/g)].map((m) => [m.index, m.index + m[0].length] as const);

/** Torna el text amb cada frase en negreta i les frases que no hi ha trobat (per revisar-les a mà). */
export function boldPhrases(text: string, phrases: readonly string[]): { text: string; missing: string[] } {
  const missing: string[] = [];
  let out = text;
  for (const phrase of phrases) {
    // Si ja és en negreta en algun lloc, ja hi és: tornar-lo a passar no ha de posar-ne una altra.
    if (boldRanges(out).some(([from, to]) => out.slice(from, to).includes(phrase))) continue;
    const at = out.indexOf(phrase);
    if (at < 0) {
      missing.push(phrase);
      continue;
    }
    out = `${out.slice(0, at)}**${phrase}**${out.slice(at + phrase.length)}`;
  }
  return { text: out, missing };
}
