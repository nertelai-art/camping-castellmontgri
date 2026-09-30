import { describe, expect, it } from "vitest";
import { localesFor, pickTranslation } from "./translate";

const rows = [
  { locale: "es", title: "Piscinas" },
  { locale: "ca", title: "Piscines" },
];

describe("traduccions de contingut", () => {
  it("tria l'idioma de la pàgina quan existeix", () => {
    expect(pickTranslation(rows, "ca")?.title).toBe("Piscines");
  });

  it("cau al castellà quan falta la traducció", () => {
    expect(pickTranslation(rows, "nl")?.title).toBe("Piscinas");
  });

  it("retorna null si no hi ha res", () => {
    expect(pickTranslation([], "es")).toBeNull();
    expect(pickTranslation(null, "es")).toBeNull();
  });

  it("no demana el castellà dues vegades", () => {
    expect(localesFor("es")).toEqual(["es"]);
    expect(localesFor("fr")).toEqual(["fr", "es"]);
  });
});
