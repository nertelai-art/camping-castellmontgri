// Detecció d'objectes a la il·lustració del plànol: classifica cada píxel pel color i agrupa'ls en taques.
// Funcions pures (sense sharp ni fitxers) perquè es puguin provar.

export const KINDS = ["none", "treeDark", "roofGrey", "roofSlate", "roofOrange", "tent", "water"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_INDEX = Object.fromEntries(KINDS.map((k, i) => [k, i])) as Record<Kind, number>;

/** Classe d'un píxel pel seu color. Els llindars surten de mostrejar la il·lustració de 2026. */
export function classify(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const s = max === 0 ? 0 : (max - min) / max;
  let h = 0;
  if (max !== min) {
    if (max === r) h = ((g - b) / (max - min)) * 60;
    else if (max === g) h = ((b - r) / (max - min)) * 60 + 120;
    else h = ((r - g) / (max - min)) * 60 + 240;
    if (h < 0) h += 360;
  }
  if (h >= 185 && h <= 220 && s > 0.3 && v > 0.45) return KIND_INDEX.water;
  // Ombra de la capçada: verd fosc, o verd «de fulla» (més blavós que la gespa) a mitja llum.
  if (h >= 70 && h <= 140 && s > 0.3 && v >= 0.2 && (v < 0.5 || (h >= 95 && v < 0.6))) return KIND_INDEX.treeDark;
  if (s < 0.14 && v >= 0.34 && v < 0.62) return KIND_INDEX.roofGrey;
  if (h >= 175 && h <= 260 && s >= 0.1 && s < 0.38 && v >= 0.24 && v < 0.5) return KIND_INDEX.roofSlate;
  if (h >= 10 && h <= 30 && s > 0.5 && v >= 0.55 && v <= 0.82) return KIND_INDEX.roofOrange;
  if (h >= 40 && h <= 56 && s >= 0.28 && s <= 0.52 && v > 0.75) return KIND_INDEX.tent;
  return KIND_INDEX.none;
}

export type Component = { area: number; cx: number; cy: number; x0: number; y0: number; x1: number; y1: number };

/** Taques connexes (4 veïns) d'una classe. Recorregut iteratiu: la il·lustració té 5,5 milions de píxels. */
export function components(kinds: Uint8Array, width: number, height: number, kind: Kind): Component[] {
  const target = KIND_INDEX[kind];
  const seen = new Uint8Array(kinds.length);
  const stack = new Int32Array(kinds.length);
  const out: Component[] = [];
  for (let start = 0; start < kinds.length; start++) {
    if (kinds[start] !== target || seen[start]) continue;
    let top = 0;
    stack[top++] = start;
    seen[start] = 1;
    let area = 0, sx = 0, sy = 0, x0 = width, y0 = height, x1 = 0, y1 = 0;
    while (top > 0) {
      const p = stack[--top]!;
      const x = p % width;
      const y = (p - x) / width;
      area++;
      sx += x;
      sy += y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const q of [x > 0 ? p - 1 : -1, x < width - 1 ? p + 1 : -1, y > 0 ? p - width : -1, y < height - 1 ? p + width : -1]) {
        if (q < 0 || kinds[q] !== target || seen[q]) continue;
        seen[q] = 1;
        stack[top++] = q;
      }
    }
    out.push({ area, cx: sx / area, cy: sy / area, x0, y0, x1, y1 });
  }
  return out;
}

export type Peak = { x: number; y: number; density: number };

/**
 * Punts on una classe és més densa (p. ex. on hi ha un arbre dins una massa de verd).
 * Calcula la densitat en finestres amb una imatge integral i es queda amb els màxims, de més a
 * menys dens, descartant els que queden massa a prop d'un que ja s'ha triat.
 */
export function densityPeaks(
  kinds: Uint8Array,
  width: number,
  height: number,
  kind: Kind,
  { window = 28, step = 6, minDensity = 0.22, minDistance = 30 } = {},
): Peak[] {
  const target = KIND_INDEX[kind];
  const iw = width + 1;
  const integral = new Uint32Array(iw * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      if (kinds[y * width + x] === target) row++;
      integral[(y + 1) * iw + x + 1] = integral[y * iw + x + 1]! + row;
    }
  }
  const half = window >> 1;
  const candidates: Peak[] = [];
  for (let y = half; y < height - half; y += step) {
    for (let x = half; x < width - half; x += step) {
      const x0 = x - half, y0 = y - half, x1 = x + half, y1 = y + half;
      const count = integral[y1 * iw + x1]! - integral[y0 * iw + x1]! - integral[y1 * iw + x0]! + integral[y0 * iw + x0]!;
      const density = count / (window * window);
      if (density >= minDensity) candidates.push({ x, y, density });
    }
  }
  candidates.sort((a, b) => b.density - a.density || a.y - b.y || a.x - b.x);
  // Quadrícula d'ocupació per descartar veïns sense comparar tots contra tots.
  const cell = minDistance;
  const cols = Math.ceil(width / cell);
  const grid = new Map<number, Peak[]>();
  const peaks: Peak[] = [];
  for (const c of candidates) {
    const gx = Math.floor(c.x / cell), gy = Math.floor(c.y / cell);
    let free = true;
    for (let dy = -1; dy <= 1 && free; dy++) {
      for (let dx = -1; dx <= 1 && free; dx++) {
        for (const p of grid.get((gy + dy) * cols + gx + dx) ?? []) {
          if ((p.x - c.x) ** 2 + (p.y - c.y) ** 2 < minDistance * minDistance) {
            free = false;
            break;
          }
        }
      }
    }
    if (!free) continue;
    peaks.push(c);
    const key = gy * cols + gx;
    grid.set(key, [...(grid.get(key) ?? []), c]);
  }
  return peaks;
}

/**
 * Un píxel és «terra» (camí, gespa, aigua, terra batuda) si no és un objecte dibuixat a sobre:
 * ni teulat, ni tenda, ni blanc o negre d'icones i números, ni el vermell dels extintors.
 */
export function isGround(r: number, g: number, b: number): boolean {
  const k = classify(r, g, b);
  if (k !== KIND_INDEX.none && k !== KIND_INDEX.water && k !== KIND_INDEX.treeDark) return false;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max / 255;
  const s = max === 0 ? 0 : (max - min) / max;
  if (v < 0.28) return false; // negre d'icones i números
  if (s < 0.12 && v > 0.8) return false; // blanc de parets, rètols i icones
  if (r > 170 && g < 90 && b < 90) return false; // vermell d'extintors i sortides
  return true;
}

/**
 * Terra «net»: cada píxel passa a ser la mitjana dels píxels de terra del seu voltant (imatges
 * integrals), de manera que cases, icones i números desapareixen i queda el color del que hi ha a sota.
 * Amb `keep` > 0 només s'omplen els objectes i les seves vores; la resta del dibuix queda nítida.
 */
export function cleanGround(rgb: Uint8Array | Buffer, width: number, height: number, ground: Uint8Array, radius = 9, keep = 0): Uint8Array {
  const iw = width + 1;
  const sums = [0, 1, 2].map(() => new Float64Array(iw * (height + 1)));
  const count = new Uint32Array(iw * (height + 1));
  for (let y = 0; y < height; y++) {
    let cr = 0, cg = 0, cb = 0, cn = 0;
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      if (ground[p]) {
        cr += rgb[p * 3]!;
        cg += rgb[p * 3 + 1]!;
        cb += rgb[p * 3 + 2]!;
        cn++;
      }
      const i = (y + 1) * iw + x + 1;
      const up = y * iw + x + 1;
      sums[0]![i] = sums[0]![up]! + cr;
      sums[1]![i] = sums[1]![up]! + cg;
      sums[2]![i] = sums[2]![up]! + cb;
      count[i] = count[up]! + cn;
    }
  }
  const out = new Uint8Array(width * height * 3);
  const box = (a: Float64Array | Uint32Array, x0: number, y0: number, x1: number, y1: number) =>
    a[y1 * iw + x1]! - a[y0 * iw + x1]! - a[y1 * iw + x0]! + a[y0 * iw + x0]!;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 3;
      // Amb `keep`, el terra que té terra a tot el voltant (a `keep` píxels) es deixa tal com és: no s'esborrona.
      if (keep > 0 && x >= keep && y >= keep && x + keep < width && y + keep < height) {
        const side = 2 * keep + 1;
        if (box(count, x - keep, y - keep, x + keep + 1, y + keep + 1) === side * side) {
          out[o] = rgb[o]!;
          out[o + 1] = rgb[o + 1]!;
          out[o + 2] = rgb[o + 2]!;
          continue;
        }
      }
      let n = 0, r = radius, x0 = 0, y0 = 0, x1 = 0, y1 = 0;
      // Si al voltant no hi ha prou terra (sota un edifici gran), s'eixampla la finestra.
      for (; r <= radius * 8; r *= 2) {
        x0 = Math.max(0, x - r);
        y0 = Math.max(0, y - r);
        x1 = Math.min(width, x + r + 1);
        y1 = Math.min(height, y + r + 1);
        n = box(count, x0, y0, x1, y1);
        if (n >= 12) break;
      }
      if (n === 0) {
        out[o] = rgb[o]!;
        out[o + 1] = rgb[o + 1]!;
        out[o + 2] = rgb[o + 2]!;
      } else {
        out[o] = box(sums[0]!, x0, y0, x1, y1) / n;
        out[o + 1] = box(sums[1]!, x0, y0, x1, y1) / n;
        out[o + 2] = box(sums[2]!, x0, y0, x1, y1) / n;
      }
    }
  }
  return out;
}
