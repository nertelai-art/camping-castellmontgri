import { describe, expect, it } from "vitest";
import { homeBlocks, moveHomeBlock } from "./home";

describe("blocs de la portada", () => {
  it("surten els blocs de la portada en l'ordre de les seccions, i res més", () => {
    expect(homeBlocks(["hero", "trip", "welcome", "gastronomy", "map", "legal-privacy"])).toEqual(["trip", "welcome", "map"]);
  });

  it("moure un bloc renumera tots els blocs de deu en deu", () => {
    expect(moveHomeBlock(["welcome", "accommodation", "map"], "map", -1)).toEqual([
      { key: "welcome", sort_order: 10 },
      { key: "map", sort_order: 20 },
      { key: "accommodation", sort_order: 30 },
    ]);
  });

  it("el primer no puja i l'últim no baixa", () => {
    expect(moveHomeBlock(["welcome", "map"], "welcome", -1).map((b) => b.key)).toEqual(["welcome", "map"]);
    expect(moveHomeBlock(["welcome", "map"], "map", 1).map((b) => b.key)).toEqual(["welcome", "map"]);
  });
});
