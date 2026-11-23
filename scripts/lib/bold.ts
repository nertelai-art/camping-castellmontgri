// Posar en **negreta** les paraules clau d'un text del panell: la primera vegada que surt cadascuna, si no hi és ja.

/** Les parts del text que ja són negreta, com a intervals [inici, final). */
const boldRanges = (text: string) => [...text.matchAll(/\*\*[^*]+\*\*/g)].map((m) => [m.index, m.index + m[0].length] as const);

/** Torna el text amb cada frase en negreta i les frases que no hi ha trobat (per revisar-les a mà). */
export function boldPhrases(text: string, phrases: readonly string[]): { text: string; missing: string[] } {
  const missing: string[] = [];
  let out = text;
  for (const phrase of phrases) {
    const ranges = boldRanges(out);
    let at = out.indexOf(phrase);
    // La primera vegada que surt fora d'una negreta que ja hi ha.
    while (at >= 0 && ranges.some(([from, to]) => at >= from && at < to)) at = out.indexOf(phrase, at + 1);
    if (at < 0) {
      if (!ranges.some(([from, to]) => out.slice(from, to).includes(phrase))) missing.push(phrase);
      continue;
    }
    out = `${out.slice(0, at)}**${phrase}**${out.slice(at + phrase.length)}`;
  }
  return { text: out, missing };
}
