// Parcel·les i allotjaments numerats del plànol. Les dades surten de `pnpm map:build`; aquest mòdul pesa
// (un miler de números): només l'han d'importar els visors del mapa, que es carreguen quan fan falta.
import data from "@/components/scene/map-scene.data.json";

/** 0 parcel·la, 1 allotjament del càmping, 2 allotjament d'operador turístic. */
export type PlotKind = 0 | 1 | 2;
/** `x`, `y`: on és (la casa, o el número pintat si és una parcel·la), en % de la il·lustració. */
export type MapPlot = { n: string; kind: PlotKind; x: number; y: number };

export const PLOTS: MapPlot[] = (data.plots as (string | number)[][]).map(([n, x, y, kind, hx, hy]) => ({
  n: String(n),
  kind: kind as PlotKind,
  x: (hx ?? x) as number,
  y: (hy ?? y) as number,
}));

const normalize = (query: string) => query.trim().toUpperCase().replace(/\s+/g, "").replace(/^0+(?=\d)/, "");

/** Cerca per número, tal com l'escriuria algú: «0254», « 254 » i «259a» valen. */
export function findPlot(query: string, plots: MapPlot[] = PLOTS): MapPlot | null {
  const wanted = normalize(query);
  if (!wanted) return null;
  return plots.find((p) => p.n === wanted) ?? null;
}

/** El número més proper a un punt (en %), si n'hi ha cap a menys de `maxDistance`. */
export function nearestPlot(x: number, y: number, maxDistance: number, plots: MapPlot[] = PLOTS): MapPlot | null {
  let best: MapPlot | null = null;
  let bestDistance = maxDistance;
  for (const p of plots) {
    const dx = p.x - x;
    if (dx > bestDistance || dx < -bestDistance) continue;
    const d = Math.hypot(dx, p.y - y);
    if (d < bestDistance) {
      best = p;
      bestDistance = d;
    }
  }
  return best;
}
