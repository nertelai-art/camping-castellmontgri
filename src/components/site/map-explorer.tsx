"use client";

// El mapa del càmping. Tancat, és el fons de la secció: la maqueta 3D gronxant-se, sense agafar ni el ratolí
// ni el scroll. En clicar-hi s'obre a pantalla completa, com un diàleg: allà sí que es mou amb el ratolí,
// i al costat hi ha el cercador de parcel·les i els llocs, agrupats en desplegables.

import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { RichText } from "@/components/rich-text";
import type { MapViewerHandle } from "@/components/scene/MapScene";
import { WebGLBoundary } from "@/components/scene/webgl-boundary";
import { useInteracted, useNearViewport, useReducedMotion, useRenderMode } from "@/components/scene/scroll-scene";
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
const CLOSE_MS = 280; // el que dura l'animació de tancar (globals.css)

/** Ordre d'entrada de cada peça de la columna quan s'obre el mapa (`.map-rise`). */
const rise = (i: number) => ({ ["--i" as string]: i }) as CSSProperties;

export function MapExplorer({ image, points, places, heading }: Props) {
  const t = useTranslations("map");
  const shell = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const viewer = useRef<MapViewerHandle>(null);
  const pending = useRef<{ x: number; y: number } | null>(null);
  const cycle = useRef(new Map<string, number>());
  const reducedMotion = useReducedMotion();
  const near = useNearViewport(stage, "900px");
  const interacted = useInteracted();
  const [open, setOpen] = useState(false);
  // three.js no es carrega fins que qui visita fa alguna cosa (i el mapa és a prop): la càrrega inicial queda lliure.
  const showViewer = (near && interacted) || open;
  const [failed, setFailed] = useState(false);
  const webgl = useRenderMode();
  const mode = failed ? "static" : webgl;
  const [closing, setClosing] = useState(false);
  const [inView, setInView] = useState(false);
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  // El desplegable obert fa de filtre: al mapa només es veuen els llocs d'aquell tipus. Cap d'obert: tots.
  const [openKind, setOpenKind] = useState<Kind | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plot, setPlot] = useState<MapPlot | null>(null);
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState<string | null>(null);
  const [lodgingHint, setLodgingHint] = useState(false);

  const is3d = mode === "3d";
  const visible = useMemo(() => points.filter((p) => openKind === null || p.kind === openKind), [points, openKind]);
  const selected = points.find((p) => p.id === selectedId) ?? null;
  const selectedPlace = selected?.target ? places[targetKey(selected.target)] : undefined;
  /**
   * Tanca la fitxa del lloc triat. Al mòbil, a més, es torna al punt de partida: la càmera a la vista general i tots
   * els llocs al mapa (tocar un marcador n'havia deixat només els del seu tipus). De prop, sense fitxa i amb la llista
   * amagada, no se sap on s'és.
   */
  const closeCard = useCallback(() => {
    setSelectedId(null);
    if (!window.matchMedia("(max-width: 1023px)").matches) return;
    setOpenKind(null);
    viewer.current?.reset();
  }, []);

  // Per a l'escoltador d'Esc, que viu més que un render: tanca la fitxa oberta, si n'hi ha, i diu si n'hi havia.
  const dismissCard = useRef<() => boolean>(() => false);
  useEffect(() => {
    dismissCard.current = () => {
      if (!selectedId) return false;
      closeCard();
      return true;
    };
  }, [selectedId, closeCard]);
  const plotNames = useMemo((): [string, string, string] => [t("plot.pitch"), t("plot.lodging"), t("plot.operator")], [t]);
  // Per tipus, un element per nom (els quatre sanitaris en són un, amb el recompte).
  const groups = useMemo(
    () =>
      KINDS.filter((k) => points.some((p) => p.kind === k)).map((kind) => {
        const byLabel = new Map<string, MapPoint[]>();
        for (const p of points) if (p.kind === kind) byLabel.set(p.label, [...(byLabel.get(p.label) ?? []), p]);
        return { kind, entries: [...byLabel.values()] };
      }),
    [points],
  );

  // Un cop qui visita ha fet alguna cosa, i quan el navegador no té feina, es van baixant la maqueta (three.js)
  // i el seu terra: en arribar a la secció ja hi són i el mapa surt de seguida, també amb una connexió lenta.
  useEffect(() => {
    if (!interacted || !is3d) return;
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return;
    const warm = () => {
      void import("@/components/scene/MapScene");
      const small = Math.min(window.innerWidth, window.innerHeight) < 700;
      void fetch(small ? "/map/ground-s.jpg" : "/map/ground.jpg", { priority: "low" }).catch(() => {});
    };
    if (!("requestIdleCallback" in window)) {
      const timer = setTimeout(warm, 1500);
      return () => clearTimeout(timer);
    }
    const idle = requestIdleCallback(warm, { timeout: 4000 });
    return () => cancelIdleCallback(idle);
  }, [interacted, is3d]);

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

  /** Tria un lloc (des del mapa o des de la llista): s'obre el seu desplegable i la seva fitxa, i el mapa hi va. */
  const select = useCallback(
    (p: MapPoint) => {
      setPlot(null);
      setNotFound(null);
      setOpenKind(p.kind as Kind);
      setSelectedId(p.id);
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
    // D'on surt el mapa: el rectangle que ocupa ara la secció, perquè l'obertura comenci des d'allà.
    const r = stage.current?.getBoundingClientRect();
    if (r && shell.current) {
      shell.current.style.setProperty("--from-top", `${Math.max(0, r.top)}px`);
      shell.current.style.setProperty("--from-bottom", `${Math.max(0, window.innerHeight - r.bottom)}px`);
    }
    // Obrir el mapa munta tota la columna i fa créixer el canvas (un fotograma de WebGL a pantalla completa): feina
    // llarga. Es deixa per a després que el navegador hagi pintat la resposta al clic, i com a transició, perquè la
    // interacció no s'hi esperi (l'INP d'aquest botó passava de 280 ms).
    requestAnimationFrame(() =>
      setTimeout(() =>
        startTransition(() => {
          setStarted(true);
          setClosing(false);
          setOpen(true);
        }),
      ),
    );
  }, []);

  const closeMap = useCallback(() => {
    const finish = () => {
      setOpen(false);
      setClosing(false);
      setSelectedId(null);
      setPlot(null);
      setNotFound(null);
      setOpenKind(null);
      setLodgingHint(false);
      viewer.current?.reset();
      opener.current?.focus({ preventScroll: true });
    };
    if (reducedMotion) return finish();
    setClosing(true);
    window.setTimeout(finish, CLOSE_MS);
  }, [reducedMotion]);

  // «Veure al mapa» des de qualsevol secció: l'obre i hi tria el lloc.
  useEffect(() => {
    const onFocus = (e: Event) => {
      const target = (e as CustomEvent<MapTarget>).detail;
      const point = points.find((p) => p.target && targetKey(p.target) === targetKey(target));
      openMap();
      if (point) return select(point);
      // Un model d'allotjament no té un lloc únic: s'ensenya tot el mapa i s'explica quines cases són les del càmping.
      setSelectedId(null);
      setPlot(null);
      setOpenKind(null);
      setLodgingHint(true);
      viewer.current?.reset();
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

  // Obert: la pàgina de sota no es mou, el focus entra al diàleg i Esc el tanca sigui on sigui el focus.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    // Amb el dit, enfocar el cercador faria saltar el teclat i taparia mig mapa: el focus va al botó de sortir.
    if (window.matchMedia("(pointer: coarse)").matches) back.current?.focus({ preventScroll: true });
    else searchInput.current?.focus({ preventScroll: true });
    // Esc tanca primer la fitxa oberta; si no n'hi ha, el mapa.
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!dismissCard.current()) closeMap();
    };
    document.addEventListener("keydown", onEscape);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, closeMap]);

  // El lloc triat queda a la vista dins la columna (pot haver-se triat clicant al mapa).
  useEffect(() => {
    if (!selectedId) return;
    const frame = requestAnimationFrame(() => document.getElementById(`map-item-${selectedId}`)?.scrollIntoView({ block: "nearest", behavior: reducedMotion ? "auto" : "smooth" }));
    return () => cancelAnimationFrame(frame);
  }, [selectedId, reducedMotion]);

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

  return (
    <div
      ref={shell}
      role={open ? "dialog" : undefined}
      aria-modal={open ? true : undefined}
      aria-label={open ? t("title") : undefined}
      data-closing={closing || undefined}
      onKeyDown={onKeyDown}
      className={open ? "map-shell fixed inset-0 z-[80] flex flex-col bg-[#2c3318] lg:flex-row" : "relative"}
    >
      {open && (
        <aside
          key="panel"
          // Al mòbil, amb una fitxa oberta sobre el mapa, la columna es plega: el mapa necessita l'alçada.
          className={`map-panel flex min-h-0 flex-col bg-paper text-ink max-lg:order-last lg:w-[25rem] lg:shrink-0 ${selected && is3d ? "max-lg:h-auto" : "max-lg:h-[46svh]"}`}
        >
          <div className="map-rise flex items-center justify-between gap-3 border-b border-line px-5 py-4" style={rise(0)}>
            <h2 className="font-display text-2xl text-olive">{t("title")}</h2>
            <button type="button" onClick={closeMap} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-base font-bold text-paper transition hover:bg-olive">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
              {t("close")}
            </button>
          </div>

          <div ref={panel} className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 ${selected && is3d ? "max-lg:hidden" : ""}`}>
            {/* Cercador de parcel·la o allotjament */}
            <form onSubmit={onSearch} role="search" className="map-rise rounded-2xl bg-paper-2 p-4" style={rise(1)}>
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
              {plot && (
                <div className="mt-3 rounded-xl bg-card p-4">
                  <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted">
                    <span aria-hidden="true" className="size-3.5 rounded-full ring-1 ring-ink/30" style={{ background: PLOT_SWATCH[plot.kind] }} />
                    {plotNames[plot.kind]}
                  </p>
                  <p className="font-display mt-1 text-5xl leading-none text-olive">{plot.n}</p>
                  <p className="mt-3 text-base leading-relaxed">{t(`plot.about.${plot.kind}`)}</p>
                </div>
              )}
            </form>

            {lodgingHint && (
              <p className="map-rise mt-4 flex gap-3 rounded-2xl bg-band-terra p-4 text-base leading-relaxed text-on-dark" style={rise(2)}>
                <span aria-hidden="true" className="mt-1 size-4 shrink-0 rounded ring-2 ring-on-dark/70" style={{ background: PLOT_SWATCH[1] }} />
                {t("lodgingHint")}
              </p>
            )}

            {/* Llocs: un desplegable per tipus. El que és obert és el que es veu al mapa. */}
            <div className="mt-4 grid gap-2">
              {groups.map(({ kind, entries }, g) => {
                const expanded = openKind === kind;
                return (
                  <section key={kind} className="map-rise overflow-hidden rounded-2xl border border-line" style={rise(g + 2)}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={`map-group-${kind}`}
                        onClick={() => {
                          setOpenKind(expanded ? null : kind);
                          if (selected && selected.kind !== kind) setSelectedId(null);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-lg font-bold transition hover:bg-paper-2 aria-expanded:bg-paper-2"
                      >
                        <span aria-hidden="true" className="size-3.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[kind] }} />
                        {kindLabel(kind)}
                        <span className="ml-auto text-base font-normal text-muted">{entries.length}</span>
                        <svg viewBox="0 0 24 24" className={`size-5 shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true">
                          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </h3>
                    {/* grid-rows 0fr → 1fr: s'obre amb transició sense haver de saber l'alçada */}
                    <div id={`map-group-${kind}`} className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`} inert={!expanded}>
                      <ul className="min-h-0 overflow-hidden">
                        {entries.map((group) => {
                          const first = group[0]!;
                          const current = group.find((p) => p.id === selectedId);
                          const place = current?.target ? places[targetKey(current.target)] : undefined;
                          return (
                            <li key={first.id} id={current ? `map-item-${current.id}` : undefined} className="border-t border-line">
                              <button
                                type="button"
                                aria-expanded={Boolean(current)}
                                onClick={() => {
                                  // Si n'hi ha més d'un amb el mateix nom, cada clic porta al següent; l'únic, es plega.
                                  if (current && group.length === 1) return setSelectedId(null);
                                  const i = ((cycle.current.get(first.id) ?? -1) + 1) % group.length;
                                  cycle.current.set(first.id, i);
                                  select(group[i]!);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-lg transition hover:bg-paper-2 aria-expanded:bg-card"
                              >
                                <MarkerIcon point={first} className="size-10 ring-1 ring-line" />
                                <span className="font-bold leading-snug">{first.label}</span>
                                {group.length > 1 && <span className="ml-auto rounded-full bg-paper-2 px-2.5 py-0.5 text-sm font-bold text-muted">×{group.length}</span>}
                              </button>
                              {current && !is3d && (
                                // Sense maqueta 3D, la fitxa del lloc triat va a sota mateix del seu nom (a la maqueta surt del marcador)
                                <div className="map-detail bg-card px-4 pb-5">
                                  {place?.image && (
                                    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-paper-2">
                                      <Image src={place.image.src} alt={place.image.alt} fill sizes="23rem" className="object-cover" />
                                    </div>
                                  )}
                                  {place?.hours && <p className="mt-3 text-lg font-bold">{place.hours}</p>}
                                  {place?.description ? (
                                    <RichText text={place.description} className="mt-3 grid gap-3 text-lg leading-relaxed text-ink [&_strong]:font-bold" />
                                  ) : (
                                    <p className="mt-1 text-base text-muted">{t("onMapOnly")}</p>
                                  )}
                                  {(current.target?.type === "category" || current.target?.type === "accommodation") && (
                                    <a href="#accommodation" onClick={closeMap} className="mt-4 inline-block text-lg font-bold text-terra hover:underline">
                                      {t("seeAccommodation")} →
                                    </a>
                                  )}
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </section>
                );
              })}
            </div>

            {/* Què vol dir cada color de casa */}
            <section className="map-rise mt-4 rounded-2xl bg-paper-2 p-4" style={rise(groups.length + 2)}>
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
          open ? "min-h-0 min-w-0 flex-1" : "h-[min(94svh,62rem)] min-h-[36rem]"
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
            <WebGLBoundary onFail={() => setFailed(true)}>
              <MapScene
                points={visible}
                selectedId={selectedId}
                onSelect={select}
                selectedPlot={plot}
                onSelectPlot={selectPlot}
                plotNames={plotNames}
                started={started}
                reducedMotion={reducedMotion}
                interactive={open && !closing}
                drift={!open && inView}
                handle={viewer}
                onReady={onReady}
                popover={popover}
              />
            </WebGLBoundary>
          )
        )}
        {/* Fins que la maqueta és a punt, el plànol dibuixat fa de fons (i després s'esvaeix). */}
        {mode !== "static" && (
          <Image
            src={image.src}
            alt=""
            fill
            sizes="100vw"
            className={`pointer-events-none object-cover transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-60"}`}
          />
        )}
        {open && mode !== "static" && !ready && <p className="absolute inset-0 grid place-items-center text-lg font-bold text-on-dark">{t("loading")}</p>}

        {open ? (
          <>
            <button
              ref={back}
              type="button"
              onClick={closeMap}
              aria-label={t("back")}
              title={t("back")}
              className="map-fade absolute left-3 top-3 z-20 grid size-12 place-items-center rounded-full bg-paper text-ink shadow-lg ring-1 ring-ink/10 transition hover:bg-card focus-visible:ring-4 focus-visible:ring-terra"
            >
              <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {/* La fitxa del lloc triat: la maqueta la posa al costat del seu marcador a cada fotograma. */}
            {is3d && (
              <div ref={popover} className="group/pop pointer-events-none absolute left-0 top-0 z-30" style={{ visibility: "hidden" }}>
                {selected && (
                  <div
                    key={selected.id}
                    role="dialog"
                    aria-label={selected.label}
                    className="map-pop pointer-events-auto relative w-[min(20rem,calc(100vw-1.25rem))] rounded-3xl bg-paper text-ink shadow-[0_24px_50px_-12px_rgb(0_0_0/.6)] ring-1 ring-ink/10"
                  >
                    <span aria-hidden="true" className="absolute -bottom-2 left-[var(--tail)] size-4 -translate-x-1/2 rotate-45 bg-paper group-data-[below=true]/pop:-top-2 group-data-[below=true]/pop:bottom-auto" />
                    <button
                      type="button"
                      onClick={closeCard}
                      aria-label={t("closeCard")}
                      className="absolute right-2.5 top-2.5 z-10 grid size-10 place-items-center rounded-full bg-ink text-paper shadow-lg transition hover:bg-olive focus-visible:ring-4 focus-visible:ring-terra"
                    >
                      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
                      </svg>
                    </button>
                    <div className="relative overflow-hidden rounded-3xl">
                      {selectedPlace?.image && (
                        <div className="relative aspect-[2/1] bg-paper-2">
                          <Image src={selectedPlace.image.src} alt={selectedPlace.image.alt} fill sizes="20rem" className="object-cover" />
                        </div>
                      )}
                      <div className="max-h-[min(13rem,28svh)] overflow-y-auto overscroll-contain px-5 pb-5 pt-4">
                        <h3 className={`font-display text-2xl leading-tight text-olive ${selectedPlace?.image ? "" : "pr-11"}`}>{selected.label}</h3>
                        {selectedPlace?.hours && <p className="mt-1.5 text-base font-bold">{selectedPlace.hours}</p>}
                        {selectedPlace?.description ? (
                          <RichText text={selectedPlace.description} className="mt-2 grid gap-2.5 text-base leading-relaxed [&_strong]:font-bold" />
                        ) : (
                          <p className="mt-1.5 text-base text-muted">{t("onMapOnly")}</p>
                        )}
                        {(selected.target?.type === "category" || selected.target?.type === "accommodation") && (
                          <a href="#accommodation" onClick={closeMap} className="mt-3 inline-block text-base font-bold text-terra hover:underline">
                            {t("seeAccommodation")} →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="map-fade absolute bottom-3 right-3 z-20 flex gap-1.5 sm:flex-col sm:gap-2">
              {is3d && <ControlButton label={t("rotate")} onClick={() => viewer.current?.rotateBy(Math.PI / 4)} icon="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />}
              <ControlButton label={t("zoomIn")} onClick={() => viewer.current?.zoomBy(1.6)} icon="M12 5v14M5 12h14" />
              <ControlButton label={t("zoomOut")} onClick={() => viewer.current?.zoomBy(1 / 1.6)} icon="M5 12h14" />
              <ControlButton label={t("reset")} onClick={() => viewer.current?.reset()} icon="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" />
            </div>
            <p id="map-hint" className="map-fade pointer-events-none absolute bottom-3 left-3 z-10 hidden max-w-lg rounded-full bg-ink/75 px-4 py-2 text-sm text-paper lg:block">
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
