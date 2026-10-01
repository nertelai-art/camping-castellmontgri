"use client";

import { startTransition, useActionState } from "react";
import { signIn, type FormState } from "@/app/admin/actions";

const INPUT = "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-lg text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});
  return (
    <form
      // S'envia a mà: amb `action={…}` React buida el formulari després d'un error i caldria tornar a escriure el correu.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      className="grid gap-5"
    >
      <label className="block text-base font-bold">
        Correu electrònic
        <input name="email" type="email" autoComplete="username" required className={INPUT} />
      </label>
      <label className="block text-base font-bold">
        Contrasenya
        <input name="password" type="password" autoComplete="current-password" required className={INPUT} />
      </label>
      <div aria-live="polite">
        {state.errors?.map((error) => (
          <p key={error} className="rounded-xl bg-band-terra px-4 py-3 text-base font-bold text-on-dark">
            {error}
          </p>
        ))}
      </div>
      <button type="submit" disabled={pending} className="rounded-full bg-olive px-6 py-3.5 text-lg font-bold text-paper transition hover:brightness-110 disabled:opacity-60">
        {pending ? "Entrant…" : "Entra"}
      </button>
    </form>
  );
}
