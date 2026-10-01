import { describe, expect, it } from "vitest";
import { moveItem } from "./gallery";

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
