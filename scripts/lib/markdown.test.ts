import { describe, expect, it } from "vitest";
import { parseBlocks, parseFrontmatter, parseSize, parseTestimonials, sentenceCase, tidy, titleCase, toPercent } from "./markdown";

const md = `---
key: home
title: "Camping :: Castell"
---

## ALOJAMIENTO

Descubre nuestros
alojamientos.

**¡Encuentra tu refugio!**

[MÁS INFO](https://example.com/es/alojamientos)

## GASTRONOMÍA

¡ **Bienvenidos**  al camping!

### [MH MEDES](https://example.com/mh-medes)
`;

describe("markdown de referència", () => {
  it("llegeix el frontmatter i treu les cometes", () => {
    const { data, content } = parseFrontmatter(md);
    expect(data).toEqual({ key: "home", title: "Camping :: Castell" });
    expect(content.startsWith("\n## ALOJAMIENTO")).toBe(true);
  });

  it("separa títol, cos, frase destacada i enllaços de cada bloc", () => {
    const [accommodation, gastronomy] = parseBlocks(parseFrontmatter(md).content);
    expect(accommodation).toEqual({
      title: "ALOJAMIENTO",
      body: ["Descubre nuestros alojamientos."],
      highlight: "¡Encuentra tu refugio!",
      links: [{ label: "MÁS INFO", url: "https://example.com/es/alojamientos" }],
    });
    expect(gastronomy!.body).toEqual(["¡**Bienvenidos** al camping!"]);
  });

  it("neteja els espais que deixa l'extracció", () => {
    expect(tidy("¿ Qué  tal\n  estás?")).toBe("¿Qué tal estás?");
  });

  it("passa a majúscula inicial només el que és tot majúscules", () => {
    expect(sentenceCase("RECEPCIÓN", "es")).toBe("Recepción");
    expect(sentenceCase("INSTAL·LACIONS", "ca")).toBe("Instal·lacions");
    expect(sentenceCase("Bar Panorama", "es")).toBe("Bar Panorama");
  });

  it("posa majúscula a cada paraula dels noms de llocs, menys les partícules", () => {
    expect(titleCase("CAMPING CASTELL MONTGRÍ", "es")).toBe("Camping Castell Montgrí");
    expect(titleCase("\"THE SEAGULL\" DISCO/PUB", "en")).toBe("\"The Seagull\" Disco/Pub");
    expect(titleCase("PARC DE LA CIUTADELLA", "ca")).toBe("Parc de la Ciutadella");
    expect(titleCase("Kids Club", "es")).toBe("Kids Club");
    expect(titleCase("L'ERA", "ca")).toBe("L'Era");
    expect(titleCase("TIR A L'ARC", "ca")).toBe("Tir a l'Arc");
  });

  it("extreu les opinions sense les repeticions del carrusel", () => {
    const block = `#### "Vacaciones"\n\nBuen camping.\n\nRepetiremos.\n\n**Joelpi**\n\n#### "Vacaciones"\n\nBuen camping.\n\nRepetiremos.\n\n**Joelpi**\n`;
    expect(parseTestimonials(block)).toEqual([
      { title: "Vacaciones", quote: "Buen camping.\n\nRepetiremos.", author: "Joelpi" },
    ]);
  });

  it("interpreta les superfícies del web antic", () => {
    expect(parseSize("49+22")).toBe(49);
    expect(parseSize("12.5")).toBe(12.5);
    expect(parseSize("")).toBeNull();
    expect(parseSize(null)).toBeNull();
  });

  it("passa les coordenades del plànol a percentatge", () => {
    expect(toPercent(1500, 3000)).toBe(50);
    expect(toPercent(1339, 1845)).toBe(72.57);
    expect(() => toPercent(3100, 3000)).toThrow(/fora del plànol/);
  });
});
