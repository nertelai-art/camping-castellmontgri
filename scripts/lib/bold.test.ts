import { describe, expect, it } from "vitest";
import { boldPhrases } from "./bold";

describe("paraules clau en negreta", () => {
  it("posa en negreta la primera vegada que surt cada frase", () => {
    expect(boldPhrases("Piscines i piscines al càmping", ["Piscines", "càmping"]).text).toBe("**Piscines** i piscines al **càmping**");
  });

  it("no torna a posar en negreta el que ja ho és", () => {
    const once = boldPhrases("Benvinguts al càmping de l'Estartit", ["càmping"]).text;
    expect(boldPhrases(once, ["càmping"])).toEqual({ text: once, missing: [] });
  });

  it("si ja és dins d'una negreta més llarga, no la parteix", () => {
    expect(boldPhrases("**Benvinguts a Camping Castell** i Camping", ["Camping"]).text).toBe("**Benvinguts a Camping Castell** i **Camping**");
    expect(boldPhrases("**Benvinguts a Camping Castell**", ["Camping"])).toEqual({ text: "**Benvinguts a Camping Castell**", missing: [] });
  });

  it("diu quines frases no ha trobat", () => {
    expect(boldPhrases("Text", ["platja"]).missing).toEqual(["platja"]);
  });
});
