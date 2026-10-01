// Retall d'una peça fotografiada sobre fons blanc.

/**
 * Fons de l'estudi: blanc o gris clar gairebé sense color. Inclou l'ombra suau de sota la peça, que és
 * un gris neutre més fosc; un color pastís (un gelat) té prou tint per no confondre-s'hi.
 */
export function isBackdrop(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const tint = max - min;
  return (min >= 200 && tint <= 20) || (min >= 110 && tint <= 14);
}

/**
 * Màscara del fons (1 = fons): els píxels de color de fons connectats amb la vora de la imatge.
 * Així el blanc de dins de la peça (una brillantor, la carn d'una llimona) no es forada.
 * Amb `holeArea`, també és fons qualsevol taca de blanc tancada dins la peça que faci almenys aquells píxels
 * (el forat d'una nansa); les brillantors, que són petites, es queden.
 */
export function backgroundMask(rgb: Uint8Array | Buffer, width: number, height: number, holeArea = Infinity): Uint8Array {
  const backdrop = (p: number) => isBackdrop(rgb[p * 3]!, rgb[p * 3 + 1]!, rgb[p * 3 + 2]!);
  const mask = new Uint8Array(width * height);
  /** Omple des de `seeds` tot el fons connectat i en retorna els píxels. */
  const flood = (seeds: number[]) => {
    const filled: number[] = [];
    const stack: number[] = [];
    const visit = (p: number) => {
      if (mask[p] || !backdrop(p)) return;
      mask[p] = 1;
      stack.push(p);
      filled.push(p);
    };
    seeds.forEach(visit);
    while (stack.length) {
      const p = stack.pop()!;
      const x = p % width;
      if (x > 0) visit(p - 1);
      if (x < width - 1) visit(p + 1);
      if (p >= width) visit(p - width);
      if (p < width * (height - 1)) visit(p + width);
    }
    return filled;
  };

  const border: number[] = [];
  for (let x = 0; x < width; x++) border.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) border.push(y * width, y * width + width - 1);
  flood(border);

  if (holeArea !== Infinity) {
    for (let p = 0; p < width * height; p++) {
      if (mask[p] || !backdrop(p)) continue;
      const hole = flood([p]);
      // Un forat de debò deixa veure el fons blanc pur; una brillantor de la peça és grisa o petita.
      const white = hole.filter((q) => Math.min(rgb[q * 3]!, rgb[q * 3 + 1]!, rgb[q * 3 + 2]!) >= 238).length;
      if (hole.length < holeArea || white < hole.length * 0.6) for (const q of hole) mask[q] = 2;
    }
    for (let p = 0; p < width * height; p++) if (mask[p] === 2) mask[p] = 0;
  }
  return mask;
}

/**
 * Per a peces rodones (una rodanxa, una bola): marca com a fons tot el que cau fora de l'el·lipse que envolta
 * els píxels amb color de debò. Treu les ombres i reflexos tenyits que el color sol no distingeix de la peça.
 */
export function clipToColouredEllipse(rgb: Uint8Array | Buffer, width: number, height: number, mask: Uint8Array, minTint = 26, margin = 0.02): void {
  let x0 = width, y0 = height, x1 = 0, y1 = 0;
  for (let p = 0; p < width * height; p++) {
    if (mask[p]) continue;
    const r = rgb[p * 3]!, g = rgb[p * 3 + 1]!, b = rgb[p * 3 + 2]!;
    if (Math.max(r, g, b) - Math.min(r, g, b) < minTint) continue;
    const x = p % width;
    const y = (p - x) / width;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  if (x1 <= x0 || y1 <= y0) return;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const rx = ((x1 - x0) / 2) * (1 + margin), ry = ((y1 - y0) / 2) * (1 + margin);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 > 1) mask[y * width + x] = 1;
    }
  }
}

/**
 * El cercle més gran d'una peça rodona amb nanses (una paella vista des de dalt), dins la seva caixa:
 * centre i radi en fracció de l'amplada i l'alçada. Les nanses sobresurten del cercle, però no pas per baix
 * ni per la dreta a mitja alçada: el cercle es treu del punt més baix, del més alt i del més a la dreta
 * mirant només una franja central, on no hi ha nanses.
 */
export function mainCircle(opaque: Uint8Array, width: number, height: number) {
  const column = (x: number) => {
    let top = -1;
    let bottom = -1;
    for (let y = 0; y < height; y++) {
      if (!opaque[y * width + x]) continue;
      if (top < 0) top = y;
      bottom = y;
    }
    return { top, bottom };
  };
  // La columna on la peça és més alta és la del diàmetre vertical.
  const columns = Array.from({ length: width }, (_, x) => ({ x, ...column(x) })).filter((c) => c.top >= 0);
  const tallest = Math.max(...columns.map((c) => c.bottom - c.top));
  // Prop del diàmetre moltes columnes fan gairebé el mateix: es pren la del mig.
  const widest = columns.filter((c) => c.bottom - c.top >= tallest - 1);
  const best = widest[Math.floor(widest.length / 2)]!;
  const radius = (best.bottom - best.top + 1) / 2;
  return { cx: best.x / width, cy: (best.top + radius) / height, r: radius / width };
}
