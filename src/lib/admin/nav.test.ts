import { describe, expect, it } from "vitest";
import { ENTITY_NAMES } from "./entities";
import { isCurrent, NAV_GROUPS, pendingWork, TASKS } from "./nav";

describe("menú del panell", () => {
  it("porta a cada contingut exactament una vegada", () => {
    expect(NAV_GROUPS.flatMap((group) => group.entities).toSorted()).toEqual(ENTITY_NAMES.toSorted());
  });

  it("no té dues tasques amb el mateix text", () => {
    expect(new Set(TASKS.map((task) => task.label)).size).toBe(TASKS.length);
  });

  it("marca la llista i les fitxes que en pengen, però no una altra amb un nom semblant", () => {
    expect(isCurrent("/admin/services", "/admin/services")).toBe(true);
    expect(isCurrent("/admin/services/123", "/admin/services")).toBe(true);
    expect(isCurrent("/admin/services-old", "/admin/services")).toBe(false);
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
