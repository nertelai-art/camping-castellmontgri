import { describe, expect, it } from "vitest";
import { backgroundMask, isBackdrop } from "./cutout";

describe("retall sobre fons blanc", () => {
  it("el blanc i l'ombra clara són fons; un color pastís, no", () => {
    expect(isBackdrop(255, 255, 255)).toBe(true);
    expect(isBackdrop(232, 231, 229)).toBe(true); // ombra suau
    expect(isBackdrop(246, 214, 220)).toBe(false); // gelat de maduixa
    expect(isBackdrop(120, 120, 120)).toBe(false); // gris fosc: és peça
  });

  it("treu el fons que toca la vora però no el blanc tancat dins la peça", () => {
    // 5 × 5: fons blanc, un anell vermell de 3 × 3 i un píxel blanc al mig.
    const W = 5;
    const rgb = new Uint8Array(W * W * 3).fill(255);
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) if (x !== 2 || y !== 2) rgb.set([200, 30, 30], (y * W + x) * 3);
    const mask = backgroundMask(rgb, W, W);
    expect(mask[0]).toBe(1); // cantonada: fons
    expect(mask[1 * W + 1]).toBe(0); // anell: peça
    expect(mask[2 * W + 2]).toBe(0); // blanc de dins: es conserva
  });
});
