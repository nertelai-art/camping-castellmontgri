"use client";

// El mapa del càmping: la maqueta 3D (o el visor pla sense WebGL), els filtres, la fitxa del lloc triat
// i, a sota, la llegenda amb les icones de la il·lustració.

import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { RichText } from "@/components/rich-text";
import type { MapViewerHandle } from "@/components/scene/MapScene";
import { useNearViewport, useReducedMotion, useRenderMode } from "@/components/scene/scroll-scene";
import { MAP_FOCUS_EVENT, targetKey } from "@/lib/map/events";
import { KIND_COLOR, MAP_KINDS as KINDS, type MapKind as Kind } from "@/lib/map/kinds";
import type { MapPoint, MapTarget } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { MapFlat } from "./map-flat";
import { MarkerIcon } from "./map-marker";

const MapScene = dynamic(() => import("@/components/scene/MapScene"), { ssr: false });

export type Place = { name: string; description: string | null; hours: string | null; image: MediaRef | null };

type Props = { image: MediaRef; points: MapPoint[]; places: Record<string, Place> };

const coarseQuery = "(pointer: coarse)";
const subscribeCoarse = (callback: () => void) => {
  const media = window.matchMedia(coarseQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};

export function MapExplorer({ image, points, places }: Props) {
  const t = useTranslations("map");
  const shell = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const viewer = useRef<MapViewerHandle>(null);
  const cycle = useRef(new Map<string, number>());
  const mode = useRenderMode();
  const reducedMotion = useReducedMotion();
  const near = useNearViewport(frame, "900px");
  const coarse = useSyncExternalStore(subscribeCoarse, () => window.matchMedia(coarseQuery).matches, () => false);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [touchActive, setTouchActive] = useState(false);

  const is3d = mode === "3d";
  const visible = useMemo(() => points.filter((p) => filter === "all" || p.kind === filter), [points, filter]);
  const selected = points.find((p) => p.id === selectedId) ?? null;
  const selectedPlace = selected?.target ? places[targetKey(selected.target)] : undefined;
  const kinds = useMemo(() => KINDS.filter((k) => points.some((p) => p.kind === k)), [points]);
  // Llegenda: per tipus, un element per nom (els quatre sanitaris en són un, amb el recompte).
  const legend = useMemo(
    () =>
      kinds.map((kind) => {
        const byLabel = new Map<string, MapPoint[]>();
        for (const p of points) if (p.kind === kind) byLabel.set(p.label, [...(byLabel.get(p.label) ?? []), p]);
        return { kind, entries: [...byLabel.values()] };
      }),
    [kinds, points],
  );

  const onReady = useCallback(() => setReady(true), []);
  const select = useCallback((p: MapPoint) => {
    setSelectedId(p.id);
    viewer.current?.focus(p);
  }, []);

  /** Des de fora del visor (llegenda, «Veure al mapa»): hi porta la pàgina i treu el filtre si l'amagava. */
  const reveal = useCallback(
    (p: MapPoint) => {
      setFilter((f) => (f === "all" || f === p.kind ? f : "all"));
      setStarted(true);
      frame.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      select(p);
    },
    [select, reducedMotion],
  );

  useEffect(() => {
    const onFocus = (e: Event) => {
      const target = (e as CustomEvent<MapTarget>).detail;
      const point = points.find((p) => p.target && targetKey(p.target) === targetKey(target));
      if (point) reveal(point);
    };
    window.addEventListener(MAP_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(MAP_FOCUS_EVENT, onFocus);
  }, [points, reveal]);

  // L'entrada (la maqueta creix) comença quan el mapa ocupa prou pantalla. En sortir-ne, el mòbil el deixa anar.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.intersectionRatio >= 0.45) setStarted(true);
        if (!entry.isIntersecting) setTouchActive(false);
      },
      { threshold: [0, 0.45] },
    );
    observer.observe(el);
    const onFs = () => setFullscreen(document.fullscreenElement === shell.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, []);

  // Roda sobre la maqueta: només amb Ctrl/⌘ (o el pessic del trackpad). La roda sola fa scroll de la pàgina.
  useEffect(() => {
    const el = frame.current;
    if (!el || !is3d || fullscreen) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      viewer.current?.zoomBy(Math.exp(-e.deltaY * 0.01));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [is3d, fullscreen]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "+" || e.key === "=") viewer.current?.zoomBy(1.5);
    else if (e.key === "-") viewer.current?.zoomBy(1 / 1.5);
    else if (e.key === "ArrowLeft") viewer.current?.rotateBy(-Math.PI / 8);
    else if (e.key === "ArrowRight") viewer.current?.rotateBy(Math.PI / 8);
    else return;
    e.preventDefault();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void shell.current?.requestFullscreen?.();
  };

  const kindLabel = (k: string) => t(`kinds.${k as Kind}`);
  const needsTap = is3d && coarse && !touchActive && !fullscreen;

  return (
    <div className="mt-10">
      {/* Filtres */}
      <div role="group" aria-label={t("filters")} className="flex flex-wrap gap-2">
        {(["all", ...kinds] as const).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-base font-bold text-on-dark ring-1 ring-on-dark/25 transition hover:bg-white/20 aria-pressed:bg-paper aria-pressed:text-ink"
          >
            {k !== "all" && <span aria-hidden="true" className="size-3 rounded-full ring-1 ring-white/70" style={{ background: KIND_COLOR[k] }} />}
            {k === "all" ? t("kinds.all") : kindLabel(k)}
          </button>
        ))}
      </div>

      <div ref={shell} className="relative mt-5 overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_100%_at_50%_0%,#56632f_0%,#2c3318_70%)] ring-1 ring-on-dark/20">
        {/* Marc del visor */}
        <div
          ref={frame}
          role="application"
          aria-roledescription={t("viewer")}
          aria-label={t("viewer")}
          aria-describedby="map-hint"
          tabIndex={0}
          onKeyDown={onKeyDown}
          className={`relative w-full outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-terra ${
            fullscreen ? "h-screen" : is3d || mode === "pending" ? "h-[min(68svh,120vw)] max-h-[46rem] min-h-[22rem]" : ""
          }`}
          style={mode === "static" && !fullscreen ? { aspectRatio: `${image.width ?? 3000} / ${image.height ?? 1845}` } : undefined}
        >
          {is3d
            ? near && (
                <MapScene
                  points={visible}
                  selectedId={selectedId}
                  onSelect={select}
                  started={started}
                  reducedMotion={reducedMotion}
                  interactive={!needsTap}
                  zoomEnabled={fullscreen || (coarse && touchActive)}
                  handle={viewer}
                  onReady={onReady}
                />
              )
            : mode === "static" && <MapFlat image={image} points={visible} selectedId={selectedId} onSelect={select} handle={viewer} />}
          {mode !== "static" && !ready && <p className="absolute inset-0 grid place-items-center text-lg font-bold text-on-dark">{t("loading")}</p>}
        </div>

        {needsTap && ready && (
          <button
            type="button"
            onClick={() => setTouchActive(true)}
            className="absolute bottom-16 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-paper px-5 py-3 text-base font-bold text-ink shadow-xl"
          >
            {t("explore")}
          </button>
        )}
        {is3d && coarse && touchActive && !fullscreen && (
          <button
            type="button"
            onClick={() => setTouchActive(false)}
            className="absolute right-3 top-3 z-20 rounded-full bg-paper px-4 py-2 text-base font-bold text-ink shadow-xl"
          >
            {t("done")}
          </button>
        )}

        {/* Controls */}
        <div className="absolute bottom-3 right-3 z-20 flex gap-1.5 sm:flex-col sm:gap-2">
          {is3d && <ControlButton label={t("rotate")} onClick={() => viewer.current?.rotateBy(Math.PI / 4)} icon="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />}
          <ControlButton label={t("zoomIn")} onClick={() => viewer.current?.zoomBy(1.6)} icon="M12 5v14M5 12h14" />
          <ControlButton label={t("zoomOut")} onClick={() => viewer.current?.zoomBy(1 / 1.6)} icon="M5 12h14" />
          <ControlButton
            label={t("reset")}
            onClick={() => {
              setSelectedId(null);
              viewer.current?.reset();
            }}
            icon="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9"
          />
          <ControlButton
            label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
            onClick={toggleFullscreen}
            icon={fullscreen ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"}
          />
        </div>
        <p id="map-hint" className="pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-md rounded-full bg-ink/75 px-4 py-2 text-sm text-paper lg:block">
          {is3d ? t("hint3d") : t("hint")}
        </p>

        {/* Fitxa del lloc triat: a sobre del mapa en pantalles amples, a sota en mòbil */}
        <div aria-live="polite" className="lg:absolute lg:left-4 lg:top-4 lg:z-30 lg:max-h-[calc(100%-5rem)] lg:w-[25rem] lg:overflow-y-auto lg:rounded-[1.5rem] lg:shadow-2xl">
          {selected && (
            <article className="relative bg-paper p-6 text-ink">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label={t("close")}
                title={t("close")}
                className="absolute right-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-paper-2 text-ink transition hover:bg-line"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex items-center gap-3 pr-12">
                <MarkerIcon point={selected} className="size-12 ring-1 ring-line" />
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{kindLabel(selected.kind)}</p>
              </div>
              <h3 className="font-display mt-4 text-4xl leading-[1.05] text-olive">{selected.label}</h3>
              {selectedPlace?.hours && <p className="mt-3 text-lg font-bold">{selectedPlace.hours}</p>}
              {selectedPlace?.image && (
                <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-2xl bg-paper-2">
                  <Image src={selectedPlace.image.src} alt="" fill sizes="25rem" className="object-cover" />
                </div>
              )}
              {selectedPlace?.description && (
                <RichText text={selectedPlace.description} className="mt-4 grid gap-3 text-lg leading-relaxed text-ink [&_strong]:font-bold" />
              )}
              {(selected.target?.type === "category" || selected.target?.type === "accommodation") && (
                <a href="#accommodation" className="mt-5 inline-block text-lg font-bold text-terra hover:underline">
                  {t("seeAccommodation")} →
                </a>
              )}
            </article>
          )}
        </div>
      </div>

      {/* Llegenda: les icones de la il·lustració, fora del mapa perquè es llegeixin bé */}
      <div className="mt-12">
        <h3 className="font-display text-3xl text-on-dark sm:text-4xl">{t("legend")}</h3>
        <p className="mt-2 max-w-2xl text-lg text-on-dark">{t("legendHelp")}</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {legend.map(({ kind, entries }) => (
            <section key={kind} aria-labelledby={`legend-${kind}`} className="rounded-[1.75rem] bg-white/10 p-5 ring-1 ring-on-dark/20 sm:p-6">
              <h4 id={`legend-${kind}`} className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.18em] text-on-dark">
                <span aria-hidden="true" className="size-3 rounded-full ring-1 ring-white/70" style={{ background: KIND_COLOR[kind] }} />
                {kindLabel(kind)}
              </h4>
              <ul className="mt-3 grid gap-1">
                {entries.map((group) => {
                  const first = group[0]!;
                  const active = group.some((p) => p.id === selectedId);
                  return (
                    <li key={first.id}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          // Si n'hi ha més d'un amb el mateix nom, cada clic porta al següent.
                          const i = active ? ((cycle.current.get(first.id) ?? 0) + 1) % group.length : 0;
                          cycle.current.set(first.id, i);
                          reveal(group[i]!);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-lg text-on-dark transition hover:bg-white/15 aria-pressed:bg-paper aria-pressed:text-ink"
                      >
                        <MarkerIcon point={first} className="size-10 ring-2 ring-white/80" />
                        <span className="font-bold leading-snug">{first.label}</span>
                        {group.length > 1 && <span className="ml-auto rounded-full bg-black/25 px-2.5 py-0.5 text-sm font-bold text-white">×{group.length}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlButton({ label, onClick, icon }: { label: string; onClick: () => void; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full bg-paper text-olive shadow-lg transition hover:bg-card sm:size-11"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d={icon} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
