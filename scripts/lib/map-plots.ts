// Números del plànol (parcel·les i allotjaments) i les cases que els corresponen.

/** Un rètol de número del dibuix: `text` (blanc sobre la parcel·la), `red` (píndola vermella: allotjament del càmping) o `cream` (píndola clara: operador turístic). */
export type Plot = { n: string; x: number; y: number; k: "text" | "red" | "cream" };
export type Roof = { x: number; y: number; size: number; tent: boolean };
export type House = Roof & { plot?: Plot };

// Al dibuix, la píndola és a dalt a la dreta de la casa: la casa cau una mica avall i a l'esquerra.
const HOUSE_OFFSET = { x: -8, y: 10 };
const DEFAULT_SIZE = 30;

/**
 * Una casa per a cada rètol d'allotjament: la del teulat detectat més proper o, si no n'hi ha cap a prop,
 * una de mida estàndard al costat del rètol. Els teulats que no són de cap rètol es conserven (sense número)
 * si no trepitgen una casa ja posada.
 */
export function placeHouses(plots: Plot[], roofs: Roof[], maxDistance = 34, minGap = 16): House[] {
  const lodgings = plots.filter((p) => p.k !== "text");
  const pairs: { plot: Plot; roof: Roof; d: number }[] = [];
  for (const plot of lodgings) {
    for (const roof of roofs) {
      const d = Math.hypot(roof.x - (plot.x + HOUSE_OFFSET.x), roof.y - (plot.y + HOUSE_OFFSET.y));
      if (d <= maxDistance) pairs.push({ plot, roof, d });
    }
  }
  pairs.sort((a, b) => a.d - b.d);

  const roofOf = new Map<Plot, Roof>();
  const taken = new Set<Roof>();
  for (const { plot, roof } of pairs) {
    if (roofOf.has(plot) || taken.has(roof)) continue;
    roofOf.set(plot, roof);
    taken.add(roof);
  }

  const houses: House[] = lodgings.map((plot) => {
    const roof = roofOf.get(plot);
    return roof ? { ...roof, plot } : { x: plot.x + HOUSE_OFFSET.x, y: plot.y + HOUSE_OFFSET.y, size: DEFAULT_SIZE, tent: false, plot };
  });
  for (const roof of roofs) {
    if (taken.has(roof)) continue;
    if (houses.some((h) => Math.hypot(h.x - roof.x, h.y - roof.y) < minGap)) continue;
    houses.push({ ...roof });
  }
  return houses;
}

/**
 * Fusiona lectures repetides del mateix rètol (dues passades, retalls que se solapen): mateix número i a prop.
 * Retorna també els conflictes: dos números diferents al mateix lloc, o el mateix número en dos llocs.
 */
export function mergeReadings(readings: Plot[], near = 14) {
  const plots: (Plot & { count: number })[] = [];
  for (const r of readings) {
    const same = plots.find((p) => p.n === r.n && Math.hypot(p.x - r.x, p.y - r.y) <= near);
    if (same) {
      same.x = Math.round((same.x * same.count + r.x) / (same.count + 1));
      same.y = Math.round((same.y * same.count + r.y) / (same.count + 1));
      same.count++;
    } else plots.push({ ...r, count: 1 });
  }
  const samePlace: [Plot, Plot][] = [];
  const sameNumber: [Plot, Plot][] = [];
  for (const [i, a] of plots.entries()) {
    for (const b of plots.slice(i + 1)) {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (a.n !== b.n && d <= near * 0.7) samePlace.push([a, b]);
      if (a.n === b.n) sameNumber.push([a, b]);
    }
  }
  return { plots, samePlace, sameNumber };
}
