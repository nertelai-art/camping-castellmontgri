import { describe, expect, it } from "vitest";
import { focusPosition, parseFocus } from "./focus";

describe("punt focal d'una foto", () => {
  it("es converteix en la posició de la imatge", () => {
    expect(focusPosition({ x: 25.5, y: 80 })).toBe("25.5% 80%");
  });

  it("accepta valors dins de la foto, vores incloses", () => {
    expect(parseFocus("0", "100")).toEqual({ x: 0, y: 100 });
    expect(parseFocus("33.25", "50")).toEqual({ x: 33.25, y: 50 });
  });

  it("rebutja el que no és un punt de la foto", () => {
    expect(parseFocus("101", "50")).toBeNull();
    expect(parseFocus("-1", "50")).toBeNull();
    expect(parseFocus("a", "50")).toBeNull();
    expect(parseFocus("", "50")).toBeNull();
    expect(parseFocus(null, "50")).toBeNull();
  });
});
