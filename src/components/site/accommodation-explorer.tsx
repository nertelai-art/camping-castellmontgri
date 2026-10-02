"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import { RichText } from "@/components/rich-text";
import { ShowOnMapButton } from "./show-on-map-button";
import type { Accommodation, AccommodationCategory, MapTarget } from "@/lib/supabase/content";

const GUEST_STEPS = [2, 4, 5, 6] as const;

type Props = {
  categories: AccommodationCategory[];
  bookingUrl: string | null;
  /** Claus `accommodation:<slug>` que tenen punt al mapa. */
  onMap: string[];
  /**
   * A la portada: al mòbil només se n'ensenyen uns quants (en una sola columna, vint-i-tants fan un scroll
   * inacabable) i un botó porta a la pàgina amb tots. Amb pantalla ampla, la graella sencera.
   */
  allHref?: string;
  /** Si hi ha mapa a la pàgina on portar «Veure al mapa». */
  mapLinks?: boolean;
};

/** Quants allotjaments es veuen al mòbil a la portada. */
const MOBILE_PREVIEW = 4;

/**
 * On porta «Veure al mapa»: al punt de l'allotjament si en té (les parcel·les). Dels bungalows, mobile homes,
 * tendes i glàmpings no se sap a quin número és cada model: el mapa s'obre ensenyant tots els del càmping.
 */
function mapTargetFor(a: Accommodation, onMap: string[]): MapTarget {
  if (onMap.includes(`accommodation:${a.slug}`)) return { type: "accommodation", slug: a.slug };
  return { type: "category", slug: a.category };
}

export function AccommodationExplorer({ categories, bookingUrl, onMap, allHref, mapLinks = true }: Props) {
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
            {list.map((a, i) => (
              <li key={a.slug} data-edit={`accommodations:${a.slug}`} className={allHref && i >= MOBILE_PREVIEW ? "max-sm:hidden" : undefined}>
                <button
                  type="button"
                  onClick={() => show(a)}
                  className="group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-line bg-card text-left transition duration-300 hover:-translate-y-1.5 hover:border-olive hover:shadow-[0_28px_44px_-22px_rgb(35_42_20/.55)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
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
                    {/* Senyal que la targeta s'obre: sempre visible (al mòbil no hi ha «passar per sobre») i s'encén amb el ratolí. */}
                    <span
                      aria-hidden="true"
                      className="absolute bottom-3 right-3 grid size-11 place-items-center rounded-full bg-paper text-olive shadow-lg transition duration-300 group-hover:scale-110 group-hover:bg-terra group-hover:text-paper"
                    >
                      <svg viewBox="0 0 24 24" className="size-5">
                        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <span data-edit-field="name" className="font-display text-2xl leading-tight text-olive transition-colors group-hover:text-terra">{a.name}</span>
                    <Specs a={a} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        {allHref && list.length > MOBILE_PREVIEW && (
          <Link
            href={allHref}
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-olive px-6 py-4 text-lg font-bold text-paper transition hover:brightness-110 sm:hidden"
          >
            {t("seeAll", { count: list.length })}
            <span aria-hidden="true">→</span>
          </Link>
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

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-4 border-t border-line bg-paper/95 px-5 py-4 sm:px-8">
              {/* Primer es tanca la fitxa (és modal) perquè el mapa quedi a la vista. */}
              {mapLinks && <ShowOnMapButton target={mapTargetFor(open, onMap)} beforeShow={() => dialog.current?.close()} className="text-base text-olive" />}
              {bookingUrl && (
                <a href={bookingUrl} target="_blank" rel="noopener" className="rounded-full bg-terra px-6 py-3 font-bold text-paper hover:bg-terra-2">
                  {tNav("book")}
                </a>
              )}
            </div>
          </article>
        )}
      </dialog>
    </div>
  );
}

// Icones de les dades (traç de 24 px): persones, superfície, habitacions, banys, aire condicionat i adaptat.
const SPEC_ICON = {
  people: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3 3 0 0 1 0 5.6",
  size: "M4 9V4h5M20 15v5h-5M4 4l6.5 6.5M20 20l-6.5-6.5M15 4h5v5M9 20H4v-5",
  bedrooms: "M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M3 18v1.5M21 18v1.5M7 9V7.5A1.5 1.5 0 0 1 8.5 6h7A1.5 1.5 0 0 1 17 7.5V9",
  bathrooms: "M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6.5A2.5 2.5 0 0 1 8.5 4c1.2 0 2.1.8 2.4 1.9M7 19l-1 2M17 19l1 2",
  airConditioning: "M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5",
  accessible: "M11 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M11 8v6h5l2.5 5M11 10.5h4M8 12.2A5 5 0 1 0 14.5 19",
} as const;

function Specs({ a, large = false }: { a: Accommodation; large?: boolean }) {
  const t = useTranslations("accommodation");
  const items = [
    a.capacityMax && { icon: "people", text: t("people", { count: a.capacityMax }) },
    a.sizeM2 && { icon: "size", text: t("size", { value: a.sizeM2 }) },
    a.bedrooms ? { icon: "bedrooms", text: t("bedrooms", { count: a.bedrooms }) } : null,
    large && a.bathrooms ? { icon: "bathrooms", text: t("bathrooms", { count: a.bathrooms }) } : null,
    large && a.airConditioning ? { icon: "airConditioning", text: t("airConditioning") } : null,
    large && a.isAccessible ? { icon: "accessible", text: t("accessible") } : null,
  ].filter((item): item is { icon: keyof typeof SPEC_ICON; text: string } => Boolean(item));
  return (
    <ul className={`flex flex-wrap ${large ? "gap-x-5 gap-y-2 text-base font-bold text-ink" : "gap-x-4 gap-y-1.5 text-sm text-muted"}`}>
      {items.map((item) => (
        <li key={item.icon} className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className={`shrink-0 text-olive ${large ? "size-5" : "size-[1.1rem]"}`} aria-hidden="true">
            <path d={SPEC_ICON[item.icon]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {item.text}
        </li>
      ))}
    </ul>
  );
}
