"use client";

// La foto d'un contingut: ensenya la que hi ha i en deixa triar una de nova (reduïda al navegador, `to-jpeg.ts`).

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { toJpeg, type Picked } from "./to-jpeg";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  label: string;
  current: { src: string; width: number | null; height: number | null } | null;
};

export function ImageField({ action, label, current }: Props) {
  const [state, submit, pending] = useActionState<FormState, FormData>(action, {});
  const [picked, setPicked] = useState<Picked | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // L'adreça temporal de la previsualització s'allibera quan es canvia de foto o se surt de la pàgina.
  useEffect(() => () => void (picked && URL.revokeObjectURL(picked.url)), [picked]);

  const saved = Boolean(state.savedAt) && !state.errors && !pending;
  const shown = picked ?? current;

  return (
    <section aria-label={label} className="mt-8 max-w-3xl rounded-3xl border border-line bg-card p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted">{label}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,18rem)_1fr] sm:items-start">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element -- previsualització: pot ser una adreça temporal del navegador
          <img src={"url" in shown ? shown.url : shown.src} alt="" width={shown.width ?? undefined} height={shown.height ?? undefined} className="aspect-[4/3] w-full rounded-2xl bg-paper-2 object-cover" />
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
              } catch {
                setProblem("No s'ha pogut llegir aquesta imatge. Prova amb un JPG o un PNG.");
              }
            }}
          />
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => input.current?.click()} className="rounded-full border border-line px-5 py-2.5 font-bold transition hover:border-olive">
              {current || picked ? "Tria una altra foto" : "Tria una foto"}
            </button>
            {picked && !saved && (
              <>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const data = new FormData();
                    data.set("image", picked.blob, "image.jpg");
                    startTransition(() => submit(data));
                  }}
                  className="rounded-full bg-band-terra px-5 py-2.5 font-bold text-on-dark transition hover:brightness-110 disabled:opacity-60"
                >
                  {pending ? "Pujant…" : "Desa la foto"}
                </button>
                <button type="button" disabled={pending} onClick={() => setPicked(null)} className="font-bold text-terra hover:underline">
                  Descarta
                </button>
              </>
            )}
          </div>
          <div aria-live="polite" className="font-bold">
            {picked && !saved && !pending && !state.errors && (
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
          <p className="text-muted">Val qualsevol foto: es redueix sola abans de pujar-la. Millor apaïsada.</p>
        </div>
      </div>
    </section>
  );
}
