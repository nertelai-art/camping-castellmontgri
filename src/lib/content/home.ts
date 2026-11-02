// Els blocs de la portada que es poden amagar i moure des del panell. El hero no hi és: sempre va primer.
// Cada bloc és una secció; l'ordre és el seu `sort_order` i si surt, el seu `is_visible`.

import { moveItem } from "@/lib/admin/gallery";

export const HOME_BLOCKS = ["welcome", "accommodation", "explore", "map", "directions", "trip", "testimonials"] as const;
export type HomeBlock = (typeof HOME_BLOCKS)[number];

export const isHomeBlock = (key: string): key is HomeBlock => (HOME_BLOCKS as readonly string[]).includes(key);

/** Els blocs que surten, en l'ordre de les seccions (que ja arriben ordenades i només amb les visibles). */
export const homeBlocks = (keys: readonly string[]): HomeBlock[] => keys.filter(isHomeBlock);

/** Moure un bloc un lloc amunt o avall, i la numeració nova de tots: 10, 20, 30… per deixar lloc entre ells. */
export function moveHomeBlock(order: readonly HomeBlock[], key: HomeBlock, delta: 1 | -1): { key: HomeBlock; sort_order: number }[] {
  return moveItem([...order], key, delta).map((block, i) => ({ key: block as HomeBlock, sort_order: (i + 1) * 10 }));
}
