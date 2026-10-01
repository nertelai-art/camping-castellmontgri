// Ordre de les fotos d'una galeria i dels continguts d'una llista.

/** Mou un element un lloc endavant (+1) o enrere (-1). A les vores, o si no hi és, la llista queda igual. */
export function moveItem<T>(items: readonly T[], item: T, delta: 1 | -1): T[] {
  const from = items.indexOf(item);
  const to = from + delta;
  const next = [...items];
  if (from < 0 || to < 0 || to >= items.length) return next;
  [next[from], next[to]] = [next[to]!, next[from]!];
  return next;
}

/**
 * Quines files han de canviar de `sort_order` perquè la llista quedi numerada 0, 1, 2… en aquest ordre.
 * Només les que no tenen ja el seu número: moure un element sol tocar-ne dues.
 */
export function renumber<T>(order: readonly T[], current: ReadonlyMap<T, number>): { item: T; sort_order: number }[] {
  return order.map((item, sort_order) => ({ item, sort_order })).filter(({ item, sort_order }) => current.get(item) !== sort_order);
}
