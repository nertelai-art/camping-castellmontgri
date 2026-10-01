import { describe, expect, it } from "vitest";
import { nudge, pointerPosition } from "./position";

const box = { left: 100, top: 50, width: 800, height: 492 };

describe("posició d'un punt del mapa", () => {
  it("un clic dins la imatge dona el % amb dos decimals", () => {
    expect(pointerPosition(box, 500, 296)).toEqual({ x: 50, y: 50 });
    expect(pointerPosition(box, 233, 111)).toEqual({ x: 16.63, y: 12.4 });
  });

  it("fora de la imatge s'enganxa a la vora", () => {
    expect(pointerPosition(box, 20, 9000)).toEqual({ x: 0, y: 100 });
  });

  it("una imatge sense mida no divideix per zero", () => {
    expect(pointerPosition({ left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toEqual({ x: 0, y: 0 });
  });

  it("les fletxes mouen un pas i no surten del mapa", () => {
    expect(nudge({ x: 10, y: 10 }, 0.1, -0.1)).toEqual({ x: 10.1, y: 9.9 });
    expect(nudge({ x: 99.95, y: 0.05 }, 0.1, -0.1)).toEqual({ x: 100, y: 0 });
  });
});
