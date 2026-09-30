"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { RichText } from "@/components/rich-text";
import { MAP_FOCUS_EVENT, targetKey } from "@/lib/map/events";
import { KIND_COLOR, MAP_KINDS as KINDS, type MapKind as Kind } from "@/lib/map/kinds";
import { centerOn, clampView, zoomAt, type View } from "@/lib/map/viewport";
import type { MapPoint, MapTarget } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";

export type Place = { name: string; description: string | null; hours: string | null; image: MediaRef | null };

type Props = { image: MediaRef; points: MapPoint[]; places: Record<string, Place> };

export function MapExplorer({ image, points, places }: Props) {
  const t = useTranslations("map");
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ x: 0, y: 0, z: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; pinch?: number }>({ moved: false });
  const [zoomed, setZoomed] = useState(false);
  const [hiRes, setHiRes] = useState(false);
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const visible = useMemo(() => points.filter((p) => filter === "all" || p.kind === filter), [points, filter]);
  const selected = points.find((p) => p.id === selectedId) ?? null;
  const selectedPlace = selected?.target ? places[targetKey(selected.target)] : undefined;
  const kinds = useMemo(() => KINDS.filter((k) => points.some((p) => p.kind === k)), [points]);

  // Aplica la vista directament al DOM: canvia a cada píxel d'arrossegament i no ha de re-renderitzar React.
  const apply = useCallback((next: View, animate = false) => {
    const el = layer.current;
    if (!el) return;
    view.current = next;
    el.style.transition = animate ? "transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1)" : "none";
    el.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.z})`;
    el.style.setProperty("--z", String(next.z));
    const isZoomed = next.z > 1.01;
    setZoomed(isZoomed);
    if (next.z > 1.4) setHiRes(true); // la il·lustració sencera (3000 px) només quan cal
  }, []);

  const size = () => {
    const r = frame.current!.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };

  const zoomBy = (factor: number) => {
    const s = size();
    apply(zoomAt(view.current, factor, s.w / 2, s.h / 2, s), true);
  };

  const focus = useCallback(
    (p: MapPoint) => {
      setSelectedId(p.id);
      apply(centerOn(p.x, p.y, Math.max(view.current.z, 2.5), size()), !matchMedia("(prefers-reduced-motion: reduce)").matches);
    },
    [apply],
  );

  // «Veure al plànol» des de qualsevol secció de la pàgina.
  useEffect(() => {
    const onFocus = (e: Event) => {
      const target = (e as CustomEvent<MapTarget>).detail;
      const point = points.find((p) => p.target && targetKey(p.target) === targetKey(target));
      if (!point) return;
      setFilter("all");
      frame.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      focus(point);
    };
    window.addEventListener(MAP_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(MAP_FOCUS_EVENT, onFocus);
  }, [points, focus]);

  // En canviar la mida del marc (girar el mòbil, pantalla completa), la vista es reajusta.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(() => apply(clampView(view.current, size())));
    observer.observe(el);
    const onFs = () => setFullscreen(document.fullscreenElement === el.parentElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      observer.disconnect();
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [apply]);

  // Roda: només amb Ctrl/⌘ (o el pessic del trackpad, que arriba així). La roda sola fa scroll de la pàgina.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      apply(zoomAt(view.current, Math.exp(-e.deltaY * 0.004), e.clientX - r.left, e.clientY - r.top, size()));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply]);

  const onPointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { moved: false };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    const s = size();
    if (pointers.current.size === 2 && gesture.current.pinch) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = frame.current!.getBoundingClientRect();
      apply(zoomAt(view.current, dist / gesture.current.pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, s));
      gesture.current.pinch = dist;
      gesture.current.moved = true;
      return;
    }
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) gesture.current.moved = true;
    if (!gesture.current.moved || view.current.z <= 1.01) return;
    if (!frame.current!.hasPointerCapture(e.pointerId)) frame.current!.setPointerCapture(e.pointerId);
    apply(clampView({ ...view.current, x: view.current.x + dx, y: view.current.y + dy }, s));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current.pinch = undefined;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = 60;
    const s = size();
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key] && view.current.z > 1.01) {
      e.preventDefault();
      const [dx, dy] = moves[e.key]!;
      apply(clampView({ ...view.current, x: view.current.x + dx, y: view.current.y + dy }, s), true);
    } else if (e.key === "+" || e.key === "=") zoomBy(1.5);
    else if (e.key === "-") zoomBy(1 / 1.5);
  };

  const toggleFullscreen = () => {
    const el = frame.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  const kindLabel = (k: string) => t(`kinds.${k as Kind}`);

  return (
    <div className="mt-12 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className={`relative overflow-hidden rounded-[2rem] bg-band-olive ring-1 ring-on-dark/20 ${fullscreen ? "flex items-center" : ""}`}>
        {/* Filtres */}
        <div role="group" aria-label={t("filters")} className="snap-strip absolute inset-x-3 top-3 z-20 gap-2 pb-1">
          {(["all", ...kinds] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-paper/95 px-3.5 py-1.5 text-sm font-bold text-ink shadow transition aria-pressed:bg-ink aria-pressed:text-paper"
            >
              {k !== "all" && <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: KIND_COLOR[k] }} />}
              {k === "all" ? t("kinds.all") : kindLabel(k)}
            </button>
          ))}
        </div>

        {/* Marc del visor */}
        <div
          ref={frame}
          role="application"
          aria-roledescription={t("viewer")}
          aria-label={t("viewer")}
          aria-describedby="map-hint"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => {
            const r = frame.current!.getBoundingClientRect();
            apply(zoomAt(view.current, 2, e.clientX - r.left, e.clientY - r.top, size()), true);
          }}
          onKeyDown={onKeyDown}
          className={`relative w-full select-none overflow-hidden outline-none focus-visible:ring-4 focus-visible:ring-terra ${
            zoomed ? "cursor-grab touch-none active:cursor-grabbing" : "touch-pan-y"
          }`}
          style={{ aspectRatio: `${image.width ?? 3000} / ${image.height ?? 1845}` }}
        >
          <div ref={layer} className="absolute inset-0 origin-top-left will-change-transform" style={{ ["--z" as string]: 1 } as CSSProperties}>
            <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1280px) 860px, 100vw" className="pointer-events-none object-cover" draggable={false} />
            {hiRes && (
              // eslint-disable-next-line @next/next/no-img-element -- l'original sencer, sense passar per l'optimitzador
              <img src={image.src} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover" />
            )}
            {visible.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => !gesture.current.moved && focus(p)}
                aria-label={p.label}
                aria-pressed={p.id === selectedId}
                className="group absolute z-10 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center [scale:calc(1/var(--z))]"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                <span
                  className="block size-4 rounded-full border-[3px] border-paper shadow-[0_2px_8px_rgb(0_0_0/.45)] transition group-hover:scale-125 group-aria-pressed:scale-150 sm:size-5"
                  style={{ background: KIND_COLOR[p.kind as Kind] ?? "var(--ink)" }}
                />
                <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink/90 px-2 py-1 text-xs font-bold text-paper group-hover:block group-focus-visible:block group-aria-pressed:block">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 right-2 z-20 flex gap-1.5 sm:bottom-3 sm:right-3 sm:flex-col sm:gap-2">
          <ControlButton label={t("zoomIn")} onClick={() => zoomBy(1.6)} icon="M12 5v14M5 12h14" />
          <ControlButton label={t("zoomOut")} onClick={() => zoomBy(1 / 1.6)} icon="M5 12h14" />
          <ControlButton
            label={t("reset")}
            onClick={() => {
              setSelectedId(null);
              apply({ x: 0, y: 0, z: 1 }, true);
            }}
            icon="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"
          />
          <ControlButton
            label={fullscreen ? t("exitFullscreen") : t("fullscreen")}
            onClick={toggleFullscreen}
            icon={fullscreen ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"}
          />
        </div>
        <p id="map-hint" className="pointer-events-none absolute bottom-3 left-3 z-20 hidden max-w-xs rounded-full bg-ink/75 px-3 py-1.5 text-xs text-paper sm:block">
          {t("hint")}
        </p>
      </div>

      {/* Fitxa o llista de llocs */}
      <aside aria-live="polite" className="rounded-[2rem] bg-paper p-5 text-ink max-lg:max-h-[28rem] max-lg:overflow-y-auto lg:max-h-[32rem] lg:overflow-y-auto">
        {selected ? (
          <div>
            <button type="button" onClick={() => setSelectedId(null)} className="text-sm font-bold text-terra hover:underline">
              ← {t("back")}
            </button>
            {selectedPlace?.image && (
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-paper-2">
                <Image src={selectedPlace.image.src} alt="" fill sizes="22rem" className="object-cover" />
              </div>
            )}
            <p className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-muted">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: KIND_COLOR[selected.kind as Kind] }} />
              {kindLabel(selected.kind)}
            </p>
            <h3 className="font-display mt-1 text-3xl leading-tight text-olive">{selected.label}</h3>
            {selectedPlace?.hours && <p className="mt-2 text-sm font-bold">{selectedPlace.hours}</p>}
            {selectedPlace?.description && (
              <RichText text={selectedPlace.description} className="mt-3 grid gap-3 text-sm leading-relaxed text-muted [&_strong]:text-ink" />
            )}
            {(selected.target?.type === "category" || selected.target?.type === "accommodation") && (
              <a href="#accommodation" className="mt-4 inline-block font-bold text-terra hover:underline">
                {t("seeAccommodation")} →
              </a>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
              {t("places", { count: visible.length })}
            </h3>
            <ul className="mt-3 grid gap-1">
              {visible.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => focus(p)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-paper-2">
                    <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[p.kind as Kind] }} />
                    <span className="font-bold">{p.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
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
      className="grid size-9 place-items-center rounded-full bg-paper text-olive shadow-lg transition hover:bg-card sm:size-11"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d={icon} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
