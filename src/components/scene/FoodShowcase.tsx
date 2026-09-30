"use client";

// Secció de gastronomia: text i passos a l'esquerra, l'escena 3D a la dreta (a mòbil, darrere).
// Sense WebGL o amb moviment reduït: la foto de la secció, i els passos tots visibles.

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRef, type ReactNode } from "react";
import type { MediaRef } from "@/lib/supabase/media";
import { foodStep } from "./phases";
import { useNearViewport, useReducedMotion, useRenderMode, useScrollProgress } from "./scroll-scene";

const FoodScene = dynamic(() => import("./FoodScene"), { ssr: false });

export type FoodStepContent = { title: string; places: string[] };

type Props = { heading: ReactNode; steps: FoodStepContent[]; fallback: MediaRef | null; srDescription: string };

export function FoodShowcase({ heading, steps, fallback, srDescription }: Props) {
  const section = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const mode = useRenderMode();
  const reducedMotion = useReducedMotion();
  const near = useNearViewport(section);
  const animated = mode !== "static" && !reducedMotion;

  const progress = useScrollProgress(section, (value) => {
    const active = animated ? foodStep(value) : steps.length - 1;
    list.current?.querySelectorAll<HTMLLIElement>(":scope > li").forEach((item, index) => {
      item.dataset.state = !animated ? "done" : index < active ? "done" : index === active ? "active" : "todo";
    });
    if (bar.current) bar.current.style.transform = `scaleX(${value})`;
  });

  return (
    <div ref={section} className={animated ? "relative h-[320vh]" : "relative"}>
      <div className={animated ? "sticky top-16 flex h-[calc(100svh-4rem)] items-center lg:top-20 lg:h-[calc(100svh-5rem)]" : ""}>
        <div
          className={`relative mx-auto w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid lg:grid-cols-[1fr_1.1fr] lg:items-center lg:px-8 ${
            animated ? "flex h-full flex-col justify-center gap-4 lg:h-auto" : "grid"
          }`}
        >
          {/* A mòbil, dins la pantalla fixa només hi cap el titular i el pas actiu. */}
          <div className={`relative z-10 ${animated ? "max-lg:[&_header>div]:hidden max-lg:[&_header>p:last-child]:hidden" : ""}`}>
            {heading}
            <ol ref={list} className="mt-6 grid gap-3 lg:mt-8">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  data-state={animated ? (i === 0 ? "active" : "todo") : "done"}
                  className={`rounded-2xl border border-transparent p-4 transition duration-500 data-[state=active]:border-terra/30 data-[state=active]:bg-card data-[state=active]:shadow-[0_18px_40px_-28px_rgb(35_42_20/.6)] lg:data-[state=todo]:opacity-45 ${
                    animated ? "max-lg:data-[state=done]:hidden max-lg:data-[state=todo]:hidden" : ""
                  }`}
                >
                  <p className="font-display text-2xl text-olive">{step.title}</p>
                  <p className="mt-1 text-sm text-muted">{step.places.join(" · ")}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className={`relative w-full ${animated ? "max-lg:h-[38svh] lg:aspect-[5/4]" : "aspect-[4/3] lg:aspect-[5/4]"}`}>
            {animated ? (
              near && (
                <div className="absolute inset-0">
                  <FoodScene progress={progress} reducedMotion={reducedMotion} />
                </div>
              )
            ) : (
              fallback && (
                <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
                  <Image src={fallback.src} alt={fallback.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
                </div>
              )
            )}
          </div>
        </div>

        {animated && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-terra/10" aria-hidden="true">
            <div ref={bar} className="h-full origin-left scale-x-0 bg-terra" />
          </div>
        )}
        <p className="sr-only">{srDescription}</p>
      </div>
    </div>
  );
}
