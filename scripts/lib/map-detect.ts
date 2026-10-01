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
 * Omple els forats (on `known` és 0) cap endins, capa a capa: cada píxel pren la mitjana dels veïns que ja
 * tenen color. A diferència d'una mitjana de finestra, el farciment continua el color de la vora (l'aigua
 * continua blava, el camí gris) i no deixa taques grises. El que ja es coneix no es toca.
 */
export function inpaint(rgb: Uint8Array | Buffer, width: number, height: number, known: Uint8Array): Uint8Array {
  const out = new Uint8Array(rgb);
  const done = new Uint8Array(known);
  const neighbours = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1];
  const hasKnownNeighbour = (p: number) => {
    const x = p % width;
    return (x > 0 && done[p - 1]) || (x < width - 1 && done[p + 1]) || (p >= width && done[p - width]) || (p < width * (height - 1) && done[p + width]);
  };
  let frontier: number[] = [];
  for (let p = 0; p < width * height; p++) if (!done[p] && hasKnownNeighbour(p)) frontier.push(p);
  while (frontier.length) {
    // Primer es calcula tota la capa amb el que es coneixia abans, i després es dona per coneguda.
    const colours = new Uint8Array(frontier.length * 3);
    for (const [i, p] of frontier.entries()) {
      const x = p % width;
      let r = 0, g = 0, b = 0, n = 0;
      for (const d of neighbours) {
        const q = p + d;
        if (q < 0 || q >= width * height || !done[q] || Math.abs((q % width) - x) > 1) continue;
        r += out[q * 3]!;
        g += out[q * 3 + 1]!;
        b += out[q * 3 + 2]!;
        n++;
      }
      colours.set([r / n, g / n, b / n], i * 3);
    }
    for (const [i, p] of frontier.entries()) {
      out.set(colours.subarray(i * 3, i * 3 + 3), p * 3);
      done[p] = 1;
    }
    const next = new Set<number>();
    for (const p of frontier) {
      const x = p % width;
      for (const d of [-1, 1, -width, width]) {
        const q = p + d;
        if (q >= 0 && q < width * height && !done[q] && Math.abs((q % width) - x) <= 1) next.add(q);
      }
    }
    frontier = [...next];
  }
  return out;
}

/** Erosiona una màscara: un píxel només queda a 1 si tots els de la seva finestra (2·radius + 1) ho són. */
export function erode(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const iw = width + 1;
  const sum = new Uint32Array(iw * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += mask[y * width + x]!;
      sum[(y + 1) * iw + x + 1] = sum[y * iw + x + 1]! + row;
    }
  }
  const out = new Uint8Array(width * height);
  const side = 2 * radius + 1;
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const total = sum[(y + radius + 1) * iw + x + radius + 1]! - sum[(y - radius) * iw + x + radius + 1]! - sum[(y + radius + 1) * iw + x - radius]! + sum[(y - radius) * iw + x - radius]!;
      if (total === side * side) out[y * width + x] = 1;
    }
  }
  return out;
}
