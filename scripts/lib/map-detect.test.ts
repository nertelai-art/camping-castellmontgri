import { describe, expect, it } from "vitest";
import { classify, components, densityPeaks, erode, inpaint, isGround, KIND_INDEX, KINDS } from "./map-detect";

const hex = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)] as const;
const kindOf = (h: string) => KINDS[classify(...hex(h))];

describe("detecció del plànol", () => {
  it("reconeix els colors mostrejats de la il·lustració", () => {
    expect(kindOf("#556622")).toBe("treeDark");
    expect(kindOf("#888888")).toBe("roofGrey");
    expect(kindOf("#445555")).toBe("roofSlate");
    expect(kindOf("#bb6633")).toBe("roofOrange");
    expect(kindOf("#ddcc88")).toBe("tent");
    expect(kindOf("#66bbee")).toBe("water");
  });

  it("no confon el terra amb objectes", () => {
    for (const ground of ["#bbbbbb", "#ccaa88", "#889944", "#88aa44", "#eeeecc", "#ffffff", "#000000"]) {
      expect(kindOf(ground), ground).toBe("none");
    }
  });

  it("agrupa els píxels en taques i en dona el centre i la mida", () => {
    // 6×4:  dues taques de «roofGrey» (una de 2×2 i una d'1 píxel)
    const g = KIND_INDEX.roofGrey;
    // prettier-ignore
    const grid = new Uint8Array([
      g, g, 0, 0, 0, 0,
      g, g, 0, 0, 0, g,
      0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0,
    ]);
    const found = components(grid, 6, 4, "roofGrey");
    expect(found).toHaveLength(2);
    expect(found[0]).toMatchObject({ area: 4, cx: 0.5, cy: 0.5, x0: 0, y0: 0, x1: 1, y1: 1 });
    expect(found[1]).toMatchObject({ area: 1, cx: 5, cy: 1 });
  });

  it("troba un pic per cada grup dens i descarta els veïns massa propers", () => {
    const t = KIND_INDEX.treeDark;
    const w = 60, h = 20;
    const grid = new Uint8Array(w * h);
    // dos «arbres» de 8×8 separats 30 píxels
    for (const cx of [14, 44]) for (let y = 6; y < 14; y++) for (let x = cx - 4; x < cx + 4; x++) grid[y * w + x] = t;
    const peaks = densityPeaks(grid, w, h, "treeDark", { window: 8, step: 2, minDensity: 0.5, minDistance: 12 });
    expect(peaks).toHaveLength(2);
    expect(peaks.map((p) => p.x).sort((a, b) => a - b)).toEqual([14, 44]);
    expect(peaks.every((p) => p.y === 10 && p.density === 1)).toBe(true);
  });

  it("distingeix el terra dels objectes dibuixats a sobre", () => {
    for (const g of ["#bbbbbb", "#ccaa88", "#88aa44", "#66bbee", "#556622"]) expect(isGround(...hex(g)), g).toBe(true);
    for (const o of ["#888888", "#bb6633", "#ffffff", "#111111", "#dd2222", "#ddcc88"]) expect(isGround(...hex(o)), o).toBe(false);
  });
});

describe("inpaint i erode", () => {
  it("omple un forat amb el color del voltant i no toca el que ja es coneixia", () => {
    const W = 7, H = 7;
    const rgb = new Uint8Array(W * H * 3);
    const known = new Uint8Array(W * H).fill(1);
    for (let p = 0; p < W * H; p++) rgb.set([10, 120, 200], p * 3); // tot «aigua»
    for (const [x, y] of [[2, 2], [3, 2], [4, 2], [2, 3], [3, 3], [4, 3], [2, 4], [3, 4], [4, 4]] as const) {
      known[y * W + x] = 0;
      rgb.set([255, 255, 255], (y * W + x) * 3); // una icona blanca a sobre
    }
    const out = inpaint(rgb, W, H, known);
    expect([...out.subarray((3 * W + 3) * 3, (3 * W + 3) * 3 + 3)]).toEqual([10, 120, 200]);
    expect([...out.subarray(0, 3)]).toEqual([10, 120, 200]);
  });

  it("erode treu la vora d'una taca", () => {
    const W = 5, H = 5;
    const mask = new Uint8Array(W * H).fill(1);
    mask[0] = 0;
    const out = erode(mask, W, H, 1);
    expect(out[2 * W + 2]).toBe(1); // el centre té tots els veïns
    expect(out[1 * W + 1]).toBe(0); // toca el forat
    expect(out[0 * W + 4]).toBe(0); // la vora de la imatge no té finestra sencera
  });
});
