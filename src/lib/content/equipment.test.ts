import { describe, expect, it } from "vitest";
import { amenities, amenityIcon, bedLayout, equipmentOnly } from "./equipment";

describe("equipament de la fitxa", () => {
  it("treu les files que repeteixen les dades de la fitxa i deixa la resta en ordre", () => {
    expect(equipmentOnly(["Tamaño: 32m²", "Max personas: 6/8", "Hab. litera con cama baja doble: ", "Ropa de cama", "Ducha + WC", "Terraza"])).toEqual(["Ropa de cama", "Ducha + WC", "Terraza"]);
  });

  it("treu el que ja diu una de les dades, encara que canviïn les majúscules", () => {
    expect(equipmentOnly(["Toldo", "Aire acondicionado"], ["AIRE ACONDICIONADO"])).toEqual(["Toldo"]);
  });
});

describe("icona de cada equipament", () => {
  // Els textos reals del contingut, en tots els idiomes.
  const cases: [string, ReturnType<typeof amenityIcon>][] = [
    ["Ducha + WC", "shower"],
    ["Douche + Toilettes", "shower"],
    ["Dutxa", "shower"],
    ["WC", "toilet"],
    ["Toilettes", "toilet"],
    ["Cocina", "kitchen"],
    ["Keuken", "kitchen"],
    ["Vajilla", "dishes"],
    ["Serviesgoed", "dishes"],
    ["Ropa de cama", "bedding"],
    ["Linge de lit", "bedding"],
    ["Beddengoed", "bedding"],
    ["Mobiliario exterior", "outdoorFurniture"],
    ["Mobilier de jardin", "outdoorFurniture"],
    ["Tumbonas", "deckchair"],
    ["Chaises longues", "deckchair"],
    ["Ligstoelen", "deckchair"],
    ["Toldo", "awning"],
    ["Auvents", "awning"],
    ["Terraza cubierta", "terrace"],
    ["Overdekt terras", "terrace"],
    ["Aire condicionat", "airConditioning"],
    ["Air conditionné", "airConditioning"],
    ["Airconditioning", "airConditioning"],
    ["Coche", "car"],
    ["Auto", "car"],
    ["Punt d'aigua", "water"],
    ["Point d'eau", "water"],
    ["Waterpunt", "water"],
    ["Conexión eléctrica", "electricity"],
    ["Elektrische aansluiting", "electricity"],
    ["Barbacoa", "check"],
  ];
  it.each(cases)("«%s» → %s", (text, icon) => {
    expect(amenityIcon(text)).toBe(icon);
  });

  it("afegeix la connexió elèctrica amb el seu valor, que és una fila «etiqueta: valor»", () => {
    expect(amenities(["Coche", "Conexión eléctrica: 10A", "Tamaño: 90m²"])).toEqual([
      { text: "Coche", icon: "car" },
      { text: "Conexión eléctrica 10A", icon: "electricity" },
    ]);
  });
});

describe("distribució dels llits", () => {
  it("treu les habitacions amb llits i quantes n'hi ha, i deixa la resta", () => {
    expect(bedLayout(["Hab. totales: 3", "Hab. cama doble: 1", "Hab. cama individual: 2", "Hab. Litera: 1", "Max personas: 6", "Cocina"])).toEqual([
      { label: "Hab. cama doble", count: 1, kind: "double" },
      { label: "Hab. cama individual", count: 2, kind: "single" },
      { label: "Hab. Litera", count: 1, kind: "bunk" },
    ]);
  });

  it("una fila sense número vol dir una habitació, i la llitera mana sobre el llit doble", () => {
    expect(bedLayout(["Chambre avec lits superposés et lit bas double: "])).toEqual([
      { label: "Chambre avec lits superposés et lit bas double", count: 1, kind: "bunk" },
    ]);
  });

  it("entén les etiquetes dels altres idiomes", () => {
    expect(bedLayout(["Dubbele slaapkamer: 1", "Eenpersoonskamer: 1", "Totaal kamers: 2"]).map((r) => r.kind)).toEqual(["double", "single"]);
  });
});
