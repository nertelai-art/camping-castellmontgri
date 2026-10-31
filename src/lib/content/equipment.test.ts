import { describe, expect, it } from "vitest";
import { equipmentOnly } from "./equipment";

describe("equipament de la fitxa", () => {
  it("treu les files que repeteixen les dades de la fitxa i deixa la resta en ordre", () => {
    expect(equipmentOnly(["Tamaño: 32m²", "Max personas: 6/8", "Hab. litera con cama baja doble: ", "Ropa de cama", "Ducha + WC", "Terraza"])).toEqual(["Ropa de cama", "Ducha + WC", "Terraza"]);
  });
});
