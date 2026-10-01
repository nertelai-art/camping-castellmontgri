"use client";

// El mapa del càmping. Tancat, és el fons de la secció: la maqueta 3D gronxant-se, sense agafar ni el ratolí
// ni el scroll. En clicar-hi s'obre a pantalla completa, com un diàleg: allà sí que es mou amb el ratolí,
// i al costat hi ha el cercador de parcel·les, els filtres i la fitxa de cada lloc.

import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { RichText } from "@/components/rich-text";
import type { MapViewerHandle } from "@/components/scene/MapScene";
import { useNearViewport, useReducedMotion, useRenderMode } from "@/components/scene/scroll-scene";
import { MAP_FOCUS_EVENT, targetKey } from "@/lib/map/events";
import { KIND_COLOR, MAP_KINDS as KINDS, type MapKind as Kind } from "@/lib/map/kinds";
import type { MapPlot } from "@/lib/map/plots";
import type { MapPoint, MapTarget } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { MarkerIcon } from "./map-marker";

const MapScene = dynamic(() => import("@/components/scene/MapScene"), { ssr: false });
const MapFlat = dynamic(() => import("./map-flat"), { ssr: false });

export type Place = { name: string; description: string | null; hours: string | null; image: MediaRef | null };

type Props = { image: MediaRef; points: MapPoint[]; places: Record<string, Place>; heading: ReactNode };

// Els mateixos colors que les teulades de la maqueta (MapScene).
const PLOT_SWATCH = ["#8fa052", "#d8492a", "#f6e6bd"] as const;

export function MapExplorer({ image, points, places, heading }: Props) {
  const t = useTranslations("map");
  const shell = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const viewer = useRef<MapViewerHandle>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const cycle = useRef(new Map<string, number>());
  const mode = useRenderMode();
  const reducedMotion = useReducedMotion();
  const near = useNearViewport(stage, "900px");
  const [open, setOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState<Kind | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plot, setPlot] = useState<MapPlot | null>(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState<string | null>(null);

  const is3d = mode === "3d";
  const visible = useMemo(() => points.filter((p) => filter === "all" || p.kind === filter), [points, filter]);
  const selected = points.find((p) => p.id === selectedId) ?? null;
  const selectedPlace = selected?.target ? places[targetKey(selected.target)] : undefined;
  const kinds = useMemo(() => KINDS.filter((k) => points.some((p) => p.kind === k)), [points]);
  const plotNames = useMemo((): [string, string, string] => [t("plot.pitch"), t("plot.lodging"), t("plot.operator")], [t]);
  // Llista: per tipus, un element per nom (els quatre sanitaris en són un, amb el recompte).
  const groups = useMemo(
    () =>
      kinds
        .filter((kind) => filter === "all" || filter === kind)
        .map((kind) => {
          const byLabel = new Map<string, MapPoint[]>();
          for (const p of points) if (p.kind === kind) byLabel.set(p.label, [...(byLabel.get(p.label) ?? []), p]);
          return { kind, entries: [...byLabel.values()] };
        }),
    [kinds, points, filter],
  );

  /** Porta la càmera a un lloc; si el visor encara no ha carregat, ho fa quan estigui a punt. */
  const flyTo = useCallback((place: { x: number; y: number }) => {
    if (viewer.current) viewer.current.focus(place);
    else pending.current = { x: place.x, y: place.y };
  }, []);

  const onReady = useCallback(() => {
    setReady(true);
    // El visor exposa el seu control un cop muntat: el vol pendent s'aplica al fotograma següent.
    requestAnimationFrame(() => {
      if (pending.current) viewer.current?.focus(pending.current);
      pending.current = null;
    });
  }, []);

  const select = useCallback(
    (p: MapPoint) => {
      setPlot(null);
      setNotFound(null);
      setSelectedId(p.id);
      panel.current?.scrollTo({ top: 0 });
      flyTo(p);
    },
    [flyTo],
  );

  const selectPlot = useCallback(
    (p: MapPlot) => {
      setSelectedId(null);
      setNotFound(null);
      setQuery(p.n);
      setPlot(p);
      panel.current?.scrollTo({ top: 0 });
      flyTo(p);
    },
    [flyTo],
  );

  const openMap = useCallback(() => {
    setStarted(true);
    setOpen(true);
  }, []);

  const closeMap = useCallback(() => {
    setOpen(false);
    setSelectedId(null);
    setPlot(null);
    setNotFound(null);
    setFilter("all");
    viewer.current?.reset();
    opener.current?.focus();
  }, []);

  // «Veure al mapa» des de qualsevol secció: l'obre i hi tria el lloc.
  useEffect(() => {
    const onFocus = (e: Event) => {
      const target = (e as CustomEvent<MapTarget>).detail;
      const point = points.find((p) => p.target && targetKey(p.target) === targetKey(target));
      if (!point) return;
      setFilter("all");
      openMap();
      select(point);
    };
    window.addEventListener(MAP_FOCUS_EVENT, onFocus);
    return () => window.removeEventListener(MAP_FOCUS_EVENT, onFocus);
  }, [points, openMap, select]);

  // L'entrada (la maqueta creix) comença quan el mapa ocupa prou pantalla; fora de pantalla, no es dibuixa.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        setInView(entry.isIntersecting);
        if (entry.intersectionRatio >= 0.35) setStarted(true);
      },
      { threshold: [0, 0.35] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Obert: la pàgina de sota no es mou i el focus entra al diàleg.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    searchInput.current?.focus({ preventScroll: true });
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  // Esc tanca el mapa, sigui on sigui el focus.
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && closeMap();
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open, closeMap]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || e.key !== "Tab") return;
    // El focus no surt del diàleg.
    const focusable = [...shell.current!.querySelectorAll<HTMLElement>("button, a[href], input, [tabindex='0']")].filter((el) => el.offsetParent !== null && !el.closest("[inert]"));
    const first = focusable[0];
    const last = focusable.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  };

  const onStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "+" || e.key === "=") viewer.current?.zoomBy(1.5);
    else if (e.key === "-") viewer.current?.zoomBy(1 / 1.5);
    else if (e.key === "ArrowLeft") viewer.current?.rotateBy(-Math.PI / 8);
    else if (e.key === "ArrowRight") viewer.current?.rotateBy(Math.PI / 8);
    else return;
    e.preventDefault();
  };

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const found = viewer.current?.findPlot(query) ?? null;
    if (found) selectPlot(found);
    else {
      setPlot(null);
      setNotFound(query.trim());
    }
  };

  const kindLabel = (k: string) => t(`kinds.${k as Kind}`);
  const showViewer = near || open;

  return (
    <div
      ref={shell}
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
      aria-label={open ? t("title") : undefined}
      onKeyDown={onKeyDown}
      className={open ? "fixed inset-0 z-[80] flex flex-col bg-[#2c3318] lg:flex-row" : "relative"}
    >
      {open && (
        <aside key="panel" className="flex min-h-0 flex-col bg-paper text-ink max-lg:order-last max-lg:h-[46svh] lg:w-[25rem] lg:shrink-0">
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="font-display text-2xl text-olive">{t("title")}</h2>
            <button type="button" onClick={closeMap} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-base font-bold text-paper transition hover:bg-olive">
              <CloseIcon />
              {t("close")}
            </button>
          </div>

          <div ref={panel} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
            {/* Cercador de parcel·la o allotjament */}
            <form onSubmit={onSearch} role="search" className="rounded-2xl bg-paper-2 p-4">
              <label htmlFor="map-search" className="text-base font-bold">
                {t("search.label")}
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  ref={searchInput}
                  id="map-search"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  enterKeyHint="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="min-w-0 flex-1 rounded-full border border-line bg-card px-4 py-2.5 text-lg font-bold text-ink placeholder:font-normal placeholder:text-muted focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30"
                />
                <button type="submit" className="rounded-full bg-band-terra px-5 py-2.5 text-base font-bold text-on-dark transition hover:brightness-110">
                  {t("search.submit")}
                </button>
              </div>
              <p aria-live="polite" className="mt-2 text-base text-terra empty:hidden">
                {notFound !== null && t("search.notFound", { number: notFound })}
              </p>
            </form>

            {selected ? (
              // Fitxa d'un lloc
              <article className="mt-5">
                <BackButton onClick={() => setSelectedId(null)} label={t("allPlaces")} />
                <div className="mt-4 flex items-center gap-3">
                  <MarkerIcon point={selected} className="size-12 ring-1 ring-line" />
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-muted">{kindLabel(selected.kind)}</p>
                </div>
                <h3 className="font-display mt-3 text-4xl leading-[1.05] text-olive">{selected.label}</h3>
                {selectedPlace?.hours && <p className="mt-3 text-lg font-bold">{selectedPlace.hours}</p>}
                {selectedPlace?.image && (
                  <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-2xl bg-paper-2">
                    <Image src={selectedPlace.image.src} alt="" fill sizes="25rem" className="object-cover" />
                  </div>
                )}
                {selectedPlace?.description && <RichText text={selectedPlace.description} className="mt-4 grid gap-3 text-lg leading-relaxed text-ink [&_strong]:font-bold" />}
                {(selected.target?.type === "category" || selected.target?.type === "accommodation") && (
                  <a href="#accommodation" onClick={closeMap} className="mt-5 inline-block text-lg font-bold text-terra hover:underline">
                    {t("seeAccommodation")} →
                  </a>
                )}
              </article>
            ) : plot ? (
              // Fitxa d'una parcel·la o allotjament numerat
              <article className="mt-5">
                <BackButton onClick={() => setPlot(null)} label={t("allPlaces")} />
                <p className="mt-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted">
                  <span aria-hidden="true" className="size-3.5 rounded-full ring-1 ring-ink/30" style={{ background: PLOT_SWATCH[plot.kind] }} />
                  {plotNames[plot.kind]}
                </p>
                <h3 className="font-display mt-2 text-6xl leading-none text-olive">{plot.n}</h3>
                <p className="mt-4 text-lg leading-relaxed">{t(`plot.about.${plot.kind}`)}</p>
              </article>
            ) : (
              <>
                {/* Filtres */}
                <div role="group" aria-label={t("filters")} className="mt-5 flex flex-wrap gap-2">
                  {(["all", ...kinds] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={filter === k}
                      onClick={() => setFilter(k)}
                      className="flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-base font-bold text-ink transition hover:border-olive aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper"
                    >
                      {k !== "all" && <span aria-hidden="true" className="size-3 rounded-full ring-1 ring-white/70" style={{ background: KIND_COLOR[k] }} />}
                      {k === "all" ? t("kinds.all") : kindLabel(k)}
                    </button>
                  ))}
                </div>

                {/* Llocs, amb la icona de la llegenda del plànol */}
                {groups.map(({ kind, entries }) => (
                  <section key={kind} aria-labelledby={`map-list-${kind}`} className="mt-6">
                    <h3 id={`map-list-${kind}`} className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-muted">
                      <span aria-hidden="true" className="size-3 rounded-full" style={{ background: KIND_COLOR[kind] }} />
                      {kindLabel(kind)}
                    </h3>
                    <ul className="mt-2 grid gap-0.5">
                      {entries.map((group) => {
                        const first = group[0]!;
                        return (
                          <li key={first.id}>
                            <button
                              type="button"
                              onClick={() => {
                                // Si n'hi ha més d'un amb el mateix nom, cada clic porta al següent.
                                const i = ((cycle.current.get(first.id) ?? -1) + 1) % group.length;
                                cycle.current.set(first.id, i);
                                select(group[i]!);
                              }}
                              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-lg transition hover:bg-paper-2"
                            >
                              <MarkerIcon point={first} className="size-10 ring-1 ring-line" />
                              <span className="font-bold leading-snug">{first.label}</span>
                              {group.length > 1 && <span className="ml-auto rounded-full bg-paper-2 px-2.5 py-0.5 text-sm font-bold text-muted">×{group.length}</span>}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}

                {/* Què vol dir cada color de casa */}
                <section className="mt-6 rounded-2xl bg-paper-2 p-4">
                  <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-muted">{t("plot.legend")}</h3>
                  <ul className="mt-2 grid gap-1.5 text-base">
                    {([1, 2, 0] as const).map((kind) => (
                      <li key={kind} className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="size-4 shrink-0 rounded ring-1 ring-ink/30" style={{ background: PLOT_SWATCH[kind] }} />
                        {plotNames[kind]}
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
        </aside>
      )}

      {/* El mapa */}
      <div
        key="stage"
        ref={stage}
        role={open ? "application" : undefined}
        aria-roledescription={open ? t("viewer") : undefined}
        aria-label={open ? t("viewer") : undefined}
        aria-describedby={open ? "map-hint" : undefined}
        tabIndex={open ? 0 : undefined}
        onKeyDown={onStageKeyDown}
        className={`relative bg-[radial-gradient(120%_100%_at_50%_0%,#56632f_0%,#2c3318_70%)] outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-terra ${
          open ? "min-h-0 flex-1" : "h-[min(94svh,62rem)] min-h-[36rem]"
        }`}
      >
        {mode === "static" ? (
          open ? (
            <MapFlat image={image} points={visible} selectedId={selectedId} onSelect={select} selectedPlot={plot} plotNames={plotNames} handle={viewer} />
          ) : (
            <Image src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
          )
        ) : (
          is3d &&
          showViewer && (
            <MapScene
              points={visible}
              selectedId={selectedId}
              onSelect={select}
              selectedPlot={plot}
              onSelectPlot={selectPlot}
              plotNames={plotNames}
              started={started}
              reducedMotion={reducedMotion}
              interactive={open}
              drift={!open && inView}
              handle={viewer}
              onReady={onReady}
            />
          )
        )}
        {open && mode !== "static" && !ready && <p className="absolute inset-0 grid place-items-center text-lg font-bold text-on-dark">{t("loading")}</p>}

        {open ? (
          <>
            <div className="absolute bottom-3 right-3 z-20 flex gap-1.5 sm:flex-col sm:gap-2">
              {is3d && <ControlButton label={t("rotate")} onClick={() => viewer.current?.rotateBy(Math.PI / 4)} icon="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />}
              <ControlButton label={t("zoomIn")} onClick={() => viewer.current?.zoomBy(1.6)} icon="M12 5v14M5 12h14" />
              <ControlButton label={t("zoomOut")} onClick={() => viewer.current?.zoomBy(1 / 1.6)} icon="M5 12h14" />
              <ControlButton label={t("reset")} onClick={() => viewer.current?.reset()} icon="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" />
            </div>
            <p id="map-hint" className="pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-lg rounded-full bg-ink/75 px-4 py-2 text-sm text-paper lg:block">
              {is3d ? t("hint3d") : t("hint")}
            </p>
          </>
        ) : (
          <>
            {/* Tancat: el titular a sobre i tot el mapa és un botó que l'obre */}
            <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-[#2c3318] via-[#2c3318]/75 to-transparent pb-28 pt-20 lg:pt-28">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{heading}</div>
            </div>
            <button ref={opener} type="button" onClick={openMap} className="group absolute inset-0 flex cursor-pointer items-end justify-center pb-10 outline-none">
              <span className="flex items-center gap-3 rounded-full bg-paper px-7 py-4 text-lg font-bold text-ink shadow-2xl ring-1 ring-ink/10 transition group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-terra">
                <svg viewBox="0 0 24 24" className="size-6 text-terra" aria-hidden="true">
                  <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {t("open")}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="text-base font-bold text-terra hover:underline">
      ← {label}
    </button>
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
