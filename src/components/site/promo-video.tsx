"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { PromoVideo as PromoVideoFiles } from "@/lib/supabase/content";

/**
 * «Veure el vídeo», al hero: un botó amb uns segons del vídeo en bucle (sense so) que obre el vídeo sencer a pantalla completa, amb so i
 * controls. No es posa sol ni amb so: és qui visita qui decideix. La vista prèvia es baixa quan el navegador està ociós (abans, la foto
 * quieta), i amb moviment reduït o «estalvi de dades» es queda la foto. El vídeo sencer no es baixa fins que s'obre.
 */
export function PromoVideo({ video, className = "" }: { video: PromoVideoFiles; className?: string }) {
  const t = useTranslations("hero");
  const tNav = useTranslations("nav");
  const dialog = useRef<HTMLDialogElement>(null);
  const player = useRef<HTMLVideoElement>(null);
  const [preview, setPreview] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (quiet || saveData) return;
    const start = () => setPreview(true);
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(start, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(start, 2500);
    return () => clearTimeout(id);
  }, []);

  const show = () => {
    setOpen(true);
    dialog.current?.showModal();
  };
  const close = () => {
    player.current?.pause();
    dialog.current?.close();
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className={`group flex items-center gap-3 rounded-full bg-black/35 p-1.5 pr-5 text-left text-on-dark ring-1 ring-white/30 backdrop-blur-md transition hover:bg-black/50 ${className}`}
      >
        <span className="relative block h-12 w-20 shrink-0 overflow-hidden rounded-full bg-band-olive">
          {/* eslint-disable-next-line @next/next/no-img-element -- la foto quieta del vídeo, a Storage: petita i sense optimitzar */}
          <img src={video.poster} alt="" className="absolute inset-0 size-full object-cover" />
          {preview && <video src={video.preview} autoPlay muted loop playsInline aria-hidden="true" className="absolute inset-0 size-full object-cover" />}
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/20 transition group-hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="size-5 drop-shadow">
              <path d="M8 5.5v13l11-6.5z" fill="white" />
            </svg>
          </span>
        </span>
        <span className="font-bold">{t("watchVideo")}</span>
      </button>

      <dialog
        ref={dialog}
        aria-label={t("watchVideo")}
        onClose={() => {
          player.current?.pause();
          setOpen(false);
        }}
        onClick={(event) => event.target === dialog.current && close()}
        className="m-auto h-svh max-h-none w-screen max-w-none bg-black/92 p-0 backdrop:bg-black/80"
      >
        <div className="relative grid size-full place-items-center p-4 sm:p-10">
          {open && (
            <video ref={player} src={video.src} poster={video.poster} controls autoPlay playsInline className="max-h-full w-full max-w-6xl rounded-2xl bg-black shadow-2xl" />
          )}
          <button type="button" onClick={close} aria-label={tNav("close")} className="absolute right-4 top-4 grid size-12 place-items-center rounded-full bg-white text-ink shadow-lg transition hover:scale-105">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </dialog>
    </>
  );
}
