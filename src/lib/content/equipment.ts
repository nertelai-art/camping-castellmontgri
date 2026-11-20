/**
 * L'equipament d'un allotjament, sense el que la fitxa ja ensenya amb icones: les files «etiqueta: valor» del web antic (mida, persones,
 * habitacions; el dos punts és el que les distingeix en tots els idiomes) i les que diuen el mateix que una de les dades (`shown`).
 */
export const equipmentOnly = (features: string[], shown: string[] = []) => {
  const repeated = new Set(shown.map((text) => text.toLowerCase()));
  return features.filter((feature) => !feature.includes(":") && !repeated.has(feature.toLowerCase()));
};

// Minúscules i sense accents: «Conexión eléctrica» i «Connexió elèctrica» es comparen igual.
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** La icona de cada equipament. Les paraules clau cobreixen els 5 idiomes; el que no s'hi assembla a res porta la icona genèrica. */
export const AMENITY_ICONS = [
  "shower",
  "toilet",
  "kitchen",
  "dishes",
  "bedding",
  "outdoorFurniture",
  "deckchair",
  "awning",
  "terrace",
  "airConditioning",
  "car",
  "water",
  "electricity",
  "check",
] as const;
export type AmenityIcon = (typeof AMENITY_ICONS)[number];

// L'ordre importa: «Ducha + WC» és una dutxa, i «Mobiliario exterior» no és una terrassa.
const AMENITY_RULES: [AmenityIcon, RegExp][] = [
  ["shower", /ducha|dutxa|shower|douche/],
  ["toilet", /\bwc\b|toilet/],
  ["kitchen", /cocina|cuina|kitchen|cuisine|keuken/],
  ["dishes", /vajilla|vaixella|crockery|vaisselle|servies/],
  ["bedding", /ropa de cama|roba de llit|linen|linge|beddengoed/],
  ["outdoorFurniture", /mobiliari|outdoor furniture|mobilier|buitenmeubel/],
  ["deckchair", /tumbon|deck ?chair|chaises? longues?|ligstoel/],
  ["awning", /toldo|awning|auvent|luifel/],
  ["terrace", /terra(z|ss|c|s)/],
  ["airConditioning", /aire? (acondicionado|condicionat|conditionne)|air-?conditioning|airco/],
  ["electricity", /electri|elektri/],
  ["car", /coche|cotxe|\bcar\b|voiture|\bauto\b/],
  ["water", /agua|aigua|water|\beau\b/],
];

export function amenityIcon(feature: string): AmenityIcon {
  const text = normalize(feature);
  return AMENITY_RULES.find(([, rule]) => rule.test(text))?.[0] ?? "check";
}

/** Una fila de l'equipament per a la fitxa: el text com es veu i la seva icona. La connexió elèctrica porta el valor («Conexión eléctrica 10A»). */
export type Amenity = { text: string; icon: AmenityIcon };

export function amenities(features: string[], shown: string[] = []): Amenity[] {
  const electric = features.flatMap((feature) => {
    const [label, value] = splitRow(feature) ?? [];
    return label && amenityIcon(label) === "electricity" ? [value ? `${label} ${value}` : label] : [];
  });
  return [...equipmentOnly(features, shown), ...electric].map((text) => ({ text, icon: amenityIcon(text) }));
}

/** Com dorm la gent: les files d'habitacions amb llits («Hab. cama doble: 1»), amb quantes n'hi ha. */
export type BedKind = "double" | "single" | "bunk";
export type BedRoom = { label: string; count: number; kind: BedKind };

const BED_RULES: [BedKind, RegExp][] = [
  ["bunk", /litera|llitera|bunk|superpose|stapel/],
  ["double", /doble|double|dubbel/],
  ["single", /individual|single|individuelle|eenpersoons/],
];

function splitRow(feature: string): [string, string] | null {
  const i = feature.indexOf(":");
  return i < 0 ? null : [feature.slice(0, i).trim(), feature.slice(i + 1).trim()];
}

export function bedLayout(features: string[]): BedRoom[] {
  return features.flatMap((feature) => {
    const row = splitRow(feature);
    if (!row) return [];
    const [label, value] = row;
    const text = normalize(label);
    const kind = BED_RULES.find(([, rule]) => rule.test(text))?.[0];
    if (!kind) return [];
    // Sense número («Hab. litera con cama baja doble: ») vol dir que n'hi ha una.
    const count = Number.parseInt(value, 10);
    return [{ label, count: Number.isFinite(count) && count > 0 ? count : 1, kind }];
  });
}
