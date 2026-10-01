import { describe, expect, it } from "vitest";
import { editMark, parseEditMark, parseFieldName, targetFromPath, targetKind, visualHref } from "./visual";

describe("marques de l'editor visual", () => {
  it("llegeix l'entitat i la referència", () => {
    expect(parseEditMark("services:reception")).toEqual({ entity: "services", ref: "reception" });
    expect(parseEditMark("sections:accommodation-intro")).toEqual({ entity: "sections", ref: "accommodation-intro" });
  });

  it("una referència pot portar dos punts", () => {
    expect(parseEditMark("sections:a:b")).toEqual({ entity: "sections", ref: "a:b" });
  });

  it("no accepta entitats desconegudes ni marques a mitges", () => {
    expect(parseEditMark("profiles:1")).toBeNull();
    expect(parseEditMark("services:")).toBeNull();
    expect(parseEditMark("services")).toBeNull();
    expect(parseEditMark(":x")).toBeNull();
    expect(parseEditMark(null)).toBeNull();
    // propietats heretades d'un objecte no són entitats
    expect(parseEditMark("constructor:x")).toBeNull();
  });

  it("l'adreça de l'editor i la marca es poden anar i tornar", () => {
    const target = { entity: "restaurants", ref: "bar/panorama ñ" } as const;
    expect(targetFromPath(visualHref(target))).toEqual(target);
    expect(parseEditMark(editMark(target))).toEqual(target);
  });

  it("fora de l'editor visual no hi ha res obert", () => {
    expect(targetFromPath("/admin/visual")).toBeNull();
    expect(targetFromPath("/admin/services/abc")).toBeNull();
    expect(targetFromPath("/admin/visual/profiles/1")).toBeNull();
    expect(targetFromPath("/admin/visual/services/a/b")).toBeNull();
    expect(targetFromPath("/admin/visual/services/%E0%A4%A")).toBeNull();
  });

  it("separa l'idioma del camp en el nom d'un camp del formulari", () => {
    expect(parseFieldName("ca.title")).toEqual({ locale: "ca", field: "title" });
    expect(parseFieldName("nl.menu_url")).toEqual({ locale: "nl", field: "menu_url" });
    expect(parseFieldName("hours")).toEqual({ locale: null, field: "hours" });
    // un prefix que no és un idioma forma part del nom
    expect(parseFieldName("de.title")).toEqual({ locale: null, field: "de.title" });
  });

  it("anomena el tipus de bloc", () => {
    expect(targetKind({ entity: "sections", ref: "hero" })).toBe("Secció");
    expect(targetKind({ entity: "restaurants", ref: "x" })).toBe("Local");
  });
});
