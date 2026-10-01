// Peces de l'animació de gastronomia: cada plat es munta peça a peça sobre la taula.
// Les imatges són a public/food/ (generades amb IA i retallades amb `pnpm food:build`; no són fotos del càmping).
// La taula fa sempre 5:4. `x`, `y`: centre de la peça en % de la taula. `width`: amplada en % de l'amplada de la taula.

import data from "./food-pieces.data.json";

export type FoodPiece = {
  src: string;
  /** Mida real de la imatge, perquè el navegador reservi l'espai. */
  size: readonly [number, number];
  x: number;
  y: number;
  width: number;
  /** Gir final, en graus. */
  rotate?: number;
  /** D'on ve: desplaçament en % de la taula, gir de més i escala inicial (>1: cau de dalt; <1: creix). */
  from: { dx?: number; dy?: number; rotate?: number; scale?: number };
  /** Ombra: «table» (gran i tova, sobre la taula), «contact» (curta, sobre el plat) o cap. */
  shadow?: "table" | "contact";
  /** Capa. Per defecte, l'ordre d'arribada. */
  z?: number;
};

const TABLE_ASPECT = 5 / 4;
type Name = keyof typeof data.sizes;
const image = (name: Name) => ({ src: `/food/${name}.webp`, size: data.sizes[name] as unknown as readonly [number, number] });

// ─── La paella ────────────────────────────────────────────────────────────────
const PAN = { x: 50, y: 52, width: 76 };
const [panW, panH] = data.sizes.pan as unknown as readonly [number, number];
const panHeight = (PAN.width * panH) / panW; // en % de l'amplada de la taula
/** Centre i radi del cercle de la paella (sense nanses), en % de la taula: el diu el retall (`data.pan`). */
const circle = {
  x: PAN.x + (data.pan.cx - 0.5) * PAN.width,
  y: PAN.y + (data.pan.cy - 0.5) * panHeight * TABLE_ASPECT,
  r: data.pan.r * PAN.width, // en % de l'amplada
};
// L'arròs omple la paella fins a la paret, no només el fons.
const RICE = 0.84;

/** Un lloc dins la paella: `radius` en fracció del radi de l'arròs, `angle` en graus (0 = dreta, 90 = avall). */
const inPan = (radius: number, angle: number) => {
  const a = (angle * Math.PI) / 180;
  const r = circle.r * RICE * radius;
  return { x: circle.x + r * Math.cos(a), y: circle.y + r * Math.sin(a) * TABLE_ASPECT };
};

// El que cau a la paella ve de dalt, una mica més gros, i s'hi posa: com qui el deixa anar amb la mà.
const drop = (rotate: number) => ({ dy: -16, rotate, scale: 1.5 });
const topping = (name: "prawn" | "mussel", width: number, angle: number, spin: number): FoodPiece => ({
  ...image(name),
  ...inPan(0.56, angle),
  width,
  // Cada peça mira cap enfora, com en una paella parada a consciència.
  rotate: angle + (name === "prawn" ? 90 : 20),
  from: drop(spin),
  shadow: "contact",
});

/** Les peces de cada pas, en l'ordre en què arriben. */
export const FOOD_PIECES: readonly (readonly FoodPiece[])[] = [
  // Per menjar: la paella. Primer la paella buida, després l'arròs i, a sobre, el marisc.
  [
    { ...image("pan"), ...PAN, from: { dy: 45, rotate: -20, scale: 0.85 }, shadow: "table" },
    { ...image("rice"), x: circle.x, y: circle.y, width: circle.r * 2 * RICE, from: { rotate: -35, scale: 0.15 } },
    topping("prawn", 11.5, -112, -70),
    topping("mussel", 12, -67, 60),
    topping("prawn", 11.5, -22, 80),
    topping("mussel", 12, 23, -50),
    topping("prawn", 11.5, 68, -90),
    topping("mussel", 12, 113, 70),
    topping("prawn", 11.5, 158, 60),
    topping("mussel", 12, 203, -60),
    { ...image("lemon"), x: circle.x, y: circle.y, width: 13, rotate: -12, from: drop(120), shadow: "contact" },
    { ...image("parsley"), ...inPan(0.27, -140), width: 5.5, rotate: -30, from: drop(-60), shadow: "contact" },
    { ...image("parsley"), ...inPan(0.27, 40), width: 5.5, rotate: 150, from: drop(70), shadow: "contact" },
  ],
  // Gelats: el cucurutxo i les boles. Cada bola tapa la boca del que té a sota, com en un gelat de debò.
  [
    { ...image("cone"), x: 50, y: 70, width: 19, from: { dy: 40, rotate: 14, scale: 0.9 }, shadow: "table" },
    { ...image("scoop-pistachio"), x: 50, y: 38, width: 27, from: { dy: -30, rotate: -25, scale: 1.25 } },
    { ...image("scoop-strawberry"), x: 50.5, y: 17, width: 24, rotate: 6, from: { dy: -30, rotate: 30, scale: 1.25 } },
  ],
  // Per beure: encara sense peces. Mentre no n'hi hagi, aquest pas ensenya les fotos dels bars.
  [],
];
