"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { openMapView } from "@/lib/map/events";

/**
 * La imatge flotant del mapa, a baix a la dreta: un retall del plànol que, amb el ratolí a sobre, s'obre en «Explora el càmping».
 * En clicar-hi s'obre el mapa a pantalla completa. Surt quan ja s'ha deixat enrere el hero i s'amaga quan el mapa és a la vista:
 * allà ja hi és. Les animacions són a `.map-teaser` (globals.css); amb moviment reduït, només canvia de lloc.
 */
export function MapTeaser() {
  const t = useTranslations("map");
  const [pastHero, setPastHero] = useState(false);
  const [mapInView, setMapInView] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("main > section:first-child");
    const map = document.getElementById("map");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        if (entry.target === map) setMapInView(entry.isIntersecting);
      }
    });
    if (hero) observer.observe(hero);
    if (map) observer.observe(map);
    return () => observer.disconnect();
  }, []);

  const visible = pastHero && !mapInView;

  return (
    <button
      type="button"
      onClick={openMapView}
      aria-label={t("teaser")}
      data-visible={visible}
      inert={!visible}
      className="map-teaser group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-30 flex items-center rounded-full bg-band-olive p-1.5 text-on-dark shadow-[0_18px_40px_-14px_rgb(20_26_10/.65)] sm:right-6"
    >
      <span className="map-teaser-label grid grid-cols-[0fr] transition-[grid-template-columns] duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:grid-cols-[1fr] group-focus-visible:grid-cols-[1fr]">
        <span className="overflow-hidden whitespace-nowrap font-bold">
          <span className="block pl-4 pr-3">{t("teaser")}</span>
        </span>
      </span>
      <span className="map-teaser-thumb relative block size-16 overflow-hidden rounded-full ring-2 ring-on-dark/80 sm:size-[4.5rem]">
        <Image src="/map/ground-s.jpg" alt="" fill sizes="72px" className="object-cover object-[46%_52%] transition duration-700 group-hover:scale-125" />
        <span aria-hidden="true" className="map-teaser-pin absolute left-1/2 top-1/2 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-terra text-on-dark shadow-md">
          <svg viewBox="0 0 24 24" className="size-4">
            <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="12" cy="9.5" r="2.4" fill="currentColor" />
          </svg>
        </span>
      </span>
    </button>
  );
}
