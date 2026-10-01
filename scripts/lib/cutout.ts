// Retall d'una peça fotografiada sobre fons blanc.

/** Blanc o gris molt clar i sense color: el fons de l'estudi i l'ombra suau de sota la peça. */
export function isBackdrop(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return min >= 200 && max - min <= 20;
}

/**
 * Màscara del fons (1 = fons): els píxels de color de fons connectats amb la vora de la imatge.
 * Així el blanc de dins de la peça (una brillantor, la carn d'una llimona) no es forada.
 */
export function backgroundMask(rgb: Uint8Array | Buffer, width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  const stack: number[] = [];
  const visit = (p: number) => {
    if (mask[p] || !isBackdrop(rgb[p * 3]!, rgb[p * 3 + 1]!, rgb[p * 3 + 2]!)) return;
    mask[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < width; x++) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    visit(y * width);
    visit(y * width + width - 1);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % width;
    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (p >= width) visit(p - width);
    if (p < width * (height - 1)) visit(p + width);
  }
  return mask;
}
