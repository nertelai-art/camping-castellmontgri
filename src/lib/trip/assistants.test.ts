import { describe, expect, it } from "vitest";
import { ASSISTANTS, clampNights, fillPrompt } from "./assistants";

describe("assistents del pla de viatge", () => {
  it("el text va codificat a l'adreça dels que l'accepten", () => {
    const chatgpt = ASSISTANTS.find((a) => a.name === "ChatGPT");
    expect(chatgpt?.href("2 nits & platja?")).toBe("https://chatgpt.com/?q=2%20nits%20%26%20platja%3F");
  });

  it("qui no accepta el text a l'adreça demana copiar-lo abans", () => {
    expect(ASSISTANTS.filter((a) => a.needsCopy).map((a) => a.name)).toEqual(["Gemini"]);
  });

  it("les nits queden dins de marges", () => {
    expect([clampNights(0), clampNights(3), clampNights(30)]).toEqual([1, 3, 14]);
  });

  it("omple el text editat al panell amb les nits, el càmping, el lloc, la web i el tipus", () => {
    const values = { nits: "3 nits", camping: "Natura Village", lloc: "L'Estartit", web: "https://example.test/ca", tipus: "Romàntic" };
    expect(fillPrompt("Passaré {nits} a {camping} ({lloc}), viatge «{tipus}». Web: {web}. Torno a {camping}.", values)).toBe(
      "Passaré 3 nits a Natura Village (L'Estartit), viatge «Romàntic». Web: https://example.test/ca. Torno a Natura Village.",
    );
  });

  it("una clau que no coneix la deixa tal com està", () => {
    expect(fillPrompt("{nits} i {preu}", { nits: "1 nit", camping: "", lloc: "", web: "", tipus: "" })).toBe("1 nit i {preu}");
  });
});
