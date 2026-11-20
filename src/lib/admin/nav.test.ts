import { describe, expect, it } from "vitest";
import { ENTITY_NAMES } from "./entities";
import { CREATABLE, createLabel, currentHref, isCurrent, LEGAL_SITE_PAGES, NAV_GROUPS, navItems, pendingWork, SITE_PAGES, startPage, TASKS, visualPageHref } from "./nav";

describe("menú del panell", () => {
  it("porta a cada contingut exactament una vegada", () => {
    expect(NAV_GROUPS.flatMap((group) => group.entities).toSorted()).toEqual(ENTITY_NAMES.toSorted());
  });

  it("no té dues tasques amb el mateix text", () => {
    expect(new Set(TASKS.map((task) => task.label)).size).toBe(TASKS.length);
  });

  it("marca només l'opció més concreta: la pàgina, no també la llista de la qual penja", () => {
    const hrefs = ["/admin/sections", "/admin/sections/gastronomy", "/admin/home"];
    expect(currentHref("/admin/sections/gastronomy", hrefs)).toBe("/admin/sections/gastronomy");
    expect(currentHref("/admin/sections/welcome", hrefs)).toBe("/admin/sections");
    expect(currentHref("/admin/changes", hrefs)).toBeNull();
  });

  it("cada pàgina del menú hi surt una sola vegada", () => {
    const pages = NAV_GROUPS.flatMap((group) => group.pages ?? []).map((page) => page.href);
    expect(new Set(pages).size).toBe(pages.length);
  });

  it("marca la llista i les fitxes que en pengen, però no una altra amb un nom semblant", () => {
    expect(isCurrent("/admin/services", "/admin/services")).toBe(true);
    expect(isCurrent("/admin/services/123", "/admin/services")).toBe(true);
    expect(isCurrent("/admin/services-old", "/admin/services")).toBe(false);
  });
});

describe("pàgines del web al tauler", () => {
  it("cada pàgina té una adreça i una secció pròpies", () => {
    const pages = [...SITE_PAGES, ...LEGAL_SITE_PAGES];
    expect(new Set(pages.map((page) => page.path)).size).toBe(pages.length);
    expect(new Set(pages.map((page) => page.section)).size).toBe(pages.length);
  });

  it("l'editor visual només s'obre en una pàgina del web coneguda", () => {
    expect(startPage("/gastronomy")).toBe("/gastronomy");
    expect(startPage("/legal/privacy")).toBe("/legal/privacy");
    expect(startPage(null)).toBe("");
    // Res de fora del web ni adreces que no existeixen: l'iframe carregaria qualsevol cosa del mateix origen.
    expect(startPage("//evil.example")).toBe("");
    expect(startPage("/admin")).toBe("");
    expect(startPage("/gastronomy/../admin")).toBe("");
  });

  it("l'enllaç a l'editor visual porta la pàgina, i la portada no en porta", () => {
    expect(visualPageHref("/gastronomy")).toBe("/admin/visual?page=%2Fgastronomy");
    expect(visualPageHref("")).toBe("/admin/visual");
  });

  it("el botó de crear només ofereix el que es pot afegir, amb el gènere bé", () => {
    expect(CREATABLE).toContain("activities");
    expect(CREATABLE).not.toContain("accommodations");
    expect(createLabel("activities")).toBe("Nova activitat");
    expect(createLabel("services")).toBe("Nou servei");
    expect(createLabel("restaurants")).toBe("Nou restaurant o bar");
  });

  it("cada opció del menú té icona", () => {
    expect(NAV_GROUPS.flatMap(navItems).every((item) => Boolean(item.icon))).toBe(true);
  });
});

describe("feina pendent", () => {
  it("compta el que no es veu i el que falta traduir, per separat", () => {
    const items = [
      { published: false, missing: ["fr"] },
      { published: true, missing: ["fr", "nl"] },
      { published: true, missing: [] },
    ];
    expect(pendingWork([{ entity: "services", items }])).toEqual([{ entity: "services", title: "Serveis", hidden: 1, untranslated: 2 }]);
  });

  it("no ensenya els continguts que ja estan acabats", () => {
    expect(pendingWork([{ entity: "services", items: [{ published: true, missing: [] }] }, { entity: "activities", items: [] }])).toEqual([]);
  });
});
