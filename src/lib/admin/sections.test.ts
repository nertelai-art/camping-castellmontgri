import { describe, expect, it } from "vitest";
import { HOME_BLOCKS } from "@/lib/content/home";
import { ENTITIES } from "./entities";
import { LEGAL_SITE_PAGES, SITE_PAGES } from "./nav";
import { editorConfig, galleryHasRoom, isSectionInUse, SECTION_LAYOUTS } from "./sections";

const names = (key: string) => editorConfig("sections", key).text.map((field) => field.name);

describe("què s'edita de cada secció", () => {
  it("cada bloc de la portada i cada pàgina del web hi és", () => {
    const keys = ["hero", ...HOME_BLOCKS, ...[...SITE_PAGES, ...LEGAL_SITE_PAGES].map((page) => page.section)];
    expect(keys.filter((key) => !isSectionInUse(key))).toEqual([]);
  });

  it("només fa servir camps que la taula té", () => {
    const known = ENTITIES.sections.text.map((field) => field.name);
    for (const key of Object.keys(SECTION_LAYOUTS)) expect(known).toEqual(expect.arrayContaining(names(key)));
  });

  it("la benvinguda no té foto de secció: són les set de la galeria, i no n'hi cap cap més", () => {
    const welcome = editorConfig("sections", "welcome");
    expect(welcome.image).toBeUndefined();
    expect(welcome.gallery?.max).toBe(7);
    expect(names("welcome")).toEqual(["title", "body"]);
    expect(galleryHasRoom(welcome, 6)).toBe(true);
    expect(galleryHasRoom(welcome, 7)).toBe(false);
  });

  it("les opinions només tenen el text de sobre el títol i el títol, sense foto ni galeria", () => {
    const testimonials = editorConfig("sections", "testimonials");
    expect(names("testimonials")).toEqual(["eyebrow", "title"]);
    expect(testimonials.image).toBeUndefined();
    expect(testimonials.gallery).toBeUndefined();
  });

  it("la galeria no té límit de fotos", () => {
    expect(galleryHasRoom(editorConfig("sections", "gallery"), 500)).toBe(true);
  });

  it("cap secció demana el text del botó: no el pinta cap bloc", () => {
    for (const key of Object.keys(SECTION_LAYOUTS)) expect(names(key)).not.toContain("cta_label");
  });

  it("l'ajuda d'un camp és la d'aquell bloc", () => {
    const highlight = editorConfig("sections", "accommodation").text.find((field) => field.name === "highlight");
    expect(highlight?.help).toMatch(/en lloc del text/);
  });

  it("una secció que no surt enlloc només deixa el títol i el text, sense fotos", () => {
    const orphan = editorConfig("sections", "accommodation-intro");
    expect(names("accommodation-intro")).toEqual(["title", "body"]);
    expect(orphan.image).toBeUndefined();
    expect(orphan.gallery).toBeUndefined();
  });

  it("la resta d'entitats queden com eren", () => {
    expect(editorConfig("accommodations", "x")).toBe(ENTITIES.accommodations);
  });
});
