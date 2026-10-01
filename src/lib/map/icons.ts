// Icones de la llegenda de la il·lustració, empaquetades a public/map/icons.png (una graella de 13×3).
// L'ordre és el de la llegenda: columna a columna, de dalt a baix. El genera `pnpm map:build`.
export const MAP_ICONS = [
  // columna 1
  "reception", "parking", "bus", "charging", "animation", "recycling", "emergency", "atm", "dump", "carwash", "church", "sanitary", "supermarket",
  // columna 2
  "laundry", "dishwashing", "disco", "arcade", "waterpark", "pool", "grill", "cafe", "snackbar", "pub", "lera", "snacks", "pizza",
  // columna 3
  "ponies", "pingpong", "minigolf", "tennis", "basket", "football", "playground", "petanca", "archery", "bikes", "naturalpark", "touroperator", "viewpoint",
] as const;
export type MapIcon = (typeof MAP_ICONS)[number];

export const ICON_ATLAS = { src: "/map/icons.png", cols: 13, rows: 3 } as const;

export const isMapIcon = (key: string | null | undefined): key is MapIcon => MAP_ICONS.includes(key as MapIcon);

/** Estil CSS per pintar una icona de l'atles en un element quadrat de qualsevol mida. */
export function iconStyle(key: MapIcon) {
  const i = MAP_ICONS.indexOf(key);
  const col = i % ICON_ATLAS.cols;
  const row = Math.floor(i / ICON_ATLAS.cols);
  return {
    backgroundImage: `url(${ICON_ATLAS.src})`,
    backgroundSize: `${ICON_ATLAS.cols * 100}% ${ICON_ATLAS.rows * 100}%`,
    backgroundPosition: `${(col / (ICON_ATLAS.cols - 1)) * 100}% ${(row / (ICON_ATLAS.rows - 1)) * 100}%`,
  } as const;
}
