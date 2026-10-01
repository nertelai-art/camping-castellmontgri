"use client";

// Esborrar demana dos clics: el primer només pregunta.

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/admin/actions";

type Props = { action: (state: FormState) => Promise<FormState>; what: string };

export function DeleteButton({ action, what }: Props) {
  const [state, submit, pending] = useActionState<FormState>(action, {});
  const [asking, setAsking] = useState(false);

  return (
    <section aria-label="Esborra" className="mt-10 max-w-3xl border-t border-line pt-6 text-base">
      {asking ? (
        <div className="flex flex-wrap items-center gap-4">
          <p className="font-bold">Segur que vols esborrar {what}? No es pot desfer.</p>
          <button type="button" disabled={pending} onClick={() => startTransition(() => submit())} className="rounded-full bg-band-terra px-5 py-2.5 font-bold text-on-dark transition hover:brightness-110 disabled:opacity-60">
            {pending ? "Esborrant…" : "Sí, esborra-ho"}
          </button>
          <button type="button" disabled={pending} onClick={() => setAsking(false)} className="font-bold text-terra hover:underline">
            No, deixa-ho
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setAsking(true)} className="font-bold text-terra hover:underline">
          Esborra {what}
        </button>
      )}
      <div aria-live="polite">
        {state.errors?.map((error) => (
          <p key={error} className="mt-2 font-bold text-terra">
            {error}
          </p>
        ))}
      </div>
    </section>
  );
}
