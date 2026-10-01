import { describe, expect, it } from "vitest";
import { ENTITIES, fieldName, LOCALES, missingLocales, parseContent } from "./entities";

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
};

describe("formulari de contingut", () => {
  it("llegeix els textos per idioma i els camps base", () => {
    const result = parseContent(
      ENTITIES.restaurants,
      form({ hours: " 18:00 - 23:00h ", status: "published", "es.name": "Restaurante Grill", "es.description": "Carne\r\n\r\na la brasa", "ca.name": "Restaurant Grill" }),
    );
    expect(result).toEqual({
      ok: true,
      value: {
        base: { hours: "18:00 - 23:00h", status: "published" },
        translations: {
          es: { name: "Restaurante Grill", description: "Carne\n\na la brasa", menu_url: "" },
          ca: { name: "Restaurant Grill", description: "", menu_url: "" },
        },
      },
    });
  });

  it("un idioma buit del tot no es desa, però el castellà és obligatori", () => {
    const result = parseContent(ENTITIES.services, form({ status: "draft", "ca.name": "Recepció" }));
    expect(result).toEqual({ ok: false, errors: ["Castellà: falta «Nom»."] });
  });

  it("si un idioma té text però li falta el camp obligatori, avisa", () => {
    const result = parseContent(ENTITIES.services, form({ status: "draft", "es.name": "Recepción", "fr.description": "Ouvert toute la journée" }));
    expect(result).toEqual({ ok: false, errors: ["Francès: falta «Nom»."] });
  });

  it("no accepta un estat inventat ni un enllaç que no sigui http(s)", () => {
    const result = parseContent(ENTITIES.restaurants, form({ status: "archived", hours: "", "es.name": "Bar", "es.menu_url": "javascript:alert(1)" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toEqual(["Estat: valor desconegut.", "Castellà: «Enllaç a la carta» ha de començar per https://"]);
  });

  it("les caselles: marcada és cert, absent és fals", () => {
    const on = parseContent(ENTITIES.sections, form({ is_visible: "on", "es.title": "Bienvenidos" }));
    const off = parseContent(ENTITIES.sections, form({ "es.title": "Bienvenidos" }));
    expect(on.ok && on.value.base.is_visible).toBe(true);
    expect(off.ok && off.value.base.is_visible).toBe(false);
  });

  it("diu quins idiomes falten per traduir", () => {
    expect(missingLocales(ENTITIES.services, { es: { name: "Recepción" }, ca: { name: "Recepció" }, fr: { name: "" } })).toEqual(["fr", "en", "nl"]);
  });

  it("cada camp del formulari té un nom únic per idioma", () => {
    const names = LOCALES.flatMap((l) => ENTITIES.sections.text.map((f) => fieldName(l, f.name)));
    expect(new Set(names).size).toBe(names.length);
  });
});
