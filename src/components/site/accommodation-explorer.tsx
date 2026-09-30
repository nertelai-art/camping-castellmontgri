"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import { RichText } from "@/components/rich-text";
import type { Accommodation, AccommodationCategory } from "@/lib/supabase/content";

const GUEST_STEPS = [2, 4, 5, 6] as const;

type Props = { categories: AccommodationCategory[]; bookingUrl: string | null };

export function AccommodationExplorer({ categories, bookingUrl }: Props) {
  const t = useTranslations("accommodation");
  const tNav = useTranslations("nav");
  const [category, setCategory] = useState<string>("all");
  const [guests, setGuests] = useState<number>(0);
  const [open, setOpen] = useState<Accommodation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tabsId = useId();

  const all = useMemo(() => categories.flatMap((c) => c.accommodations), [categories]);
  const current = categories.find((c) => c.key === category);
  const list = (current ? current.accommodations : all).filter((a) => !guests || (a.capacityMax ?? 0) >= guests);

  const show = (a: Accommodation) => {
    setOpen(a);
    dialog.current?.showModal();
  };

  return (
    <div className="mt-12">
      {/* Filtres */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label={t("eyebrow")} className="snap-strip -mx-4 gap-2 px-4 pb-1 lg:mx-0 lg:px-0">
          {[{ key: "all", name: t("all"), count: all.length }, ...categories.map((c) => ({ key: c.key, name: c.name, count: c.accommodations.length }))].map(
            (c) => (
              <button
                key={c.key}
                role="tab"
                id={`${tabsId}-${c.key}`}
                aria-selected={category === c.key}
                aria-controls={`${tabsId}-panel`}
                onClick={() => setCategory(c.key)}
                className="whitespace-nowrap rounded-full border border-line px-5 py-2.5 font-bold text-ink transition hover:border-olive aria-selected:border-olive aria-selected:bg-olive aria-selected:text-paper"
              >
                {c.name} <span className="ml-1 font-normal">{c.count}</span>
              </button>
            ),
          )}
        </div>
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">{t("guests")}</legend>
          <span aria-hidden="true" className="mr-1 text-sm font-bold uppercase tracking-wider text-muted">
            {t("guests")}
          </span>
          {[0, ...GUEST_STEPS].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="guests" value={n} checked={guests === n} onChange={() => setGuests(n)} className="peer sr-only" />
              <span className="inline-block rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition peer-checked:border-terra peer-checked:bg-terra peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-terra">
                {n ? t("guestsMin", { count: n }) : t("guestsAny")}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {current?.description && <RichText text={current.description} className="mt-6 max-w-3xl text-muted [&_strong]:text-ink" />}

      {/* Llista */}
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${category}`} className="mt-8">
        <p className="sr-only" aria-live="polite">
          {t("count", { count: list.length })}
        </p>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((a) => (
              <li key={a.slug}>
                <button
                  type="button"
                  onClick={() => show(a)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line bg-card text-left transition hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgb(35_42_20/.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                    {a.cover && (
                      <Image
                        src={a.cover.src}
                        alt=""
                        fill
                        sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />
                    )}
                    {a.isAccessible && (
                      <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-bold text-olive">{t("accessible")}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <span className="font-display text-2xl leading-tight text-olive">{a.name}</span>
                    <Specs a={a} />
                    <span className="mt-auto pt-3 text-sm font-bold text-terra">
                      {t("details")} <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fitxa */}
      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
        aria-labelledby={`${tabsId}-dialog-title`}
        className="m-auto max-h-[92svh] w-[min(64rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[2rem] bg-paper p-0 text-ink shadow-2xl"
      >
        {open && (
          <article>
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-8">
              <h3 id={`${tabsId}-dialog-title`} className="font-display text-3xl text-olive">
                {open.name}
              </h3>
              <form method="dialog">
                <button className="flex size-10 items-center justify-center rounded-full border border-line text-olive hover:bg-paper-2" aria-label={tNav("close")}>
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </form>
            </div>

            {open.gallery.length > 0 && (
              <ul aria-label={t("gallery", { name: open.name })} className="snap-strip auto-cols-[85%] gap-3 px-5 pt-5 sm:auto-cols-[60%] sm:px-8">
                {open.gallery.map((m, i) => (
                  <li key={m.path} className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-paper-2">
                    <Image
                      src={m.src}
                      alt={t("photo", { index: i + 1, total: open.gallery.length })}
                      fill
                      sizes="(min-width: 640px) 600px, 85vw"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            )}

            <div className="grid gap-8 px-5 py-8 sm:px-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <Specs a={open} large />
                <RichText text={open.description} className="mt-6 grid gap-4 leading-relaxed text-muted [&_strong]:text-ink" />
              </div>
              {open.features.length > 0 && (
                <div className="rounded-3xl bg-card p-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-terra">{t("equipment")}</h4>
                  <ul className="mt-4 grid gap-2 text-sm">
                    {open.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-olive" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {bookingUrl && (
              <div className="sticky bottom-0 flex justify-end border-t border-line bg-paper/95 px-5 py-4 backdrop-blur sm:px-8">
                <a href={bookingUrl} target="_blank" rel="noopener" className="rounded-full bg-terra px-6 py-3 font-bold text-paper hover:bg-terra-2">
                  {tNav("book")}
                </a>
              </div>
            )}
          </article>
        )}
      </dialog>
    </div>
  );
}

function Specs({ a, large = false }: { a: Accommodation; large?: boolean }) {
  const t = useTranslations("accommodation");
  const items = [
    a.capacityMax && t("people", { count: a.capacityMax }),
    a.sizeM2 && t("size", { value: a.sizeM2 }),
    a.bedrooms ? t("bedrooms", { count: a.bedrooms }) : null,
    large && a.bathrooms ? t("bathrooms", { count: a.bathrooms }) : null,
    large && a.airConditioning ? t("airConditioning") : null,
    large && a.isAccessible ? t("accessible") : null,
  ].filter(Boolean);
  return (
    <ul className={`flex flex-wrap gap-x-3 gap-y-1 ${large ? "text-base font-bold text-ink" : "text-sm text-muted"}`}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3">
          {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-line" />}
          {item}
        </li>
      ))}
    </ul>
  );
}
