import { describe, expect, it } from "vitest";
import { easeOutBounce, FOOD_PHASES, foodStep, HERO_PHASES, heroStep, range, type Range } from "./phases";

const phases = (o: Record<string, Range>) => Object.values(o);

describe("fases de les escenes", () => {
  it("el progrés local va de 0 a 1 i no se'n surt", () => {
    expect(range(0.1, [0.2, 0.6])).toBe(0);
    expect(range(0.4, [0.2, 0.6])).toBeCloseTo(0.5);
    expect(range(0.9, [0.2, 0.6])).toBe(1);
  });

  it("el rebot acaba exactament a 1", () => {
    expect(easeOutBounce(0)).toBe(0);
    expect(easeOutBounce(1)).toBeCloseTo(1);
  });

  it.each([
    ["hero", HERO_PHASES],
    ["gastronomia", FOOD_PHASES],
  ])("les fases del %s cobreixen 0-1 sense forats", (_, o) => {
    const list = phases(o).toSorted((a, b) => a[0] - b[0]);
    expect(list[0]![0]).toBe(0);
    expect(Math.max(...list.map((r) => r[1]))).toBeGreaterThanOrEqual(0.95);
    for (let i = 1; i < list.length; i++) expect(list[i]![0]).toBeLessThanOrEqual(list[i - 1]![1]);
    for (const [a, b] of list) expect(a).toBeLessThan(b);
  });

  it("el pas del hero canvia a mig recorregut", () => {
    expect(heroStep(0)).toBe(0);
    expect(heroStep(0.49)).toBe(0);
    expect(heroStep(0.5)).toBe(1);
    expect(heroStep(1)).toBe(1);
  });

  it("el pas de la gastronomia segueix l'objecte que és al centre", () => {
    expect([0, 0.2, 0.4, 0.6, 0.8, 1].map(foodStep)).toEqual([0, 0, 1, 1, 2, 2]);
  });
});
