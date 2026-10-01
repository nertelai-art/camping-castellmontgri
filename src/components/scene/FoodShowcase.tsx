"use client";

// Secció de gastronomia: text i passos a l'esquerra i, a la dreta, la «taula», on cada plat es munta peça a
// peça a mesura que es baixa (guiat pel scroll): la paella buida, l'arròs, el marisc; el cucurutxo i les boles.
// Les peces són imatges retallades (food-pieces.ts). Un pas que encara no en té ensenya les fotos dels seus locals.
// Sense 3D: tot es mou amb `transform`. Amb moviment reduït, cada pas ensenya les fotos dels seus locals, quietes.

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { MediaRef } from "@/lib/supabase/media";
import { FOOD_PIECES } from "./food-pieces";
import { cardPose, foodStep, MAX_CARDS, pieceTiming } from "./phases";
import { useReducedMotion, useScrollProgress } from "./scroll-scene";

export type FoodStepContent = { title: string; places: { name: string; image: MediaRef | null }[] };

type Props = { heading: ReactNode; steps: FoodStepContent[]; srDescription: string };

/** Les fotos que surten a taula a cada pas: les que tenen imatge, fins a `MAX_CARDS`. */
const photosOf = (step: FoodStepContent) => step.places.filter((p): p is { name: string; image: MediaRef } => p.image !== null).slice(0, MAX_CARDS);

/** Estil d'una peça en un moment del scroll: ve del seu origen (caient o creixent) i marxa cap amunt esvaint-se. */
function pieceStyle(progress: number, step: number, order: number) {
  const pieces = FOOD_PIECES[step]!;
  const piece = pieces[order]!;
  const { entered, left } = pieceTiming(progress, step, order, pieces.length);
  const away = 1 - entered;
  const { dx = 0, dy = 0, rotate = 0, scale = 1 } = piece.from;
  return {
    left: `${(piece.x + dx * away).toFixed(2)}%`,
    top: `${(piece.y + dy * away - 40 * left).toFixed(2)}%`,
    transform: `translate(-50%, -50%) rotate(${((piece.rotate ?? 0) + rotate * away).toFixed(2)}deg) scale(${((1 + (scale - 1) * away) * (1 - 0.2 * left)).toFixed(3)})`,
    opacity: (Math.min(1, entered * 2.2) * (1 - left)).toFixed(3),
  };
}

const SHADOW = {
  table: "drop-shadow-[0_18px_18px_rgb(35_42_20/.30)]",
  contact: "drop-shadow-[0_3px_3px_rgb(20_12_0/.45)]",
} as const;

export function FoodShowcase({ heading, steps, srDescription }: Props) {
  const section = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const animated = !useReducedMotion();
  // L'animació es fa un sol cop. Quan s'ha vist sencera queda fixada al final (`locked`) i, tan bon punt la
  // secció surt de pantalla per dalt, deixa de ser una secció alta amb scroll (`done`): en tornar enrere es
  // troba la taula parada tal com va quedar, sense haver de desfer tot el recorregut.
  const locked = useRef(false);
  const heightBefore = useRef(0);
  const [done, setDone] = useState(false);
  const scrub = animated && !done;

  /** Pinta la taula i els passos tal com toquen a `value` (0-1) del recorregut. */
  const paint = (value: number) => {
    const active = foodStep(value);
    list.current?.querySelectorAll<HTMLLIElement>(":scope > li").forEach((item, index) => {
      item.dataset.state = index < active ? "done" : index === active ? "active" : "todo";
    });
    if (bar.current) bar.current.style.transform = `scaleX(${value})`;
    // Cada foto sap de quin pas és i quina és dins del pas: la seva posició surt del progrés i prou.
    table.current?.querySelectorAll<HTMLElement>("[data-card]").forEach((card) => {
      const pose = cardPose(value, Number(card.dataset.step), Number(card.dataset.index), Number(card.dataset.count));
      card.style.left = `${pose.x}%`;
      card.style.top = `${pose.y}%`;
      card.style.transform = `translate(-50%, -50%) rotate(${pose.rotate.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`;
      card.style.opacity = pose.opacity.toFixed(3);
    });
    table.current?.querySelectorAll<HTMLElement>("[data-piece]").forEach((el) => {
      Object.assign(el.style, pieceStyle(value, Number(el.dataset.step), Number(el.dataset.order)));
    });
  };

  useScrollProgress(section, (value) => {
    if (!animated) return;
    if (value >= 0.995) locked.current = true;
    paint(locked.current ? 1 : value);
    const el = section.current;
    if (locked.current && !done && el && el.getBoundingClientRect().bottom <= 0) {
      heightBefore.current = el.offsetHeight;
      setDone(true);
    }
  });

  // En plegar la secció, tot el que hi ha a sota puja. Els navegadors amb ancoratge de scroll ho compensen
  // sols; als que no en tenen (Safari), es corregeix a mà perquè la pàgina no faci un salt.
  useLayoutEffect(() => {
    if (!done || !section.current) return;
    paint(1);
    if (!CSS.supports("overflow-anchor", "auto")) window.scrollBy(0, section.current.offsetHeight - heightBefore.current);
  }, [done]);

  return (
    <div ref={section} className={scrub ? "relative h-[320vh]" : "relative"}>
      <div className={scrub ? "sticky top-16 flex h-[calc(100svh-4rem)] items-center overflow-clip lg:top-20 lg:h-[calc(100svh-5rem)]" : ""}>
        <div
          className={`relative mx-auto w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8 ${
            scrub ? "flex h-full flex-col justify-center gap-4 lg:h-auto" : "grid"
          }`}
        >
          {/* A mòbil, dins la pantalla fixa només hi cap el titular i el pas actiu. */}
          <div className={`relative z-10 ${scrub ? "max-lg:[&_header>div]:hidden max-lg:[&_header>p:last-child]:hidden" : ""}`}>
            {heading}
            <ol ref={list} className="mt-6 grid gap-3 lg:mt-8">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  data-state={!animated ? "done" : done ? (i === steps.length - 1 ? "active" : "done") : i === 0 ? "active" : "todo"}
                  className={`rounded-2xl border border-transparent p-4 transition duration-500 data-[state=active]:border-terra/30 data-[state=active]:bg-card data-[state=active]:shadow-[0_18px_40px_-28px_rgb(35_42_20/.6)] ${
                    scrub ? "max-lg:data-[state=done]:hidden max-lg:data-[state=todo]:hidden" : ""
                  }`}
                >
                  <p className="font-display text-2xl text-olive">{step.title}</p>
                  <p className="mt-1 text-base text-muted">{step.places.map((p) => p.name).join(" · ")}</p>
                  {!animated && (
                    <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {photosOf(step).map((p) => (
                        <li key={p.name} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-2">
                          <Image src={p.image.src} alt={p.name} fill sizes="(min-width: 640px) 12rem, 45vw" className="object-cover" />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* La taula */}
          {animated && (
            <div aria-hidden="true" className="relative w-full max-lg:h-[40svh] lg:aspect-[5/4]">
              {/* La taula fa sempre 5:4, perquè les peces (col·locades en %) encaixin igual a mòbil que a escriptori. */}
              <div ref={table} className="absolute left-1/2 top-0 aspect-[5/4] h-full -translate-x-1/2 lg:inset-0 lg:h-auto lg:w-full lg:translate-x-0">
              {FOOD_PIECES.map((pieces, s) =>
                pieces.map((piece, order) => (
                  <Image
                    key={`${s}-${order}`}
                    data-piece
                    data-step={s}
                    data-order={order}
                    src={piece.src}
                    alt=""
                    width={piece.size[0]}
                    height={piece.size[1]}
                    unoptimized
                    className={`absolute h-auto max-w-none will-change-[transform,opacity] ${piece.shadow ? SHADOW[piece.shadow] : ""}`}
                    style={{ width: `${piece.width}%`, zIndex: s * 20 + (piece.z ?? order), ...pieceStyle(done ? 1 : 0, s, order) }}
                  />
                )),
              )}
              {steps.map((step, s) => {
                // Les fotos dels locals només surten als passos que encara no tenen peces.
                const photos = FOOD_PIECES[s]?.length ? [] : photosOf(step);
                return photos.map((p, i) => {
                  const pose = cardPose(done ? 1 : 0, s, i, photos.length);
                  return (
                    <figure
                      key={`${s}-${p.name}`}
                      data-card
                      data-step={s}
                      data-index={i}
                      data-count={photos.length}
                      className="absolute m-0 overflow-hidden rounded-2xl bg-card p-1.5 shadow-[0_26px_50px_-22px_rgb(35_42_20/.65)] ring-1 ring-ink/10 will-change-[transform,opacity] sm:p-2"
                      style={{
                        width: `${pose.width}%`,
                        left: `${pose.x}%`,
                        top: `${pose.y}%`,
                        transform: `translate(-50%, -50%) rotate(${pose.rotate.toFixed(2)}deg) scale(${pose.scale.toFixed(3)})`,
                        opacity: pose.opacity,
                        zIndex: s * 20 + i,
                      }}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper-2">
                        <Image src={p.image.src} alt="" fill sizes="(min-width: 1024px) 24vw, 45vw" className="object-cover" />
                      </div>
                      <figcaption className="font-display truncate px-1 pb-0.5 pt-1.5 text-sm text-olive sm:text-lg">{p.name}</figcaption>
                    </figure>
                  );
                });
              })}
              </div>
            </div>
          )}
        </div>

        {scrub && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-terra/10" aria-hidden="true">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-terra" />
          </div>
        )}
        <p className="sr-only">{srDescription}</p>
      </div>
    </div>
  );
}
