// Fases de les animacions guiades pel scroll (0-1). Funcions pures: l'HTML les llegeix per saber quin pas
// està actiu i on ha de ser cada peça en cada moment.

export type Range = readonly [number, number];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** Progrés local (0-1) dins una fase. */
export const range = (p: number, [a, b]: Range) => clamp01((p - a) / (b - a));

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t: number) => t * t * t;

/** Gastronomia: tres passos (menjar, gelats, beure). Cada pas ocupa un tram del scroll i se solapa amb el següent. */
export const FOOD_PHASES = [
  [0, 0.4],
  [0.33, 0.72],
  [0.66, 1],
] as const satisfies readonly Range[];

/** Pas actiu de la gastronomia: el que ocupa la taula en aquell moment. */
export function foodStep(p: number): number {
  if (p < 0.365) return 0;
  if (p < 0.69) return 1;
  return 2;
}

/** On queda cada foto sobre la taula, segons quantes n'hi ha: centre (x, y) i amplada en % de la taula, i gir en graus. */
const LAYOUTS: Record<number, readonly (readonly [number, number, number, number])[]> = {
  1: [[50, 50, 62, -3]],
  2: [
    [35, 44, 50, -5],
    [67, 60, 46, 4],
  ],
  3: [
    [31, 38, 46, -5],
    [69, 36, 40, 4],
    [52, 70, 44, -2],
  ],
  4: [
    [29, 33, 42, -5],
    [71, 30, 38, 4],
    [33, 72, 38, 3],
    [70, 71, 42, -3],
  ],
};
export const MAX_CARDS = 4;

// Cada foto entra per un costat diferent, com qui para taula.
const ENTRIES = [
  [-55, -30, -22],
  [55, -40, 20],
  [-50, 45, 16],
  [55, 40, -18],
] as const;

export type CardPose = { x: number; y: number; width: number; rotate: number; scale: number; opacity: number };

/**
 * Posició d'una foto de la gastronomia en un moment del scroll. `x`, `y` i `width` són % de la taula
 * (x i y, el centre de la foto). Entra esglaonada al principi del seu pas (apareixent mentre s'acosta), s'hi
 * queda, i marxa cap amunt esvaint-se quan comença el pas següent; l'últim pas no marxa.
 */
export function cardPose(progress: number, step: number, index: number, count: number): CardPose {
  const layout = LAYOUTS[Math.min(MAX_CARDS, Math.max(1, count))]!;
  const [x, y, width, rotate] = layout[index % layout.length]!;
  const local = range(progress, FOOD_PHASES[step]!);
  // El primer pas ja és a taula quan s'hi arriba: no s'ha d'esperar res per veure la primera foto.
  const enterStart = step === 0 ? -1 : 0.05 + index * 0.07;
  const entered = easeOutCubic(clamp01((local - enterStart) / 0.38));
  const last = step === FOOD_PHASES.length - 1;
  // Fins i tot l'última foto (índex 3) ha d'haver marxat del tot quan s'acaba el pas: 0,74 + 0,09 + 0,17 = 1.
  const left = last ? 0 : easeInCubic(clamp01((local - (0.74 + index * 0.03)) / 0.17));
  const [fromX, fromY, fromRotate] = ENTRIES[index % ENTRIES.length]!;
  const away = 1 - entered;
  return {
    x: x + fromX * away,
    y: y + fromY * away - 60 * left,
    width,
    rotate: rotate + fromRotate * away + 14 * left * (index % 2 ? 1 : -1),
    scale: 0.7 + 0.3 * entered - 0.15 * left,
    opacity: Math.min(1, entered * 1.6) * (1 - left),
  };
}

export type PieceTiming = { entered: number; left: number };

/**
 * Quant ha arribat (`entered`, 0-1) i quant ha marxat (`left`, 0-1) la peça número `order` de les `count`
 * que munten el plat d'un pas. Arriben una darrere l'altra durant la primera meitat del pas; la primera
 * del primer pas ja hi és en arribar a la secció. Totes marxen alhora al final del pas, tret de l'últim.
 */
export function pieceTiming(progress: number, step: number, order: number, count: number): PieceTiming {
  const local = range(progress, FOOD_PHASES[step]!);
  const spread = 0.55 / Math.max(1, count);
  const start = step === 0 && order === 0 ? -1 : 0.04 + order * spread;
  const entered = easeOutCubic(clamp01((local - start) / 0.2));
  const last = step === FOOD_PHASES.length - 1;
  const left = last ? 0 : easeInCubic(clamp01((local - 0.82) / 0.18));
  return { entered, left };
}

