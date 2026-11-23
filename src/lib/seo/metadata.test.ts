import { describe, expect, it } from "vitest";
import { metaDescription, pageMetadata, plainText } from "./metadata";

describe("descripció per a Google", () => {
  it("treu la negreta i els títols", () => {
    expect(plainText("**Benvinguts** al\ncàmping")).toBe("Benvinguts al càmping");
    expect(plainText("## Qui som")).toBe("Qui som");
  });

  it("és el primer paràgraf que no és un títol", () => {
    expect(metaDescription("## 1. Responsable\n\nEl **responsable** és el càmping.\n\nAltres coses.")).toBe("El responsable és el càmping.");
  });

  it("es talla per una paraula i no passa de la mida", () => {
    const text = "Paraula ".repeat(40);
    const description = metaDescription(text)!;
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description).toMatch(/Paraula…$/);
  });

  it("sense text no n'hi ha", () => {
    expect(metaDescription(null)).toBeUndefined();
    expect(metaDescription("## Només un títol")).toBeUndefined();
  });
});

describe("metadades d'una pàgina", () => {
  const meta = pageMetadata({ locale: "ca", path: "gastronomy", title: "Gastronomia · Càmping", description: "Restaurants", image: "https://example.test/f.jpg", siteName: "Càmping" });

  it("té la canònica i una alternativa per idioma, amb el castellà per defecte", () => {
    expect(meta.alternates?.canonical).toBe("/ca/gastronomy");
    expect(meta.alternates?.languages).toMatchObject({ es: "/es/gastronomy", nl: "/nl/gastronomy", "x-default": "/es/gastronomy" });
  });

  it("la targeta per compartir és la de la pàgina, no la de la portada", () => {
    expect(meta.openGraph).toMatchObject({ title: "Gastronomia · Càmping", url: "/ca/gastronomy", locale: "ca_ES", images: [{ url: "https://example.test/f.jpg" }] });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("la portada no porta camí", () => {
    expect(pageMetadata({ locale: "es", path: "", title: "T", siteName: "S" }).alternates?.canonical).toBe("/es");
  });
});
