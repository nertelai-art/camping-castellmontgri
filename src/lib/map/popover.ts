// On es posa la fitxa que surt d'un marcador del mapa: a sobre del marcador si hi cap, a sota si no, i sempre
// sencera dins del visor. Tot en píxels del visor.

type Size = { width: number; height: number };
export type CardPlace = {
  left: number;
  top: number;
  /** La fitxa queda sota el punt (a sobre no hi cabia). */
  below: boolean;
  /** On cau el punt respecte de la vora esquerra de la fitxa: d'allà surt la fitxa (i hi apunta la punta). */
  tail: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

/**
 * @param point  on és el punt del mapa (la base del marcador)
 * @param marker alçada del marcador que hi ha a sobre del punt: la fitxa no l'ha de tapar
 */
export function placeCard(point: { x: number; y: number }, card: Size, stage: Size, marker = 72, margin = 10): CardPlace {
  const left = clamp(point.x - card.width / 2, margin, stage.width - card.width - margin);
  const above = point.y - marker - card.height - margin;
  const below = above < margin;
  const top = below ? clamp(point.y + margin, margin, stage.height - card.height - margin) : above;
  // La punta no arriba a les cantonades arrodonides.
  const tail = clamp(point.x - left, 28, card.width - 28);
  return { left: Math.round(left), top: Math.round(top), below, tail: Math.round(tail) };
}
