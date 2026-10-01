"use client";

// Visor pla del mapa (la il·lustració amb zoom i arrossegament). És el que es veu sense WebGL.

import Image from "next/image";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import type { MapViewerHandle } from "@/components/scene/MapScene";
import { centerOn, clampView, zoomAt, type View } from "@/lib/map/viewport";
import type { MapPoint } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { MapMarker } from "./map-marker";

type Props = { image: MediaRef; points: MapPoint[]; selectedId: string | null; onSelect: (point: MapPoint) => void; handle: Ref<MapViewerHandle> };

export function MapFlat({ image, points, selectedId, onSelect, handle }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ x: 0, y: 0, z: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ moved: boolean; pinch?: number }>({ moved: false });
  const [zoomed, setZoomed] = useState(false);
  const [hiRes, setHiRes] = useState(false);

  // Aplica la vista directament al DOM: canvia a cada píxel d'arrossegament i no ha de re-renderitzar React.
  const apply = useCallback((next: View, animate = false) => {
    const el = layer.current;
    if (!el) return;
    view.current = next;
    el.style.transition = animate && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "transform 600ms cubic-bezier(0.2, 0.7, 0.2, 1)" : "none";
    el.style.transform = `translate3d(${next.x}px, ${next.y}px, 0) scale(${next.z})`;
    el.style.setProperty("--z", String(next.z));
    setZoomed(next.z > 1.01);
    if (next.z > 1.4) setHiRes(true); // la il·lustració sencera (3000 px) només quan cal
  }, []);

  const size = () => {
    const r = frame.current!.getBoundingClientRect();
    return { w: r.width, h: r.height };
  };

  useImperativeHandle(handle, () => ({
    focus: (p) => apply(centerOn(p.x, p.y, Math.max(view.current.z, 2.5), size()), true),
    zoomBy: (factor) => {
      const s = size();
      apply(zoomAt(view.current, factor, s.w / 2, s.h / 2, s), true);
    },
    rotateBy: () => {},
    reset: () => apply({ x: 0, y: 0, z: 1 }, true),
  }));

  // En canviar la mida del marc (girar el mòbil, pantalla completa), la vista es reajusta.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(() => apply(clampView(view.current, size())));
    observer.observe(el);
    return () => observer.disconnect();
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

  return (
    <div
      ref={frame}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={(e) => {
        const r = frame.current!.getBoundingClientRect();
        apply(zoomAt(view.current, 2, e.clientX - r.left, e.clientY - r.top, size()), true);
      }}
      className={`absolute inset-0 select-none overflow-hidden ${zoomed ? "cursor-grab touch-none active:cursor-grabbing" : "touch-pan-y"}`}
    >
      <div ref={layer} className="absolute inset-0 origin-top-left will-change-transform" style={{ ["--z" as string]: 1 } as CSSProperties}>
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1280px) 1200px, 100vw" className="pointer-events-none object-cover" draggable={false} />
        {hiRes && (
          // eslint-disable-next-line @next/next/no-img-element -- l'original sencer, sense passar per l'optimitzador
          <img src={image.src} alt="" aria-hidden="true" draggable={false} className="pointer-events-none absolute inset-0 size-full object-cover" />
        )}
        {points.map((p) => (
          <MapMarker
            key={p.id}
            point={p}
            selected={p.id === selectedId}
            onClick={() => !gesture.current.moved && onSelect(p)}
            className="absolute z-10 origin-bottom -translate-x-1/2 -translate-y-full [scale:calc(0.8/var(--z))] aria-pressed:z-20"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          />
        ))}
      </div>
    </div>
  );
}
