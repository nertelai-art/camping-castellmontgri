"use client";

// Formulari d'un contingut: els camps comuns a dalt i, a sota, els textos amb una pestanya per idioma.
// Tots els idiomes són sempre al formulari (els que no es veuen, amagats): en desar s'envien tots.

import { startTransition, useActionState, useState } from "react";
import type { FormState } from "@/app/admin/actions";
import { fieldName, LOCALE_NAMES, LOCALES, type EntityConfig, type Locale, type Translations } from "@/lib/admin/entities";

type Props = {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  text: EntityConfig["text"];
  base: EntityConfig["base"];
  initial: { base: Record<string, string | boolean>; translations: Partial<Translations> };
};

const INPUT = "mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-lg text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30";
const HELP = "mt-1 block text-base font-normal text-muted";

export function ContentForm({ action, text, base, initial }: Props) {
  const [state, submit, pending] = useActionState<FormState, FormData>(action, {});
  const [locale, setLocale] = useState<Locale>("ca");
  // Quins idiomes tenen el camp principal ple, per marcar les pestanyes. Es va actualitzant mentre s'escriu.
  const main = text[0]!.name;
  const [filled, setFilled] = useState<Record<Locale, boolean>>(
    () => Object.fromEntries(LOCALES.map((l) => [l, Boolean(initial.translations[l]?.[main])])) as Record<Locale, boolean>,
  );

  return (
    <form
      // Amb `action={submit}` React buida el formulari en acabar l'acció: si hi ha un error de validació es perdria
      // el que s'ha escrit. S'envia a mà, dins d'una transició, i els camps es queden com estan.
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => submit(data));
      }}
      className="mt-8 grid max-w-3xl gap-8"
    >
      {base.length > 0 && (
        <fieldset className="grid gap-5 rounded-3xl border border-line bg-card p-6">
          <legend className="px-2 text-sm font-bold uppercase tracking-[0.18em] text-muted">Per a tots els idiomes</legend>
          {base.map((field) => {
            const value = initial.base[field.name];
            if (field.kind === "boolean") {
              return (
                <label key={field.name} className="flex items-center gap-3 text-lg font-bold">
                  <input type="checkbox" name={field.name} defaultChecked={value === true} className="size-6 accent-olive" />
                  {field.label}
                </label>
              );
            }
            if (field.kind === "status") {
              return (
                <label key={field.name} className="block text-base font-bold">
                  {field.label}
                  <select name={field.name} defaultValue={String(value || "draft")} className={INPUT}>
                    <option value="published">Publicat: es veu a la web</option>
                    <option value="draft">Esborrany: no es veu</option>
                  </select>
                  {field.help && <span className={HELP}>{field.help}</span>}
                </label>
              );
            }
            return (
              <label key={field.name} className="block text-base font-bold">
                {field.label}
                <input
                  type={field.kind === "date" ? "date" : "text"}
                  inputMode={field.kind === "number" ? (field.decimal ? "decimal" : "numeric") : undefined}
                  name={field.name}
                  defaultValue={String(value ?? "")}
                  className={field.kind === "text" ? INPUT : `${INPUT} block max-w-56`}
                />
                {field.help && <span className={HELP}>{field.help}</span>}
              </label>
            );
          })}
        </fieldset>
      )}

      <div className="rounded-3xl border border-line bg-card p-6">
        <div role="tablist" aria-label="Idioma" className="flex flex-wrap gap-2">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              id={`tab-${l}`}
              aria-selected={locale === l}
              aria-controls={`panel-${l}`}
              onClick={() => setLocale(l)}
              className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-base font-bold transition hover:border-olive aria-selected:border-olive aria-selected:bg-olive aria-selected:text-paper"
            >
              {LOCALE_NAMES[l]}
              {!filled[l] && (
                <span className="rounded-full bg-band-terra px-2 py-0.5 text-xs text-on-dark">
                  <span aria-hidden="true">falta</span>
                  <span className="sr-only">(falta traduir)</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {LOCALES.map((l) => (
          <div key={l} role="tabpanel" id={`panel-${l}`} aria-labelledby={`tab-${l}`} hidden={locale !== l} className="mt-6 grid gap-5">
            {text.map((field) => {
              const name = fieldName(l, field.name);
              const value = initial.translations[l]?.[field.name] ?? "";
              const common = {
                name,
                defaultValue: value,
                lang: l,
                className: INPUT,
                onChange:
                  field.name === main
                    ? (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        const has = e.target.value.trim() !== "";
                        setFilled((f) => (f[l] === has ? f : { ...f, [l]: has }));
                      }
                    : undefined,
              };
              return (
                <label key={name} className="block text-base font-bold">
                  {field.label}
                  {field.long ? <textarea rows={8} {...common} /> : <input type="text" {...common} />}
                  {field.help && <span className={HELP}>{field.help}</span>}
                </label>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 -mx-2 flex flex-wrap items-center gap-4 bg-paper/95 px-2 py-4 backdrop-blur">
        <button type="submit" disabled={pending} className="rounded-full bg-band-terra px-8 py-3.5 text-lg font-bold text-on-dark transition hover:brightness-110 disabled:opacity-60">
          {pending ? "Desant…" : "Desa els canvis"}
        </button>
        <div aria-live="polite" className="text-base font-bold">
          {!pending && state.savedAt && !state.errors && <p className="text-olive">Desat. Ja es veu a la web.</p>}
          {state.errors && (
            <ul className="grid gap-1 text-terra">
              {state.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </form>
  );
}
