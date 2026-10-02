import { describe, expect, it } from "vitest";
import { placeCard } from "./popover";

const card = { width: 300, height: 320 };
const stage = { width: 1000, height: 800 };

describe("fitxa d'un punt del mapa", () => {
  it("amb lloc, surt a sobre del marcador i centrada al punt", () => {
    expect(placeCard({ x: 500, y: 600 }, card, stage)).toEqual({ left: 350, top: 198, below: false, tail: 150 });
  });

  it("si a sobre no hi cap, surt a sota del punt", () => {
    const place = placeCard({ x: 500, y: 200 }, card, stage);
    expect(place.below).toBe(true);
    expect(place.top).toBe(210);
  });

  it("no surt mai del visor pels costats, i la punta segueix el punt", () => {
    expect(placeCard({ x: 20, y: 600 }, card, stage)).toMatchObject({ left: 10, tail: 28 });
    expect(placeCard({ x: 980, y: 600 }, card, stage)).toMatchObject({ left: 690, tail: 272 });
    expect(placeCard({ x: 100, y: 600 }, card, stage)).toMatchObject({ left: 10, tail: 90 });
  });

  it("en un visor baix (mòbil) queda sencera a dins encara que tapi el punt", () => {
    const small = { width: 390, height: 380 };
    const place = placeCard({ x: 195, y: 190 }, card, small);
    expect(place.top).toBeGreaterThanOrEqual(10);
    expect(place.top + card.height).toBeLessThanOrEqual(small.height - 10);
    expect(place.left).toBe(45);
  });

  it("una fitxa més gran que el visor s'enganxa a dalt i a l'esquerra", () => {
    expect(placeCard({ x: 100, y: 100 }, { width: 500, height: 500 }, { width: 400, height: 300 })).toMatchObject({ left: 10, top: 10 });
  });
});
