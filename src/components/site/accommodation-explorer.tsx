"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import { bookingLink } from "@/lib/booking/link";
import { accommodationHref } from "@/lib/content/accommodation";
import { Price, Specs } from "./accommodation-parts";
import { ShowOnMapButton } from "./show-on-map-button";
import type { Accommodation, AccommodationCategory, MapTarget } from "@/lib/supabase/content";

const GUEST_STEPS = [2, 4, 5, 6] as const;

/** Quants allotjaments es veuen d'entrada i quants més n'afegeix cada «Ver más». */
export const PAGE_SIZE = 9;

type Props = {
  categories: AccommodationCategory[];
  bookingUrl: string | null;
  /** Claus `accommodation:<slug>` i `category:<clau>` que tenen punt al mapa. Buit on no hi ha mapa a la pàgina. */
  onMap?: string[];
};

/**
 * On porta «Veure al mapa»: al punt de l'allotjament si en té (les parcel·les). Dels bungalows, mobile homes,
 * tendes i glàmpings no se sap a quin número és cada model: el mapa s'obre ensenyant tots els del càmping.
 */
function mapTargetFor(a: Accommodation, onMap: string[]): MapTarget | null {
  if (onMap.includes(`accommodation:${a.slug}`)) return { type: "accommodation", slug: a.slug };
  if (onMap.includes(`category:${a.category}`)) return { type: "category", slug: a.category };
  return null;
}

/**
 * Els allotjaments, filtrables per tipus i per persones. Se n'ensenyen nou i «Ver más» n'afegeix nou més fins a l'últim;
 * en canviar un filtre es torna a començar. Cada targeta porta a la pàgina de l'allotjament.
 */
export function AccommodationExplorer({ categories, bookingUrl, onMap = [] }: Props) {
  const t = useTranslations("accommodation");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [category, setCategory] = useState<string>("all");
  const [guests, setGuests] = useState<number>(0);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const grid = useRef<HTMLUListElement>(null);
  const tabsId = useId();

  const all = useMemo(() => categories.flatMap((c) => c.accommodations), [categories]);
  const current = categories.find((c) => c.key === category);
  const list = (current ? current.accommodations : all).filter((a) => !guests || (a.capacityMax ?? 0) >= guests);
  const shown = list.slice(0, limit);

  const filter = (change: () => void) => {
    change();
    setLimit(PAGE_SIZE);
  };

  const showMore = () => {
    const first = limit;
    setLimit(limit + PAGE_SIZE);
    // El focus va a la primera targeta nova: qui navega amb teclat continua d'on era.
    requestAnimationFrame(() => grid.current?.querySelectorAll<HTMLAnchorElement>("[data-card-link]")[first]?.focus({ preventScroll: true }));
  };

  return (
    <div className="mt-12">
      {/* Filtres */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="tablist" aria-label={t("label")} className="snap-strip -mx-4 gap-2 px-4 pb-1 lg:mx-0 lg:px-0">
          {[{ key: "all", name: t("all"), count: all.length }, ...categories.map((c) => ({ key: c.key, name: c.name, count: c.accommodations.length }))].map(
            (c) => (
              <button
                key={c.key}
                role="tab"
                id={`${tabsId}-${c.key}`}
                aria-selected={category === c.key}
                aria-controls={`${tabsId}-panel`}
                onClick={() => filter(() => setCategory(c.key))}
                className="whitespace-nowrap rounded-full border border-line px-5 py-2.5 font-bold text-ink transition hover:border-olive aria-selected:border-olive aria-selected:bg-olive aria-selected:text-paper"
              >
                {c.name} <span className="ml-1 font-normal">{c.count}</span>
              </button>
            ),
          )}
        </div>
        {/* Al mòbil, en una sola línia que llisca (com els tipus): en dues, el «6+» quedava sol a sota. `min-w-0`: un fieldset no s'encongeix sol. */}
        <fieldset className="-mx-4 flex min-w-0 items-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
          <legend className="sr-only">{t("guests")}</legend>
          <span aria-hidden="true" className="mr-1 shrink-0 text-sm font-bold uppercase tracking-wider text-muted">
            {t("guests")}
          </span>
          {[0, ...GUEST_STEPS].map((n) => (
            <label key={n} className="shrink-0 cursor-pointer">
              <input type="radio" name="guests" value={n} checked={guests === n} onChange={() => filter(() => setGuests(n))} className="peer sr-only" />
              <span className="inline-block whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition peer-checked:border-terra peer-checked:bg-terra peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-terra">
                {n ? t("guestsMin", { count: n }) : t("guestsAny")}
              </span>
            </label>
          ))}
        </fieldset>
      </div>

      {/* Llista */}
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${category}`} className="mt-8">
        <p className="sr-only" aria-live="polite">
          {t("count", { count: list.length })}
        </p>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul ref={grid} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((a, i) => {
              const target = mapTargetFor(a, onMap);
              return (
                <li
                  key={a.slug}
                  data-edit={`accommodations:${a.slug}`}
                  // Les que arriben amb «Ver más» entren una mica després l'una de l'altra.
                  className="accommodation-card group/card relative flex flex-col rounded-3xl border border-line bg-card p-2.5 transition duration-300 hover:border-olive hover:shadow-[0_28px_44px_-22px_rgb(35_42_20/.45)]"
                  style={{ ["--i" as string]: i % PAGE_SIZE }}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper-2">
                    {a.cover && (
                      <Image
                        src={a.cover.src}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                        className="object-cover transition duration-700 group-hover/card:scale-105"
                        style={{ objectPosition: a.cover.position }}
                      />
                    )}
                    {a.isAccessible && (
                      <span className="absolute left-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-bold text-olive">{t("accessible")}</span>
                    )}
                    {bookingUrl && (
                      // Per sobre de l'enllaç que ocupa tota la targeta. La icona es desplega amb el ratolí; on no n'hi ha, ja surt desplegada.
                      <a
                        href={bookingLink(bookingUrl, { locale })}
                        target="_blank"
                        rel="noopener"
                        aria-label={`${tNav("book")}: ${a.name}`}
                        className="group/book absolute bottom-3 right-3 z-10 flex h-11 items-center rounded-full bg-band-olive text-on-dark shadow-lg transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
                      >
                        <span className="grid size-11 shrink-0 place-items-center">
                          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                            <path
                              d="M7 3.5v3M17 3.5v3M4 9.5h16M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5zM9 14.5l2 2 4-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-out group-hover/card:grid-cols-[1fr] group-focus-visible/book:grid-cols-[1fr] [@media(hover:none)]:grid-cols-[1fr]">
                          <span className="overflow-hidden whitespace-nowrap text-sm font-bold">
                            <span className="block pr-5">{tNav("book")}</span>
                          </span>
                        </span>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 px-2.5 pb-2 pt-4">
                    {/* L'enllaç s'estén per tota la targeta (`after`): clicant on sigui s'obre la pàgina de l'allotjament. */}
                    <Link
                      href={accommodationHref(locale, a.slug)}
                      data-card-link
                      data-edit-field="name"
                      className="font-display text-2xl leading-tight text-olive transition-colors after:absolute after:inset-0 after:rounded-3xl group-hover/card:text-terra focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-terra"
                    >
                      {a.name}
                    </Link>
                    <Specs a={a} />
                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                      <Price value={a.priceFrom} />
                      {target && <ShowOnMapButton target={target} className="relative z-10 text-olive" />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {list.length > shown.length && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={showMore}
              className="rounded-full border-2 border-olive px-8 py-3.5 text-lg font-bold text-olive transition hover:bg-olive hover:text-paper"
            >
              {t("seeMore")}
            </button>
            <p className="text-sm text-muted">{t("showing", { shown: shown.length, total: list.length })}</p>
          </div>
        )}
      </div>
    </div>
  );
}
