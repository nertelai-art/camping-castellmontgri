import { describe, expect, it } from "vitest";
import { displayName, ENTITIES, fieldName, LOCALES, missingLocales, parseContent, toList } from "./entities";

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

  it("els números: buit és sense valor, la coma val com a decimal i un text no passa", () => {
    const ok = parseContent(ENTITIES.accommodations, form({ status: "published", capacity_max: "6", size_m2: "32,5", bedrooms: "", bathrooms: "1", "es.name": "Bungalow" }));
    expect(ok.ok && ok.value.base).toEqual({ capacity_max: 6, size_m2: 32.5, bedrooms: null, bathrooms: 1, air_conditioning: false, is_accessible: false, status: "published" });
    const bad = parseContent(ENTITIES.accommodations, form({ status: "published", capacity_max: "sis", bedrooms: "1.5", size_m2: "-3", "es.name": "Bungalow" }));
    expect(bad).toEqual({ ok: false, errors: ["Persones (màxim): ha de ser un número sencer.", "Superfície (m²): ha de ser un número.", "Habitacions: ha de ser un número sencer."] });
  });

  it("les dades generals: noms obligatoris, correus, enllaços i dates comprovats", () => {
    const bad = parseContent(
      ENTITIES.site_settings,
      form({ brand_name: "", legal_name: "Càmping SA", email_info: "info", booking_url: "reserves.cat", season_open: "2027-02-31x", season_close: "" }),
    );
    expect(bad).toEqual({
      ok: false,
      errors: ["Falta «Nom comercial».", "«Correu d'informació» no sembla un correu.", "«Enllaç de reserves» ha de començar per https://", "Obertura de temporada: la data no és vàlida."],
    });
    const ok = parseContent(ENTITIES.site_settings, form({ brand_name: "Natura Village", legal_name: "Càmping SA", email_info: "info@camping.test", season_open: "2027-03-27" }));
    expect(ok.ok && [ok.value.base.email_info, ok.value.base.season_open, ok.value.base.season_close]).toEqual(["info@camping.test", "2027-03-27", null]);
  });

  it("la posició d'un punt del mapa són dos números entre 0 i 100", () => {
    const ok = parseContent(ENTITIES.map_points, form({ status: "published", x: "41.237", y: "63.5", kind: "food", icon: "", "es.label": "Recepción" }));
    expect(ok.ok && ok.value.base).toEqual({ x: 41.24, y: 63.5, kind: "food", icon: null, status: "published" });
    const bad = parseContent(ENTITIES.map_points, form({ status: "published", x: "120", kind: "food", icon: "pizza", "es.label": "Recepción" }));
    expect(bad).toEqual({ ok: false, errors: ["On és: la posició no és vàlida.", "On és: la posició no és vàlida."] });
  });

  it("una tria només accepta els valors de la llista; buida només si és opcional", () => {
    const point = { status: "published", x: "1", y: "1", "es.label": "Bar" };
    expect(parseContent(ENTITIES.map_points, form({ ...point, kind: "castle", icon: "pizza" }))).toEqual({ ok: false, errors: ["Tipus de lloc: valor desconegut."] });
    expect(parseContent(ENTITIES.map_points, form({ ...point, kind: "", icon: "dragon" }))).toEqual({ ok: false, errors: ["Tipus de lloc: valor desconegut.", "Icona: valor desconegut."] });
  });

  it("les opinions no tenen traduccions: tot són camps base i el nom és qui ho diu", () => {
    const ok = parseContent(ENTITIES.testimonials, form({ author: "Marta", quote: "Molt bé\r\ntot", rating: "5", locale: "ca", status: "published", title: "", source: "" }));
    expect(ok).toEqual({ ok: true, value: { base: { author: "Marta", title: "", quote: "Molt bé\ntot", rating: 5, source: "", locale: "ca", status: "published" }, translations: {} } });
    const bad = parseContent(ENTITIES.testimonials, form({ author: "", quote: "", rating: "6", locale: "de", status: "draft" }));
    expect(bad).toEqual({ ok: false, errors: ["Falta «Qui ho diu».", "Falta «Opinió».", "Estrelles (1 a 5): ha de ser entre 1 i 5.", "Idioma de l'opinió: valor desconegut."] });
    expect(displayName(ENTITIES.testimonials, {}, "id-1", { author: "Marta" })).toBe("Marta");
    expect(displayName(ENTITIES.testimonials, {}, "id-1", { author: "" })).toBe("Sense nom");
    expect(missingLocales(ENTITIES.testimonials, {})).toEqual([]);
  });

  it("una llista és una línia per element, sense línies buides", () => {
    expect(toList(" Terraza cubierta \n\nWifi\n  ")).toEqual(["Terraza cubierta", "Wifi"]);
    expect(toList("")).toEqual([]);
  });

  it("el nom d'un contingut: en català, si no en castellà, si no l'identificador; i el títol si només n'hi ha un", () => {
    expect(displayName(ENTITIES.services, { es: { name: "Recepción" }, ca: { name: "Recepció" } }, "id-1")).toBe("Recepció");
    expect(displayName(ENTITIES.services, { es: { name: "Recepción" }, ca: { name: "" } }, "id-1")).toBe("Recepción");
    expect(displayName(ENTITIES.services, {}, "id-1")).toBe("Sense nom");
    expect(displayName(ENTITIES.sections, {}, "pools")).toBe("pools");
    expect(displayName(ENTITIES.site_settings, { ca: { seo_title: "Càmping" } }, "true")).toBe("Dades generals");
  });

  it("diu quins idiomes falten per traduir", () => {
    expect(missingLocales(ENTITIES.services, { es: { name: "Recepción" }, ca: { name: "Recepció" }, fr: { name: "" } })).toEqual(["fr", "en", "nl"]);
  });

  it("cada camp del formulari té un nom únic per idioma", () => {
    const names = LOCALES.flatMap((l) => ENTITIES.sections.text.map((f) => fieldName(l, f.name)));
    expect(new Set(names).size).toBe(names.length);
  });
});
