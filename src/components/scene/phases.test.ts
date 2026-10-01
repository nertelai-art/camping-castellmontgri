import { describe, expect, it } from "vitest";
import { FOOD_PIECES } from "./food-pieces";
import { cardPose, FOOD_PHASES, foodStep, pieceTiming, range } from "./phases";

describe("fases de les animacions", () => {
  it("el progrés local va de 0 a 1 i no se'n surt", () => {
    expect(range(0.1, [0.2, 0.6])).toBe(0);
    expect(range(0.4, [0.2, 0.6])).toBeCloseTo(0.5);
    expect(range(0.9, [0.2, 0.6])).toBe(1);
  });

  it("les fases de la gastronomia cobreixen 0-1 sense forats", () => {
    expect(FOOD_PHASES[0][0]).toBe(0);
    expect(FOOD_PHASES.at(-1)![1]).toBe(1);
    for (let i = 1; i < FOOD_PHASES.length; i++) expect(FOOD_PHASES[i]![0]).toBeLessThanOrEqual(FOOD_PHASES[i - 1]![1]);
    for (const [a, b] of FOOD_PHASES) expect(a).toBeLessThan(b);
  });

  it("el pas de la gastronomia segueix el que és a taula", () => {
    expect([0, 0.2, 0.4, 0.6, 0.8, 1].map(foodStep)).toEqual([0, 0, 1, 1, 2, 2]);
  });
});

describe("fotos de la gastronomia", () => {
  const onTable = (p: { x: number; y: number; opacity: number }) => p.opacity === 1 && p.x > 0 && p.x < 100 && p.y > 0 && p.y < 100;

  it("el primer pas ja és a taula en arribar-hi", () => {
    for (let i = 0; i < 3; i++) {
      const pose = cardPose(0, 0, i, 3);
      expect(onTable(pose)).toBe(true);
      expect(pose.scale).toBeCloseTo(1);
    }
  });

  it("les fotos d'un pas entren de fora, s'hi queden i marxen quan arriba el següent", () => {
    const start = FOOD_PHASES[1][0];
    const end = FOOD_PHASES[1][1];
    expect(cardPose(start, 1, 0, 2).opacity).toBe(0); // encara no ha entrat: no es veu
    const settled = cardPose((start + end) / 2 + 0.05, 1, 0, 2);
    expect(onTable(settled)).toBe(true);
    expect(settled.scale).toBeCloseTo(1);
    for (let i = 0; i < 4; i++) expect(cardPose(end, 1, i, 4).opacity).toBeCloseTo(0); // totes han marxat
  });

  it("entren esglaonades: la segona arriba més tard que la primera", () => {
    const p = FOOD_PHASES[1][0] + 0.09;
    expect(cardPose(p, 1, 0, 3).scale).toBeGreaterThan(cardPose(p, 1, 2, 3).scale);
  });

  it("l'últim pas es queda a taula fins al final", () => {
    const pose = cardPose(1, 2, 1, 4);
    expect(onTable(pose)).toBe(true);
    expect(pose.scale).toBeCloseTo(1);
  });

  it("cada foto té el seu lloc: no n'hi ha dues al mateix punt", () => {
    const places = [0, 1, 2, 3].map((i) => cardPose(1, 2, i, 4)).map((p) => `${p.x},${p.y}`);
    expect(new Set(places).size).toBe(4);
  });
});

describe("peces dels plats", () => {
  it("la paella buida ja és a taula en arribar; la resta encara no", () => {
    const count = FOOD_PIECES[0]!.length;
    expect(pieceTiming(0, 0, 0, count).entered).toBe(1);
    expect(pieceTiming(0, 0, count - 1, count).entered).toBe(0);
  });

  it("arriben en ordre i, a mig pas, el plat ja és sencer", () => {
    const count = FOOD_PIECES[0]!.length;
    const early = FOOD_PHASES[0][1] * 0.2;
    expect(pieceTiming(early, 0, 1, count).entered).toBeGreaterThan(pieceTiming(early, 0, 6, count).entered);
    const mid = FOOD_PHASES[0][1] * 0.78;
    for (let i = 0; i < count; i++) expect(pieceTiming(mid, 0, i, count)).toEqual({ entered: 1, left: 0 });
  });

  it("al final del pas han marxat totes, tret de les de l'últim pas", () => {
    expect(pieceTiming(FOOD_PHASES[0][1], 0, 3, 12).left).toBeCloseTo(1);
    expect(pieceTiming(1, 2, 0, 3).left).toBe(0);
  });

  it("cada peça cau dins la taula i té una imatge amb mida", () => {
    for (const piece of FOOD_PIECES.flat()) {
      expect(piece.src).toMatch(/^\/food\/[a-z-]+\.webp$/);
      expect(piece.x).toBeGreaterThan(0);
      expect(piece.x).toBeLessThan(100);
      expect(piece.y).toBeGreaterThan(0);
      expect(piece.y).toBeLessThan(100);
      expect(piece.size[0] * piece.size[1]).toBeGreaterThan(0);
    }
  });
});

