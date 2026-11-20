"use client";

// La pàgina de la galeria: totes les fotos, la primera més gran. En clicar-ne una, s'obre a pantalla completa i es pot
// passar amb els botons o les fletxes del teclat. El <dialog> ja porta el focus i la tecla Esc.

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, type RefObject } from "react";
import type { MediaRef } from "@/lib/supabase/media";

const ARROW = "grid size-12 place-items-center rounded-full bg-card text-xl font-bold text-ink shadow-lg transition hover:brightness-95";

export function ImageGallery({ photos }: { photos: MediaRef[] }) {
  const t = useTranslations("gallery");
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const move = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);
  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };

  return (
    <>
      <ul className="mt-10 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {photos.map((item, i) => (
          <li key={item.path} className={i === 0 ? "col-span-2 lg:row-span-2" : ""}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={t("open", { index: i + 1 })}
              className={`group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra ${i === 0 ? "aspect-[4/3] lg:aspect-auto lg:h-full" : "aspect-[4/3]"}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={i === 0}
                sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                className="object-cover transition duration-500 group-hover:scale-105"
                style={{ objectPosition: item.position }}
              />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox dialog={dialog} photos={photos} index={index} onMove={move} />
    </>
  );
}

/** Les fotos a pantalla completa, d'una en una. La fa servir també la pàgina de cada allotjament. */
export function Lightbox({ dialog, photos, index, onMove }: { dialog: RefObject<HTMLDialogElement | null>; photos: MediaRef[]; index: number; onMove: (delta: number) => void }) {
  const t = useTranslations("gallery");
  const tNav = useTranslations("nav");
  const photo = photos[index];
  return (
    <dialog
      ref={dialog}
      aria-label={t("label")}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") onMove(-1);
        if (event.key === "ArrowRight") onMove(1);
      }}
      className="m-auto h-svh max-h-none w-screen max-w-none bg-black/90 p-0 backdrop:bg-black/70"
    >
      {photo && (
        <div className="relative size-full">
          <Image key={photo.path} src={photo.src} alt={photo.alt} fill sizes="100vw" className="object-contain" />
          <p className="absolute left-4 top-4 rounded-full bg-card px-4 py-2 text-sm font-bold text-ink">{t("counter", { index: index + 1, total: photos.length })}</p>
          <form method="dialog" className="absolute right-4 top-4">
            <button aria-label={tNav("close")} className={ARROW}>
              ×
            </button>
          </form>
          {photos.length > 1 && (
            <>
              <button type="button" onClick={() => onMove(-1)} aria-label={t("previous")} className={`${ARROW} absolute left-4 top-1/2 -translate-y-1/2`}>
                ←
              </button>
              <button type="button" onClick={() => onMove(1)} aria-label={t("next")} className={`${ARROW} absolute right-4 top-1/2 -translate-y-1/2`}>
                →
              </button>
            </>
          )}
        </div>
      )}
    </dialog>
  );
}
