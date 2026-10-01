// Posició d'un punt sobre la il·lustració del mapa, en % (0–100) i amb dos decimals: el que desa `map_points`.

export type Position = { x: number; y: number };
type Box = { left: number; top: number; width: number; height: number };

const clamp = (value: number) => Math.round(Math.min(100, Math.max(0, value)) * 100) / 100;

/** On cau un clic (coordenades de pantalla) dins de la imatge, en %. Fora de la imatge, s'enganxa a la vora. */
export function pointerPosition(box: Box, clientX: number, clientY: number): Position {
  if (box.width <= 0 || box.height <= 0) return { x: 0, y: 0 };
  return { x: clamp(((clientX - box.left) / box.width) * 100), y: clamp(((clientY - box.top) / box.height) * 100) };
}

/** Mou el punt un pas (amb les fletxes del teclat), sense sortir del mapa. */
export function nudge(position: Position, dx: number, dy: number): Position {
  return { x: clamp(position.x + dx), y: clamp(position.y + dy) };
}
