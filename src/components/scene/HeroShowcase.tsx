"use client";

// Secció del hero: alta, amb un contenidor sticky; text HTML real a sobre i el canvas darrere.
// No importa three.js directament: l'escena es carrega amb next/dynamic a la primera interacció.
// Sense WebGL o amb moviment reduït: el hero estàtic amb la foto aèria (que és també el primer fotograma).

import dynamic from "next/dynamic";
import Image from "next/image";
import { Fragment, useCallback, useRef, type ReactNode } from "react";
import { RichText } from "@/components/rich-text";
import { MontgriLine } from "@/components/site/montgri-line";
import type { MediaRef } from "@/lib/supabase/media";
import type { HeroPin } from "./HeroScene";
import { useFirstInteraction } from "./interaction";
import { HERO_PHASES, heroStep, range } from "./phases";
import { useNearViewport, useReducedMotion, useRenderMode, useScrollProgress } from "./scroll-scene";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false });

type Props = {
  poster: MediaRef | null;
  title: string;
  body: string | null;
  primaryCta: { href: string; label: string } | null;
  discoverLabel: string;
  season: ReactNode;
  map: { title: string; body: string | null; ctaLabel: string } | null;
  textureSrc: string | null;
  pins: HeroPin[];
  srDescription: string;
};

export function HeroShowcase({ poster, title, body, primaryCta, discoverLabel, season, map, textureSrc, pins, srDescription }: Props) {
  const section = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const sceneReady = useRef(false);
  const mode = useRenderMode();
  const reducedMotion = useReducedMotion();
  const interacted = useFirstInteraction();
  const near = useNearViewport(section);

  // Escena animada només amb WebGL, sense moviment reduït i amb el plànol disponible.
  // Al servidor («pending») es pinta ja la versió alta per no fer saltar la pàgina a la majoria.
  const animated = mode !== "static" && !reducedMotion && textureSrc !== null && map !== null;
  const words = title.split(" ");

  const onSceneReady = useCallback(() => {
    sceneReady.current = true;
    window.dispatchEvent(new Event("scroll")); // reaplica l'opacitat de la foto amb el progrés actual
  }, []);

  // Tot es toca directament al DOM: el progrés canvia a cada píxel i no volem re-renderitzar React.
  const progress = useScrollProgress(section, (p) => {
    const step = heroStep(p);
    if (intro.current) intro.current.dataset.state = step === 0 ? "active" : "hidden";
    if (outro.current) outro.current.dataset.state = step === 1 ? "active" : "hidden";
    // La foto només marxa quan l'escena ja és a punt: si no, quedaria un forat.
    if (photo.current) photo.current.style.opacity = String(sceneReady.current ? 1 - range(p, HERO_PHASES.photo) : 1);
    if (bar.current) bar.current.style.transform = `scaleX(${p})`;
  });

  return (
    <section ref={section} aria-labelledby="hero-title" className={`relative px-3 sm:px-4 ${animated ? "h-[260vh]" : ""}`}>
      <div className={animated ? "sticky top-[4.75rem] lg:top-[5.75rem]" : "pt-3 sm:pt-4"}>
        <div
          className={`relative isolate flex flex-col justify-end overflow-hidden rounded-[2rem] bg-band-olive text-on-dark lg:rounded-[2.5rem] ${
            animated ? "h-[calc(100svh-5.5rem)] lg:h-[calc(100svh-6.5rem)]" : "min-h-[calc(100svh-5.5rem)]"
          }`}
        >
          {/* Cel de fons de l'escena: degradat càlid, visible quan la foto marxa */}
          <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(120%_80%_at_50%_0%,#6f7d3c_0%,#3e4822_55%,#232a14_100%)]" />

          {animated && near && interacted && textureSrc && (
            <div className="absolute inset-0 -z-10">
              <HeroScene progress={progress} reducedMotion={reducedMotion} textureSrc={textureSrc} pins={pins} onReady={onSceneReady} />
            </div>
          )}

          <div ref={photo} className="absolute inset-0 -z-10 transition-opacity duration-300">
            {poster && <Image src={poster.src} alt={poster.alt} fill priority fetchPriority="high" sizes="100vw" className="ken-burns object-cover" />}
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgb(22_27_13/.15)_0%,rgb(22_27_13/.05)_35%,rgb(22_27_13/.78)_100%)]" />
          </div>

          <div
            ref={intro}
            data-state="active"
            className="bg-[linear-gradient(0deg,rgb(22_27_13/.7)_0%,rgb(22_27_13/.35)_55%,transparent_100%)] px-5 pb-10 pt-24 transition duration-500 data-[state=hidden]:pointer-events-none data-[state=hidden]:-translate-y-6 data-[state=hidden]:opacity-0 sm:px-10 sm:pb-14 lg:px-16 lg:pb-20"
          >
            {/* Posicionat respecte a la targeta del hero (el bloc de text no és «relative») */}
            <div className="absolute right-4 top-4 sm:right-8 sm:top-8">{season}</div>
            <h1 id="hero-title" className="font-display max-w-5xl text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.92]">
              {words.map((word, i) => (
                <Fragment key={i}>
                  <span className="rise inline-block" style={{ ["--i" as string]: i }}>
                    {word}
                  </span>
                  {i < words.length - 1 && " "}
                </Fragment>
              ))}
            </h1>
            <div className="rise mt-6 max-w-xl text-lg text-on-dark/90 sm:text-xl" style={{ ["--i" as string]: words.length }}>
              <RichText text={body} />
            </div>
            <div className="rise mt-8 flex flex-wrap items-center gap-4" style={{ ["--i" as string]: words.length + 1 }}>
              {primaryCta && (
                <a href={primaryCta.href} target="_blank" rel="noopener" className="rounded-full bg-band-terra px-7 py-3.5 font-bold text-on-dark transition hover:brightness-110">
                  {primaryCta.label}
                </a>
              )}
              <a href="#welcome" className="group inline-flex items-center gap-2 font-bold text-on-dark">
                {discoverLabel}
                <span aria-hidden="true" className="transition group-hover:translate-y-1">
                  ↓
                </span>
              </a>
            </div>
          </div>

          {animated && map && (
            <div
              ref={outro}
              data-state="hidden"
              className="absolute inset-x-0 top-0 bg-[linear-gradient(180deg,rgb(22_27_13/.6)_0%,rgb(22_27_13/.35)_60%,transparent_100%)] px-5 pb-16 pt-8 transition duration-500 data-[state=hidden]:pointer-events-none data-[state=hidden]:translate-y-6 data-[state=hidden]:opacity-0 sm:px-10 sm:pt-12 lg:px-16"
            >
              <p className="font-display max-w-2xl text-[clamp(2rem,4.5vw,3.75rem)] leading-none drop-shadow-[0_2px_12px_rgb(0_0_0/.5)]">{map.title}</p>
              {map.body && <p className="mt-4 max-w-md text-on-dark drop-shadow-[0_1px_6px_rgb(0_0_0/.6)]">{map.body}</p>}
              <a href="#map" className="mt-6 inline-block rounded-full bg-paper px-6 py-3 font-bold text-olive shadow-lg hover:bg-card">
                {map.ctaLabel} →
              </a>
            </div>
          )}

          <MontgriLine className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-on-dark/60 sm:h-24" />
          {animated && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-on-dark/15" aria-hidden="true">
              <div ref={bar} className="h-full origin-left scale-x-0 bg-terra-2" />
            </div>
          )}
          <p className="sr-only">{srDescription}</p>
        </div>
      </div>
    </section>
  );
}
