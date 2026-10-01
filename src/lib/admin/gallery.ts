// Ordre de les fotos d'una galeria.

/** Mou un element un lloc endavant (+1) o enrere (-1). A les vores, o si no hi és, la llista queda igual. */
export function moveItem<T>(items: readonly T[], item: T, delta: 1 | -1): T[] {
  const from = items.indexOf(item);
  const to = from + delta;
  const next = [...items];
  if (from < 0 || to < 0 || to >= items.length) return next;
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}
