"use client";

import { useEffect } from "react";

/**
 * Afegeix `.is-shown` als elements `.reveal` quan entren a la pantalla (una sola vegada).
 * Un sol observador per a tota la pàgina; no pinta res.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-shown");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".reveal:not(.is-shown)").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return null;
}
