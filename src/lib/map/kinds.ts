// Tipus de punt del plànol i el seu color. En hex (no variables CSS) perquè també els fa servir three.js.
export const MAP_KINDS = ["accommodation", "food", "pool", "leisure", "service", "landmark"] as const;
export type MapKind = (typeof MAP_KINDS)[number];

export const KIND_COLOR: Record<MapKind, string> = {
  accommodation: "#3e4822",
  food: "#a8330b",
  pool: "#0f4c5c",
  leisure: "#b0418a",
  service: "#2f5d8a",
  landmark: "#6b5a2e",
};

export const kindColor = (kind: string) => KIND_COLOR[kind as MapKind] ?? "#232a14";
