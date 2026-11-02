"use client";

// El programa setmanal: un bloc per dia. Cada acció es desa a l'instant i la pàgina es refresca sola (`revalidatePath`).

import { startTransition, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addSessionAction, copyPreviousWeekAction, removeSessionAction, type FormState } from "@/app/admin/actions";
import type { AdminSession } from "@/lib/supabase/admin-content";

const INPUT = "mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30";

function Errors({ errors }: { errors?: string[] }) {
  return (
    <div aria-live="polite" className="font-bold text-terra">
      {errors?.map((error) => (
        <p key={error} className="mt-2">
          {error}
        </p>
      ))}
    </div>
  );
}

export function ProgrammeWeekCopy({ monday }: { monday: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({});
  return (
    <div className="mt-6 max-w-4xl">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setState(await copyPreviousWeekAction(monday)))}
        className="rounded-full bg-olive px-5 py-2.5 text-base font-bold text-paper transition hover:brightness-110 disabled:opacity-60"
      >
        {pending ? "Copiant…" : "Copia la setmana anterior"}
      </button>
      <span className="ml-3 text-base text-muted">El que ja hi ha aquesta setmana no es toca.</span>
      <Errors errors={state.errors} />
    </div>
  );
}

function Session({ session }: { session: AdminSession & { name: string } }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<FormState>({});
  return (
    <li className="border-t border-line py-2.5 text-base">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="w-28 font-bold tabular-nums">
          {session.startsAt}
          {session.endsAt && `–${session.endsAt}`}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-bold">{session.name}</span>
          {session.place && <span className="text-muted"> · {session.place}</span>}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState(await removeSessionAction(session.id)))}
          className="font-bold text-terra hover:underline disabled:opacity-60"
          aria-label={`Treu ${session.name} de les ${session.startsAt}`}
        >
          {pending ? "Traient…" : "Treu"}
        </button>
      </div>
      <Errors errors={state.errors} />
    </li>
  );
}

type DayProps = {
  day: string;
  title: string;
  today: boolean;
  activities: { id: string; name: string }[];
  sessions: (AdminSession & { name: string })[];
};

export function ProgrammeDay({ day, title, today, activities, sessions }: DayProps) {
  const [state, submit, pending] = useActionState<FormState, FormData>(addSessionAction, {});
  const form = useRef<HTMLFormElement>(null);

  // En afegir-ne una es buida el formulari per poder posar la següent. Amb un error, es queda el que s'ha escrit.
  useEffect(() => {
    if (state.savedAt) form.current?.reset();
  }, [state.savedAt]);

  return (
    <section aria-label={title} className={`rounded-3xl border bg-card p-5 ${today ? "border-olive" : "border-line"}`}>
      <h2 className="font-display text-2xl text-olive first-letter:uppercase">
        {title}
        {today && <span className="ml-3 align-middle font-sans text-sm font-bold normal-case text-terra">Avui</span>}
      </h2>
      {sessions.length > 0 ? (
        <ul className="mt-3">
          {sessions.map((session) => (
            <Session key={session.id} session={session} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-base text-muted">Encara no hi ha res.</p>
      )}
      <details className="mt-3" open={Boolean(state.errors)}>
        <summary className="cursor-pointer text-base font-bold text-terra">+ Afegeix una activitat</summary>
        <form
          ref={form}
          // Com la resta del panell: s'envia a mà perquè un error de validació no buidi el formulari.
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            startTransition(() => submit(data));
          }}
          className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_2fr_auto] sm:items-end"
        >
          <input type="hidden" name="day" value={day} />
          <label className="block text-base font-bold">
            Activitat
            <select name="activity_id" required defaultValue="" className={INPUT}>
              <option value="" disabled>
                Tria…
              </option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-base font-bold">
            Inici
            <input type="time" name="starts_at" required className={INPUT} />
          </label>
          <label className="block text-base font-bold">
            Final
            <input type="time" name="ends_at" className={INPUT} />
          </label>
          <label className="block text-base font-bold">
            Lloc
            <input type="text" name="place" placeholder="Piscina Ombra" className={INPUT} />
          </label>
          <button type="submit" disabled={pending} className="rounded-full bg-band-terra px-5 py-2.5 text-base font-bold text-on-dark transition hover:brightness-110 disabled:opacity-60">
            {pending ? "Afegint…" : "Afegeix"}
          </button>
        </form>
        <Errors errors={state.errors} />
      </details>
    </section>
  );
}
