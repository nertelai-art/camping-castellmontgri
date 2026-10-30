// El punt d'una foto que no s'ha de retallar, en % des de l'esquerra i des de dalt. Una foto es veu en proporcions
// diferents segons la pantalla: aquest punt és el que es manté a la vista (`object-position`).

import type { Position } from "@/lib/map/position";

export const CENTER: Position = { x: 50, y: 50 };

export const focusPosition = ({ x, y }: Position) => `${x}% ${y}%`;

/** El punt tal com arriba d'un formulari, o `null` si no és vàlid. */
export function parseFocus(x: unknown, y: unknown): Position | null {
  if (typeof x !== "string" || typeof y !== "string" || x === "" || y === "") return null;
  const focus = { x: Number(x), y: Number(y) };
  const valid = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;
  return valid(focus.x) && valid(focus.y) ? focus : null;
}
