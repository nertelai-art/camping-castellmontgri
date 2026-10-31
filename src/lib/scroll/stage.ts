// Una escena fixada guiada pel scroll: què toca segons on és el bloc. Sense DOM, perquè es pugui provar.

/** De 0 (el bloc just arriba a dalt de tot) a 1 (se n'acaba d'anar el tram fixat). */
export function stageProgress(top: number, height: number, viewport: number): number {
  const travel = height - viewport;
  if (travel <= 0) return 0;
  return Math.min(1, Math.max(0, -top / travel));
}

/** La xifra a mig compte: de 0 al valor mentre el progrés va de `from` a `to`, sense passar-se'n mai. */
export function countAt(value: number, progress: number, from: number, to: number): number {
  const t = Math.min(1, Math.max(0, (progress - from) / (to - from)));
  return Math.round(value * t);
}

/**
 * Quant s'ha de tornar a pujar la pàgina quan l'escena acabada perd el recorregut, perquè el que es veu no es mogui.
 * Només el que ja s'ha passat: si el bloc encara és a sota, treure-li alçada no mou res del que hi ha a dalt.
 */
export const collapseShift = (top: number, removed: number) => Math.min(removed, Math.max(0, -top));
