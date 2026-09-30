import { describe, expect, it } from "vitest";
import { centerOn, clampView, MAX_ZOOM, zoomAt } from "./viewport";

const size = { w: 1000, h: 600 };

describe("visor del plànol", () => {
  it("no deixa sortir el plànol del marc", () => {
    expect(clampView({ x: 50, y: 20, z: 1 }, size)).toEqual({ x: 0, y: 0, z: 1 });
    expect(clampView({ x: -5000, y: -5000, z: 2 }, size)).toEqual({ x: -1000, y: -600, z: 2 });
  });

  it("limita el zoom", () => {
    expect(clampView({ x: 0, y: 0, z: 0.3 }, size).z).toBe(1);
    expect(clampView({ x: 0, y: 0, z: 50 }, size).z).toBe(MAX_ZOOM);
  });

  it("en ampliar, el punt sota el cursor no es mou", () => {
    const view = zoomAt({ x: 0, y: 0, z: 1 }, 2, 400, 300, size);
    expect(view.z).toBe(2);
    // El punt (400, 300) del marc era (400, 300) del plànol i hi ha de continuar sent.
    expect((400 - view.x) / view.z).toBe(400);
    expect((300 - view.y) / view.z).toBe(300);
  });

  it("centra un lloc del plànol", () => {
    const view = centerOn(50, 50, 2, size);
    expect(view).toEqual({ x: -500, y: -300, z: 2 });
  });

  it("si el lloc és a la vora, s'hi acosta sense deixar buit", () => {
    expect(centerOn(99, 1, 3, size)).toEqual({ x: -2000, y: 0, z: 3 });
  });
});
