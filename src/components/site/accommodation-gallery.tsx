"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState, ViewTransition } from "react";
import { accommodationPhotoTransition } from "@/lib/content/accommodation";
import type { MediaRef } from "@/lib/supabase/media";
import { Lightbox } from "./image-gallery";

/**
 * Les fotos de la pàgina d'un allotjament: a l'escriptori, una de gran i quatre de petites al costat; al mòbil, una tira que llisca.
 * Qualsevol foto, o «Veure les N fotos», obre la galeria a pantalla completa.
 */
export function AccommodationGallery({ photos, name, slug }: { photos: MediaRef[]; name: string; slug: string }) {
  const t = useTranslations("accommodation");
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  if (!photos.length) return null;
  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const move = (delta: number) => setIndex((i) => (i + delta + photos.length) % photos.length);
  // A l'escriptori: amb cinc o més, la gran i quatre al costat; amb tres o quatre, la gran i dues; amb menys, les que hi hagi.
  const shown = photos.length >= 5 ? 5 : photos.length >= 3 ? 3 : photos.length;
  const columns = { 5: "md:grid-cols-4", 3: "md:grid-cols-3", 2: "md:grid-cols-2 md:grid-rows-1", 1: "md:grid-cols-1 md:grid-rows-1" }[shown];

  return (
    <div className="relative">
      <ul aria-label={t("gallery", { name })} className={`snap-strip -mx-4 auto-cols-[85%] scroll-px-4 gap-2 px-4 sm:auto-cols-[60%] md:mx-0 md:h-[min(34rem,62svh)] md:grid-flow-row md:grid-rows-2 md:gap-2.5 md:overflow-hidden md:rounded-[2rem] md:px-0 ${columns}`}>
        {photos.slice(0, Math.max(shown, Math.min(photos.length, 5))).map((photo, i) => (
          <li key={photo.path} className={`accommodation-build ${i === 0 && shown > 2 ? "md:col-span-2 md:row-span-2" : ""} ${i >= shown ? "md:hidden" : ""}`} style={{ ["--i" as string]: i }}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={t("photo", { index: i + 1, total: photos.length })}
              className="group relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-3xl bg-paper-2 md:aspect-auto md:h-full md:rounded-none"
            >
              {i === 0 ? (
                // La foto de la targeta arriba volant aquí (mateix nom de transició).
                <ViewTransition name={accommodationPhotoTransition(slug)} share="accommodation-photo">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    priority
                    sizes="(min-width: 768px) 50vw, 85vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                    style={{ objectPosition: photo.position }}
                  />
                </ViewTransition>
              ) : (
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 85vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                  style={{ objectPosition: photo.position }}
                />
              )}
            </button>
          </li>
        ))}
      </ul>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => open(0)}
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-card/95 px-4 py-2.5 text-sm font-bold text-ink shadow-lg backdrop-blur transition hover:bg-card max-md:hidden"
        >
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {t("allPhotos", { count: photos.length })}
        </button>
      )}
      <Lightbox dialog={dialog} photos={photos} index={index} onMove={move} />
    </div>
  );
}
