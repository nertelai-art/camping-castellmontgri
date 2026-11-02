import { describe, expect, it } from "vitest";
import pages from "../../../reference/content/site-map.json" with { type: "json" };
import { oldSiteRedirects, type OldPage } from "./redirects";

const redirects = oldSiteRedirects(pages as OldPage[]);
const to = (source: string) => redirects.find((r) => r.source === source)?.destination;

describe("redireccions del web antic", () => {
  it("cada tipus de pàgina va a la seva pàgina nova, en el mateix idioma", () => {
    expect(to("/es/alojamientos/mh-medes")).toBe("/es/accommodations");
    expect(to("/ca/allotjaments/tendes")).toBe("/ca/accommodations");
    expect(to("/fr/restauration/pizzeria")).toBe("/fr/gastronomy");
    expect(to("/nl/animatie/aquagym")).toBe("/nl/entertainment");
    expect(to("/es/servicios")).toBe("/es/services");
    expect(to("/ca/entorn")).toBe("/ca/surroundings");
    expect(to("/en/privacy-policy")).toBe("/en/legal/privacy");
    expect(to("/ca/condicions-de-reserves")).toBe("/ca/legal/booking-conditions");
  });

  it("el que no té equivalent va a la portada del seu idioma", () => {
    expect(to("/es/eventos")).toBe("/es");
    expect(to("/nl/werk-met-ons")).toBe("/nl");
  });

  it("la barra del final no compta, i no hi ha cap redirecció a si mateixa ni repetida", () => {
    expect(to("/es/preservacion-del-entorno")).toBe("/es/surroundings");
    expect(redirects.some((r) => r.source === r.destination)).toBe(false);
    expect(redirects.find((r) => r.source === "/en/services")).toBeUndefined();
    expect(new Set(redirects.map((r) => r.source)).size).toBe(redirects.length);
  });
});
