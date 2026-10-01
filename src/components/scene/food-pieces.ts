// Peces de l'animació de gastronomia: cada plat es munta peça a peça sobre la taula.
// Les imatges són a public/food/ (generades amb IA i retallades amb `pnpm food:build`; no són fotos del càmping).
// `x`, `y`: centre de la peça en % de la taula. `width`: amplada en % de l'amplada de la taula.
// `rotate`: gir final en graus. `from`: d'on ve (desplaçament en % de la taula i gir de més), fins que arriba al lloc.

export type FoodPiece = {
  src: string;
  /** Mida real de la imatge, perquè el navegador reservi l'espai. */
  size: readonly [number, number];
  x: number;
  y: number;
  width: number;
  rotate?: number;
  from: readonly [dx: number, dy: number, rotate: number];
};

const img = (name: string) => `/food/${name}.webp`;
const PRAWN = { src: img("prawn"), size: [478, 640] } as const;
const MUSSEL = { src: img("mussel"), size: [565, 446] } as const;
const PARSLEY = { src: img("parsley"), size: [271, 334] } as const;

/** Les peces de cada pas, en l'ordre en què arriben (i s'apilen: les últimes queden a sobre). */
export const FOOD_PIECES: readonly (readonly FoodPiece[])[] = [
  // Per menjar: la paella. Primer la paella buida, després l'arròs i, a sobre, el marisc.
  [
    { src: img("pan"), size: [640, 598], x: 50, y: 52, width: 74, from: [0, 60, -25] },
    { src: img("rice"), size: [640, 640], x: 48.5, y: 53.5, width: 49, from: [0, 0, -90] },
    { ...PRAWN, x: 37, y: 41, width: 13, rotate: -35, from: [-40, -60, -120] },
    { ...MUSSEL, x: 51, y: 35, width: 13, rotate: 15, from: [10, -70, 90] },
    { ...PRAWN, x: 62, y: 45, width: 13, rotate: 50, from: [45, -55, 140] },
    { ...MUSSEL, x: 32, y: 58, width: 13, rotate: -70, from: [-55, 10, -100] },
    { ...PRAWN, x: 41, y: 68, width: 13, rotate: 160, from: [-30, 60, 80] },
    { ...MUSSEL, x: 65, y: 62, width: 13, rotate: 110, from: [55, 30, 60] },
    { ...PRAWN, x: 57, y: 69, width: 13, rotate: -110, from: [35, 65, -90] },
    { src: img("lemon"), size: [539, 448], x: 49, y: 53, width: 13, rotate: -10, from: [0, -75, 180] },
    { ...PARSLEY, x: 42, y: 51, width: 6, rotate: -25, from: [-20, -70, -60] },
    { ...PARSLEY, x: 57, y: 57, width: 6, rotate: 40, from: [25, -70, 70] },
  ],
  // Gelats: el cucurutxo i les boles que s'hi apilen.
  [
    { src: img("cone"), size: [250, 572], x: 50, y: 70, width: 18, from: [0, 55, 20] },
    { src: img("scoop-pistachio"), size: [480, 497], x: 50, y: 40, width: 27, from: [-35, -70, -40] },
    { src: img("scoop-strawberry"), size: [258, 225], x: 51, y: 16, width: 25, rotate: 6, from: [35, -70, 50] },
  ],
  // Per beure: encara sense peces. Mentre no n'hi hagi, aquest pas ensenya les fotos dels bars.
  [],
];
