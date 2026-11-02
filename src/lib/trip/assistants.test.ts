import { describe, expect, it } from "vitest";
import { ASSISTANTS, clampNights } from "./assistants";

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
});
