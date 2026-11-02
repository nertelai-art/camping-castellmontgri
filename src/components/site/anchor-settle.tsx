"use client";

import { useEffect } from "react";

const IDLE_MS = 220;
/** Fins aquí es dona per bo on ha quedat el salt (la capçalera ja es té en compte amb `scroll-padding`). */
const TOLERANCE_PX = 6;

/**
 * Els enllaços del menú que salten a una secció. El navegador calcula on anar en clicar, però les seccions amb `.cv` encara no han fet la seva alçada
 * de debò, i arribava unes quantes desenes de píxels (o centenars) més avall. Quan el scroll s'atura, si no hi és, s'hi acaba d'arribar. No pinta res.
 */
export function AnchorSettle() {
  useEffect(() => {
    let target: HTMLElement | null = null;
    let timer = 0;

    const settle = () => {
      if (!target) return;
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (Math.abs(target.getBoundingClientRect().top - padding) > TOLERANCE_PX) target.scrollIntoView({ behavior: "smooth" });
      target = null;
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, IDLE_MS);
    };
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
      target = link ? document.getElementById(link.hash.slice(1)) : null;
    };
    // Qui toca la pàgina ja no vol anar a la secció: no se l'ha de tornar a portar.
    const cancel = () => {
      target = null;
    };

    document.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", cancel, { passive: true });
    window.addEventListener("touchstart", cancel, { passive: true });
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", cancel);
      window.removeEventListener("touchstart", cancel);
    };
  }, []);
  return null;
}
