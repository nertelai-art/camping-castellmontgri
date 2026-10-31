"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { countAt, stageProgress } from "@/lib/scroll/stage";

// Ha de ser la mateixa condició que el `@media` de `.welcome` a globals.css: si no es compleix, la secció és estàtica.
const ANIMATED = "(prefers-reduced-motion: no-preference) and (min-height: 560px)";
// Quan compten les xifres, dins del recorregut (les transicions de CSS van amb els mateixos trams).
const COUNT_FROM = 0.58;
const COUNT_TO = 0.8;

/** Només posa el progrés del scroll a `--p` i fa comptar les xifres: tota la coreografia és CSS. */
export function WelcomeStage({ className, children, ...rest }: { className: string; children: ReactNode; "data-edit"?: string; id?: string; "aria-labelledby"?: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = window.matchMedia(ANIMATED);
    const counters = [...el.querySelectorAll<HTMLElement>("[data-count]")].map((node) => ({ node, value: Number(node.dataset.count) }));
    let frame = 0;
    let last = -1;

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const progress = Number(stageProgress(rect.top, rect.height, window.innerHeight).toFixed(4));
      if (progress === last) return;
      last = progress;
      el.style.setProperty("--p", String(progress));
      for (const { node, value } of counters) node.textContent = String(countAt(value, progress, COUNT_FROM, COUNT_TO));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Sense animació (o en tornar-ne), les xifres han de quedar al seu valor de veritat.
    const sync = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (media.matches) {
        last = -1;
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        update();
      } else {
        for (const { node, value } of counters) node.textContent = String(value);
      }
    };

    sync();
    media.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", sync);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <section ref={root} className={className} {...rest}>
      {children}
    </section>
  );
}
