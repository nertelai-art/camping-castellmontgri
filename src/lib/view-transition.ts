import { flushSync } from "react-dom";

/**
 * Canvia l'estat dins d'una transició de vista, si el navegador en sap i ningú ha demanat moviment reduït. Si no, el canvi es fa i prou.
 * `flushSync`: el navegador fa la foto del després quan acaba la funció, i React ja ho ha de tenir pintat.
 */
export function withViewTransition(update: () => void): Promise<void> {
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();
    return Promise.resolve();
  }
  return document.startViewTransition(() => flushSync(update)).finished;
}
