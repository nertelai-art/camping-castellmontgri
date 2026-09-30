"use client";

import { useEffect, useState } from "react";

const EVENTS = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"] as const;

/**
 * `true` a partir de la primera interacció (scroll, toc, tecla). L'escena del hero s'hi espera:
 * three.js són ~250 KB i, carregat en ociós, encara queia dins la càrrega de la pàgina (TBT de
 * 1,3-3,7 s a Lighthouse mòbil). L'animació només comença amb el scroll, així que no es perd res:
 * fins que l'escena és a punt, la foto aèria continua tapant.
 */
export function useFirstInteraction() {
  const [interacted, setInteracted] = useState(false);
  useEffect(() => {
    const done = () => {
      setInteracted(true);
      for (const e of EVENTS) window.removeEventListener(e, done);
    };
    for (const e of EVENTS) window.addEventListener(e, done, { passive: true, once: true });
    return () => {
      for (const e of EVENTS) window.removeEventListener(e, done);
    };
  }, []);
  return interacted;
}
