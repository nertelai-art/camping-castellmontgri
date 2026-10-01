// Fases de les escenes guiades pel scroll (0-1). Sense three.js: l'HTML les llegeix per saber
// quin pas està actiu, i les escenes 3D per saber què han de moure.

export type Range = readonly [number, number];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Progrés local (0-1) dins una fase. */
export const range = (p: number, [a, b]: Range) => clamp01((p - a) / (b - a));

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export function easeOutBounce(t: number) {
  const n = 7.5625;
  const d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

/** Gastronomia: tres objectes que entren i surten com en un carrusel. */
export const FOOD_PHASES = {
  paella: [0, 0.4],
  icecream: [0.33, 0.72],
  drink: [0.66, 1],
} as const satisfies Record<string, Range>;

export const FOOD_STEPS = ["paella", "icecream", "drink"] as const;
export type FoodStep = (typeof FOOD_STEPS)[number];

/** Pas actiu de la gastronomia: el de la fase que ocupa el centre en aquell moment. */
export function foodStep(p: number): number {
  if (p < 0.365) return 0;
  if (p < 0.69) return 1;
  return 2;
}
