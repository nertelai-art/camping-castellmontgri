import { describe, expect, it } from "vitest";
import { paragraphs, parseInline } from "./rich-text";

describe("text ric lleuger", () => {
  it("separa paràgrafs per línies buides", () => {
    expect(paragraphs("Hola.\n\nAdéu.\n  \n")).toEqual(["Hola.", "Adéu."]);
    expect(paragraphs(null)).toEqual([]);
  });

  it("marca la negreta i deixa la resta com a text", () => {
    expect(parseInline("¡**Bienvenidos** al camping!")).toEqual([
      { text: "¡", bold: false },
      { text: "Bienvenidos", bold: true },
      { text: " al camping!", bold: false },
    ]);
  });

  it("no interpreta HTML", () => {
    expect(parseInline("<b>hola</b>")).toEqual([{ text: "<b>hola</b>", bold: false }]);
  });
});
