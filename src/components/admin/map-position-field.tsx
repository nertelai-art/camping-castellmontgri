"use client";

// Tria la posició d'un punt clicant (o arrossegant) sobre el mapa. El valor viatja al formulari en dos camps amagats.

import { useState } from "react";
import { nudge, pointerPosition, type Position } from "@/lib/map/position";

type Props = { label: string; help?: string; initial: Position };

export function MapPositionField({ label, help, initial }: Props) {
  const [position, setPosition] = useState(initial);
  const [zoomed, setZoomed] = useState(false);
  const moved = position.x !== initial.x || position.y !== initial.y;

  const place = (event: React.PointerEvent<HTMLDivElement>) => {
    setPosition(pointerPosition(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY));
  };

  return (
    <div>
      <input type="hidden" name="x" value={position.x} />
      <input type="hidden" name="y" value={position.y} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p id="map-position-label" className="text-base font-bold">
          {label}
        </p>
        <button type="button" onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed} className="rounded-full border border-line px-4 py-1.5 text-base font-bold transition hover:border-olive aria-pressed:border-olive aria-pressed:bg-olive aria-pressed:text-paper">
          {zoomed ? "Veure tot el mapa" : "Amplia el mapa"}
        </button>
        {moved && (
          <button type="button" onClick={() => setPosition(initial)} className="text-base font-bold text-terra hover:underline">
            Torna on era
          </button>
        )}
      </div>
      <div className="mt-3 max-h-[70svh] overflow-auto rounded-2xl border border-line">
        <div
          role="slider"
          tabIndex={0}
          aria-labelledby="map-position-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={position.x}
          aria-valuetext={`${position.x} % des de l'esquerra, ${position.y} % des de dalt`}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            place(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) place(event);
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 1 : 0.1;
            const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
            const delta = move[event.key];
            if (!delta) return;
            event.preventDefault();
            setPosition((p) => nudge(p, delta[0], delta[1]));
          }}
          className="relative aspect-[3000/1845] cursor-crosshair touch-none select-none focus:outline-none focus-visible:ring-4 focus-visible:ring-olive/40"
          style={{ width: zoomed ? "250%" : "100%" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- la mateixa il·lustració del visor, sense passar per l'optimitzador */}
          <img src="/map/ground-s.jpg" alt="" draggable={false} className="pointer-events-none absolute inset-0 size-full" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-band-terra shadow-[0_0_0_2px_rgba(0,0,0,.45)]"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          />
        </div>
      </div>
      <span className="mt-1 block text-base font-normal text-muted">
        {help} Posició: {position.x} %, {position.y} %.
      </span>
    </div>
  );
}
