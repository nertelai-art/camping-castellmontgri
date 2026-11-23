"use client";

// Una galeria de fotos (d'un allotjament, d'una secció): afegir-ne (una o unes quantes de cop), treure'n i canviar-ne l'ordre.
// Cada acció es desa a l'instant; no hi ha botó de desar. Si a la web només n'hi caben unes quantes (`max`), no se n'hi poden posar més.

import { useRef, useState, useTransition } from "react";
import type { FormState } from "@/app/admin/actions";
import { toJpeg } from "./to-jpeg";
import { SAVED_EVENT } from "@/lib/admin/visual";

type Props = {
  label: string;
  /** Què fan aquestes fotos a la web. */
  help?: string;
  /** Quantes en caben a la web. */
  max?: number;
  items: { id: string; src: string }[];
  add: (form: FormData) => Promise<FormState>;
  remove: (mediaId: string) => Promise<FormState>;
  move: (mediaId: string, delta: 1 | -1) => Promise<FormState>;
};

const SMALL = "rounded-full border border-line bg-card px-3 py-1 text-sm font-bold transition hover:border-olive disabled:opacity-40";

export function GalleryField({ label, help = "La primera foto és la que surt primer a la fitxa.", max, items, add, remove, move }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const room = max === undefined ? Infinity : Math.max(0, max - items.length);

  const run = (work: () => Promise<FormState>, done: string) =>
    startTransition(async () => {
      const state = await work();
      setMessage(state.errors ? { ok: false, text: state.errors.join(" ") } : { ok: true, text: done });
      window.dispatchEvent(new Event(SAVED_EVENT));
    });

  return (
    <section aria-label={label} className="@container mt-8 max-w-3xl rounded-3xl border border-line bg-card p-6">
      <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-muted">
        {label}
        {max !== undefined && <span className="ml-2 normal-case tracking-normal">· {items.length} de {max}</span>}
      </h2>
      {items.length === 0 && <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-base text-muted">Encara no hi ha cap foto a la galeria.</p>}
      <ol className="mt-4 grid grid-cols-2 gap-3 @xl:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.id} className="rounded-2xl border border-line bg-paper p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniatura del panell */}
            <img src={item.src} alt={`Foto ${index + 1} de ${items.length}`} loading="lazy" className="aspect-[4/3] w-full rounded-xl bg-paper-2 object-cover" />
            {max !== undefined && index >= max && <p className="mt-2 text-sm font-bold text-terra">No surt a la web: no hi cap.</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button type="button" disabled={pending || index === 0} onClick={() => run(() => move(item.id, -1), "Ordre desat.")} aria-label={`Mou la foto ${index + 1} abans`} className={SMALL}>
                ←
              </button>
              <button type="button" disabled={pending || index === items.length - 1} onClick={() => run(() => move(item.id, 1), "Ordre desat.")} aria-label={`Mou la foto ${index + 1} després`} className={SMALL}>
                →
              </button>
              <button type="button" disabled={pending} onClick={() => run(() => remove(item.id), "Foto treta de la galeria.")} aria-label={`Treu la foto ${index + 1}`} className={`${SMALL} ml-auto text-terra`}>
                Treu
              </button>
            </div>
          </li>
        ))}
      </ol>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={`Afegeix fotos a: ${label}`}
        onChange={(event) => {
          const chosen = [...(event.target.files ?? [])];
          event.target.value = "";
          // Les que no hi caben no es pugen: a la web no es veurien.
          const files = chosen.slice(0, room);
          if (!files.length) return;
          const left = chosen.length - files.length;
          run(async () => {
            const errors: string[] = [];
            // D'una en una: cada foto és una petició petita, i si una falla les altres es desen igualment.
            for (const file of files) {
              try {
                const picked = await toJpeg(file);
                URL.revokeObjectURL(picked.url);
                const data = new FormData();
                data.set("image", picked.blob, "image.jpg");
                const state = await add(data);
                if (state.errors) errors.push(`${file.name}: ${state.errors.join(" ")}`);
              } catch {
                errors.push(`${file.name}: no s'ha pogut llegir aquesta imatge.`);
              }
            }
            if (left) errors.push(`${left === 1 ? "Una foto no s'ha afegit" : `${left} fotos no s'han afegit`}: només n'hi caben ${max}.`);
            return errors.length ? { errors } : {};
          }, files.length === 1 ? "Foto afegida." : `${files.length} fotos afegides.`);
        }}
      />
      <div className="mt-4 flex flex-wrap items-center gap-4 text-base">
        {room > 0 ? (
          <button type="button" disabled={pending} onClick={() => input.current?.click()} className="rounded-full border border-line px-5 py-2.5 font-bold transition hover:border-olive disabled:opacity-60">
            {pending ? "Desant…" : room === 1 ? "+ Afegeix una foto" : "+ Afegeix fotos"}
          </button>
        ) : (
          <p className="rounded-2xl bg-paper-2 px-4 py-2.5 text-base">
            Ja hi ha les {max} fotos que caben a la web. Per posar-n&apos;hi una altra, treu-ne una abans.
          </p>
        )}
        <p aria-live="polite" className={`font-bold ${message?.ok ? "text-olive" : "text-terra"}`}>
          {!pending && message?.text}
        </p>
      </div>
      <p className="mt-2 text-base text-muted">{help} Els canvis es desen sols i es veuen a la web de seguida.</p>
    </section>
  );
}
