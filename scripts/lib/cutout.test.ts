import { describe, expect, it } from "vitest";
import { backgroundMask, isBackdrop, mainCircle } from "./cutout";

describe("retall sobre fons blanc", () => {
  it("el blanc i l'ombra clara són fons; un color pastís, no", () => {
    expect(isBackdrop(255, 255, 255)).toBe(true);
    expect(isBackdrop(232, 231, 229)).toBe(true); // ombra suau
    expect(isBackdrop(246, 214, 220)).toBe(false); // gelat de maduixa
    expect(isBackdrop(80, 80, 80)).toBe(false); // gris fosc: és peça
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

  it("amb `holes`, el blanc tancat dins la peça també és fons (el forat d'una nansa)", () => {
    const W = 5;
    const rgb = new Uint8Array(W * W * 3).fill(255);
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) if (x !== 2 || y !== 2) rgb.set([20, 20, 20], (y * W + x) * 3);
    expect(backgroundMask(rgb, W, W, 1)[2 * W + 2]).toBe(1);
    // …però si el forat és més petit que el mínim, és una brillantor i es queda
    expect(backgroundMask(rgb, W, W, 5)[2 * W + 2]).toBe(0);
  });

  it("l'ombra grisa de sota la peça és fons, però un gris amb color no", () => {
    expect(isBackdrop(180, 180, 178)).toBe(true);
    expect(isBackdrop(190, 215, 180)).toBe(false); // festuc
  });

  it("troba el cercle d'una peça rodona encara que tingui una nansa a un costat", () => {
    // Disc de radi 10 centrat a (15, 12) en una imatge de 40 × 25, amb una «nansa» a la dreta.
    const W = 40, H = 25;
    const opaque = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 15, y - 12) <= 10) opaque[y * W + x] = 1;
    for (let x = 25; x < 34; x++) for (let y = 10; y <= 14; y++) opaque[y * W + x] = 1;
    const circle = mainCircle(opaque, W, H);
    expect(circle.cx * W).toBeCloseTo(15, 0);
    expect(circle.cy * H).toBeCloseTo(12.5, 0);
    expect(circle.r * W).toBeCloseTo(10.5, 0);
  });
});
