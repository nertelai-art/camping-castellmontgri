"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";

// Peces comunes de les escenes 3D guiades pel scroll (ampolles, coberta).

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const noop = () => () => {};
const subscribeReducedMotion = (callback: () => void) => {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

const hasWebGLApi = () => typeof WebGL2RenderingContext !== "undefined" || typeof WebGLRenderingContext !== "undefined";

/**
 * «3d», «static» (sense WebGL) o «pending» al servidor, fins que hidrata.
 * Només mira si el navegador té l'API: crear un context de prova és car (desenes de mil·lisegons, segons
 * sense GPU). Si després l'escena no pot crear el seu, `WebGLBoundary` avisa i es passa a la versió sense 3D.
 */
export function useRenderMode() {
  return useSyncExternalStore(noop, () => (hasWebGLApi() ? "3d" : "static"), () => "pending" as const);
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(reducedMotionQuery).matches, () => false);
}

/** Es torna `true` (per sempre) quan l'element és a menys de `margin` de la pantalla. */
export function useNearViewport(ref: RefObject<HTMLElement | null>, margin = "1500px") {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${margin} 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, margin]);
  return near;
}

const INTERACTIONS = ["scroll", "pointerdown", "pointermove", "keydown", "touchstart", "wheel"] as const;

/**
 * Es torna `true` (per sempre) a la primera interacció de qui visita: scroll, ratolí, teclat o dit.
 * Serveix per no carregar three.js mentre la pàgina encara arrenca: a mòbil, compilar-lo i muntar una
 * escena durant la càrrega bloqueja el fil principal uns quants segons.
 */
export function useInteracted() {
  const [interacted, setInteracted] = useState(false);
  useEffect(() => {
    const done = () => setInteracted(true);
    const options = { once: true, passive: true } as const;
    for (const type of INTERACTIONS) window.addEventListener(type, done, options);
    return () => {
      for (const type of INTERACTIONS) window.removeEventListener(type, done);
    };
  }, []);
  return interacted;
}

/**
 * Progrés (0-1) del scroll dins d'una secció alta amb contingut sticky. Es guarda en una ref i no
 * en estat: canvia a cada píxel i no volem re-renderitzar React. `onChange` permet tocar el DOM.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>, onChange?: (progress: number) => void) {
  const progress = useRef(0);
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });
  useEffect(() => {
    const update = () => {
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      progress.current = distance > 0 ? Math.min(1, Math.max(0, -rect.top / distance)) : 1;
      callback.current?.(progress.current);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return progress;
}
