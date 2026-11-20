"use client";

import { useEffect } from "react";

/**
 * Les fotos de «Més que dormir» es mouen més a poc a poc que la pàgina. Només les que són a la vista, un sol `requestAnimationFrame` per
 * scroll i res de React: escriu `--shift` a cada foto i el CSS la desplaça. Amb moviment reduït no fa res. No pinta res.
 */
export function ExploreParallax() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const visible = new Set<HTMLElement>();
    let frame = 0;
    const update = () => {
      frame = 0;
      const middle = window.innerHeight / 2;
      for (const el of visible) {
        const box = el.parentElement!.getBoundingClientRect();
        // −1 quan el centre de la foto és a baix de tot de la pantalla, 1 quan és a dalt de tot.
        const progress = Math.max(-1, Math.min(1, (middle - (box.top + box.height / 2)) / middle));
        el.style.setProperty("--shift", `${(progress * 6).toFixed(2)}%`);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(el);
        else visible.delete(el);
      }
      schedule();
    });
    document.querySelectorAll<HTMLElement>(".explore [data-parallax]").forEach((el) => observer.observe(el));
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
