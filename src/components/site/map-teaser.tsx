"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MAP_OPEN_HASH, openMapView } from "@/lib/map/events";

/**
 * El mapa flotant, a baix a la dreta de totes les pàgines: un quadre amb la maqueta 3D girant. No és three.js (seria massa
 * pes per a cada pàgina) sinó la volta de la maqueta capturada en 240 fotogrames (`scripts/map-teaser.mjs`) i feta vídeo:
 * `public/map/teaser.mp4`, 140 KB, 24 fotogrames per segon: una volta cada 10 s, a poc a poc. Un vídeo el descodifica el xip de vídeo del mòbil; un WebP animat
 * (el que hi havia) el descodificava el processador fotograma a fotograma i anava a salts. D'entrada es veu el primer
 * fotograma (`teaser-still.webp`, 10 KB); el vídeo es posa quan el navegador està ociós, i amb moviment reduït no.
 * Amb el ratolí a sobre surt «Explorar mapa». A la portada obre el mapa a pantalla completa; a les altres pàgines hi porta i l'obre.
 * Les animacions són a `.map-teaser` (globals.css).
 */
export function MapTeaser() {
  const t = useTranslations("map");
  const locale = useLocale();
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => setSpinning(true);
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 2500);
    return () => clearTimeout(id);
  }, []);

  const label = t("teaser");
  const home = `/${locale}#${MAP_OPEN_HASH}`;

  return (
    <a
      href={home}
      onClick={(event) => {
        // A la portada el mapa ja hi és: s'obre aquí mateix. A les altres pàgines, l'enllaç porta a la portada i l'obre.
        if (!document.getElementById("map")) return;
        event.preventDefault();
        openMapView();
      }}
      aria-label={label}
      className="map-teaser group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 block size-24 cursor-pointer overflow-hidden rounded-2xl bg-band-olive shadow-[0_22px_44px_-16px_rgb(20_26_10/.7)] ring-2 ring-white sm:right-6 sm:size-28"
    >
      <Image src="/map/teaser-still.webp" alt="" fill sizes="112px" unoptimized className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
      {spinning && (
        // Sense so, en bucle i dins la pàgina (iOS no l'obre a pantalla completa). Mentre arriba, es veu el fotograma quiet de sota.
        <video
          src="/map/teaser.mp4"
          poster="/map/teaser-still.webp"
          autoPlay
          muted
          loop
          playsInline
          disablePictureInPicture
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      )}
      <span className="map-teaser-label absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-band-olive via-band-olive/85 to-transparent px-2 pb-2 pt-6 text-center text-xs font-bold leading-tight text-on-dark sm:text-sm">
        <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden="true">
          <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4zM9 4v13M15 6.5v13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        {label}
      </span>
    </a>
  );
}
