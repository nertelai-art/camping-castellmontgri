import { describe, expect, it } from "vitest";
import { findPlot, nearestPlot, PLOTS, type MapPlot } from "./plots";

const plots: MapPlot[] = [
  { n: "254", kind: 0, x: 50, y: 50 },
  { n: "259A", kind: 0, x: 52, y: 50 },
  { n: "813", kind: 2, x: 10, y: 10 },
];

describe("findPlot", () => {
  it("troba el número encara que vingui amb espais, zeros o minúscules", () => {
    expect(findPlot(" 254 ", plots)?.n).toBe("254");
    expect(findPlot("0254", plots)?.n).toBe("254");
    expect(findPlot("259a", plots)?.n).toBe("259A");
  });

  it("no inventa res: sense número o amb un que no existeix, res", () => {
    expect(findPlot("", plots)).toBeNull();
    expect(findPlot("25", plots)).toBeNull();
    expect(findPlot("9999", plots)).toBeNull();
  });
});

describe("nearestPlot", () => {
  it("dona el més proper dins del radi", () => {
    expect(nearestPlot(50.4, 50.2, 1.5, plots)?.n).toBe("254");
    expect(nearestPlot(51.8, 50, 1.5, plots)?.n).toBe("259A");
  });

  it("fora del radi no en dona cap", () => {
    expect(nearestPlot(30, 30, 1.5, plots)).toBeNull();
  });
});

describe("dades del plànol", () => {
  it("cada número hi és un sol cop i dins del dibuix", () => {
    expect(PLOTS.length).toBeGreaterThan(900);
    expect(new Set(PLOTS.map((p) => p.n)).size).toBe(PLOTS.length);
    for (const p of PLOTS) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(100);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(100);
    }
  });
});
