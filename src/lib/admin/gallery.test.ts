import { describe, expect, it } from "vitest";
import { moveItem, moveWithin, renumber } from "./gallery";

describe("ordre de la galeria", () => {
  it("mou una foto un lloc endavant o enrere", () => {
    expect(moveItem(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
  });

  it("a les vores no es mou", () => {
    expect(moveItem(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(moveItem(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
  });

  it("una foto que no hi és no canvia res, i la llista original no es toca", () => {
    const items = ["a", "b"];
    expect(moveItem(items, "z", 1)).toEqual(["a", "b"]);
    expect(moveItem(items, "a", 1)).not.toBe(items);
    expect(items).toEqual(["a", "b"]);
  });
});

describe("tornar a numerar una llista", () => {
  it("només toca les files que canvien de número", () => {
    const current = new Map([["a", 0], ["b", 1], ["c", 2], ["d", 3]]);
    expect(renumber(["a", "c", "b", "d"], current)).toEqual([
      { item: "c", sort_order: 1 },
      { item: "b", sort_order: 2 },
    ]);
    expect(renumber(["a", "b", "c", "d"], current)).toEqual([]);
  });

  it("endreça números repetits o amb salts (el seed en posa de 10 en 10)", () => {
    const current = new Map([["a", 0], ["b", 10], ["c", 10]]);
    expect(renumber(["a", "b", "c"], current)).toEqual([
      { item: "b", sort_order: 1 },
      { item: "c", sort_order: 2 },
    ]);
  });
});

describe("moure dins d'un grup", () => {
  // a i c són d'un grup; b i d, d'un altre, barrejats a la llista
  it("intercanvia amb el veí del mateix grup i no toca els altres", () => {
    expect(moveWithin(["a", "b", "c", "d"], ["a", "c"], "c", -1)).toEqual(["c", "b", "a", "d"]);
    expect(moveWithin(["a", "b", "c", "d"], ["b", "d"], "b", 1)).toEqual(["a", "d", "c", "b"]);
  });

  it("el primer del grup no puja encara que a la llista en tingui un altre al davant", () => {
    expect(moveWithin(["a", "b", "c", "d"], ["b", "d"], "b", -1)).toEqual(["a", "b", "c", "d"]);
  });

  it("amb un sol grup és com moure a la llista", () => {
    expect(moveWithin(["a", "b", "c"], ["a", "b", "c"], "b", 1)).toEqual(["a", "c", "b"]);
  });
});
