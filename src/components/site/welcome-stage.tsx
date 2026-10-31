"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { collapseShift, countAt, stageProgress } from "@/lib/scroll/stage";

// Ha de ser la mateixa condició que el `@media` de `.welcome` a globals.css: si no es compleix, la secció és estàtica.
const ANIMATED = "(prefers-reduced-motion: no-preference) and (min-height: 560px)";
// Quan compten les xifres, dins del recorregut (les transicions de CSS van amb els mateixos trams).
const COUNT_FROM = 0.58;
const COUNT_TO = 0.8;
// Quant de temps sense scroll vol dir que s'ha aturat. Abans no es pot tocar: un `scrollBy` tallaria el salt d'un enllaç del menú o la inèrcia del mòbil.
const IDLE_MS = 140;

/**
 * Posa el progrés del scroll a `--p` i fa comptar les xifres: tota la coreografia és CSS.
 * L'animació només es fa una vegada: en arribar al final queda clavada (la foto oberta i les xifres) i la secció perd el recorregut, perquè en tornar enrere
 * no es desfaci ni s'hagi de tornar a passar. Es fa quan el scroll s'atura, i pujant la pàgina just el que s'ha tret, de manera que la vista no es mou.
 */
export function WelcomeStage({ className, children, ...rest }: { className: string; children: ReactNode; "data-edit"?: string; id?: string; "aria-labelledby"?: string }) {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = window.matchMedia(ANIMATED);
    const counters = [...el.querySelectorAll<HTMLElement>("[data-count]")].map((node) => ({ node, value: Number(node.dataset.count) }));
    let frame = 0;
    let last = -1;
    let idle = 0;
    let finished = false;

    const stop = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };

    const showFinal = () => {
      el.style.setProperty("--p", "1");
      for (const { node, value } of counters) node.textContent = String(value);
    };

    const collapse = () => {
      stop();
      const before = el.offsetHeight;
      const { top } = el.getBoundingClientRect();
      el.dataset.done = "";
      window.scrollBy({ top: -collapseShift(top, before - el.offsetHeight), behavior: "instant" });
    };

    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const progress = Number(stageProgress(rect.top, rect.height, window.innerHeight).toFixed(4));
      if (progress >= 1) finished = true;
      if (finished) showFinal();
      else if (progress !== last) {
        last = progress;
        el.style.setProperty("--p", String(progress));
        for (const { node, value } of counters) node.textContent = String(countAt(value, progress, COUNT_FROM, COUNT_TO));
      }
      if (finished) {
        window.clearTimeout(idle);
        idle = window.setTimeout(collapse, IDLE_MS);
      }
    };
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    // Sense animació (o en tornar-ne), les xifres han de quedar al seu valor de veritat.
    const sync = () => {
      stop();
      if (media.matches && el.dataset.done === undefined) {
        last = -1;
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
        update();
      } else {
        showFinal();
      }
    };

    sync();
    media.addEventListener("change", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      media.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <section ref={root} className={className} {...rest}>
      {children}
    </section>
  );
}
