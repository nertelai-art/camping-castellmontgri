import { describe, expect, it } from "vitest";
import { documentBlocks, paragraphs, parseInline } from "./rich-text";

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

  it("als textos llargs, els paràgrafs amb «#» són títols de dos nivells", () => {
    expect(documentBlocks("# AVISO\n\n## Datos\n\n### Cookies **propias**\n\nTexto #1.")).toEqual([
      { kind: "heading", level: 2, inlines: [{ text: "AVISO", bold: false }] },
      { kind: "heading", level: 2, inlines: [{ text: "Datos", bold: false }] },
      { kind: "heading", level: 3, inlines: [{ text: "Cookies ", bold: false }, { text: "propias", bold: true }] },
      { kind: "paragraph", inlines: [{ text: "Texto #1.", bold: false }] },
    ]);
  });

  it("un «#» sense espai no és un títol", () => {
    expect(documentBlocks("#hashtag")).toEqual([{ kind: "paragraph", inlines: [{ text: "#hashtag", bold: false }] }]);
  });

  it("no interpreta HTML", () => {
    expect(parseInline("<b>hola</b>")).toEqual([{ text: "<b>hola</b>", bold: false }]);
  });
});
