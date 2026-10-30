"use client";

// La foto d'un contingut: ensenya la que hi ha, en deixa triar una de nova (reduïda al navegador, `to-jpeg.ts`) i
// deixa marcar-hi el punt que no s'ha de retallar. Al costat es veu com queda en les proporcions que fa servir la web.

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { toJpeg, type Picked } from "./to-jpeg";
import { CENTER, focusPosition } from "@/lib/content/focus";
import { SAVED_EVENT } from "@/lib/admin/visual";
import { nudge, pointerPosition, type Position } from "@/lib/map/position";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  label: string;
  current: { src: string; width: number | null; height: number | null; focus: Position } | null;
};

const sameFocus = (a: Position, b: Position) => a.x === b.x && a.y === b.y;
const CROPS = [
  { name: "Ample", className: "aspect-video" },
  { name: "Mòbil", className: "aspect-[3/4]" },
];

export function ImageField({ action, label, current }: Props) {
  const [state, submit, pending] = useActionState<FormState, FormData>(action, {});
  const [picked, setPicked] = useState<Picked | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [focus, setFocus] = useState<Position>(current?.focus ?? CENTER);
  // L'últim que s'ha enviat: si s'ha desat bé, és el que ja hi ha a la web.
  const [sent, setSent] = useState<{ picked: Picked | null; focus: Position } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.savedAt) window.dispatchEvent(new Event(SAVED_EVENT));
  }, [state.savedAt]);

  // L'adreça temporal de la previsualització s'allibera quan es canvia de foto o se surt de la pàgina.
  useEffect(() => () => void (picked && URL.revokeObjectURL(picked.url)), [picked]);

  const accepted = Boolean(state.savedAt) && !state.errors && !pending;
  const savedFocus = accepted && sent ? sent.focus : (current?.focus ?? CENTER);
  const newPhoto = picked !== null && !(accepted && sent?.picked === picked);
  const dirty = newPhoto || !sameFocus(focus, savedFocus);
  const saved = accepted && !dirty;
  const shown = picked ?? current;
  const src = shown ? ("url" in shown ? shown.url : shown.src) : null;

  const place = (event: React.PointerEvent<HTMLDivElement>) => {
    setFocus(pointerPosition(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY));
  };

  return (
    <section aria-label={label} className="@container mt-8 max-w-3xl rounded-3xl border border-line bg-card p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted">{label}</h2>
      <div className="mt-4 grid gap-5 @xl:grid-cols-[minmax(0,18rem)_1fr] @xl:items-start">
        {src && shown ? (
          <div
            role="slider"
            tabIndex={0}
            aria-label="Punt de la foto que no s'ha de retallar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={focus.x}
            aria-valuetext={`${focus.x} % des de l'esquerra, ${focus.y} % des de dalt`}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId);
              place(event);
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) place(event);
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 5 : 1;
              const move: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
              const delta = move[event.key];
              if (!delta) return;
              event.preventDefault();
              setFocus((p) => nudge(p, delta[0], delta[1]));
            }}
            className="relative cursor-crosshair touch-none select-none overflow-hidden rounded-2xl bg-paper-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-olive/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- previsualització: pot ser una adreça temporal del navegador */}
            <img src={src} alt="" draggable={false} width={shown.width ?? undefined} height={shown.height ?? undefined} className="pointer-events-none block h-auto w-full" />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-band-terra shadow-[0_0_0_2px_rgba(0,0,0,.45)]"
              style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
            />
          </div>
        ) : (
          <p className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-dashed border-line text-base text-muted">Sense foto</p>
        )}
        <div className="grid gap-3 text-base">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label={`Tria una foto nova per a: ${label}`}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              setProblem(null);
              try {
                setPicked(await toJpeg(file));
                setFocus(CENTER);
              } catch {
                setProblem("No s'ha pogut llegir aquesta imatge. Prova amb un JPG o un PNG.");
              }
            }}
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => input.current?.click()} className="rounded-full border border-line px-5 py-2.5 font-bold transition hover:border-olive">
              {current || picked ? "Tria una altra foto" : "Tria una foto"}
            </button>
            {dirty && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const data = new FormData();
                    if (newPhoto && picked) data.set("image", picked.blob, "image.jpg");
                    data.set("focus_x", String(focus.x));
                    data.set("focus_y", String(focus.y));
                    setSent({ picked, focus });
                    startTransition(() => submit(data));
                  }}
                  className="rounded-full bg-band-terra px-5 py-2.5 font-bold text-on-dark transition hover:brightness-110 disabled:opacity-60"
                >
                  {pending ? "Desant…" : "Desa la foto"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (newPhoto) setPicked(null);
                    setFocus(savedFocus);
                  }}
                  className="font-bold text-terra hover:underline"
                >
                  Descarta
                </button>
              </>
            )}
          </div>
          <div aria-live="polite" className="font-bold">
            {newPhoto && !pending && !state.errors && picked && (
              <p className="font-normal text-muted">
                Foto nova a punt ({picked.width} × {picked.height} px, {Math.round(picked.blob.size / 1024)} KB). Encara no s&apos;ha desat.
              </p>
            )}
            {saved && <p className="text-olive">Foto desada. Ja es veu a la web.</p>}
            {problem && <p className="text-terra">{problem}</p>}
            {state.errors?.map((error) => (
              <p key={error} className="text-terra">
                {error}
              </p>
            ))}
          </div>
          {src ? (
            <>
              <p className="text-muted">Clica el més important de la foto, per exemple una cara o la piscina. La web sempre el deixarà a la vista.</p>
              <div className="grid grid-cols-[2fr_1fr] items-end gap-3">
                {CROPS.map((crop) => (
                  <figure key={crop.name} className="min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- previsualització del retall */}
                    <img src={src} alt="" className={`${crop.className} w-full rounded-xl bg-paper-2 object-cover`} style={{ objectPosition: focusPosition(focus) }} />
                    <figcaption className="mt-1 text-sm text-muted">{crop.name}</figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted">Val qualsevol foto: es redueix sola abans de pujar-la. Millor apaïsada.</p>
          )}
        </div>
      </div>
    </section>
  );
}
