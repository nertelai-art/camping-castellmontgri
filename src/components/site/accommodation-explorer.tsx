"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import { RichText } from "@/components/rich-text";
import { bookingLink } from "@/lib/booking/link";
import { equipmentOnly } from "@/lib/content/equipment";
import { withViewTransition } from "@/lib/view-transition";
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
/** A partir de quants caràcters la descripció de la fitxa surt plegada. */
const COLLAPSED_LENGTH = 320;
/** Els noms de les transicions de vista, que són als estils de `globals.css`. */
const PHOTO_TRANSITION = "accommodation-photo";
const SHEET_TRANSITION = "accommodation-sheet";

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
  const locale = useLocale();
  const [category, setCategory] = useState<string>("all");
  const [guests, setGuests] = useState<number>(0);
  const [open, setOpen] = useState<Accommodation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const tabsId = useId();

  const all = useMemo(() => categories.flatMap((c) => c.accommodations), [categories]);
  const current = categories.find((c) => c.key === category);
  const list = (current ? current.accommodations : all).filter((a) => !guests || (a.capacityMax ?? 0) >= guests);

  // La foto de la targeta i la de la fitxa porten el mateix nom de transició, mai alhora: és el que fa que el navegador la faci volar d'una a l'altra.
  const cardPhoto = (slug: string) => grid.current?.querySelector<HTMLElement>(`[data-photo="${slug}"]`) ?? null;

  const show = (a: Accommodation) => {
    const photo = cardPhoto(a.slug);
    if (photo) photo.style.viewTransitionName = PHOTO_TRANSITION;
    void withViewTransition(() => {
      if (photo) photo.style.viewTransitionName = "";
      setOpen(a);
      dialog.current?.showModal();
    });
  };

  const hide = () => {
    const photo = open && cardPhoto(open.slug);
    void withViewTransition(() => {
      setOpen(null);
      dialog.current?.close();
      if (photo) photo.style.viewTransitionName = PHOTO_TRANSITION;
    }).finally(() => {
      if (photo) photo.style.viewTransitionName = "";
    });
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

      {/* Llista */}
      <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-${category}`} className="mt-8">
        <p className="sr-only" aria-live="polite">
          {t("count", { count: list.length })}
        </p>
        {list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t("empty")}</p>
        ) : (
          <ul ref={grid} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((a, i) => (
              <li
                key={a.slug}
                data-edit={`accommodations:${a.slug}`}
                className={`group/card relative flex flex-col rounded-3xl border border-line bg-card p-2.5 transition duration-300 hover:border-olive hover:shadow-[0_28px_44px_-22px_rgb(35_42_20/.55)] ${allHref && i >= MOBILE_PREVIEW ? "max-sm:hidden" : ""}`}
              >
                <div data-photo={a.slug} className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper-2">
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
                    // Per sobre del botó que ocupa tota la targeta. La icona es desplega amb el ratolí; on no n'hi ha, ja surt desplegada.
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
                  {/* El botó s'estén per tota la targeta (`after`): clicant on sigui s'obre la fitxa. */}
                  <button
                    type="button"
                    onClick={() => show(a)}
                    data-edit-field="name"
                    className="font-display cursor-pointer text-left text-2xl leading-tight text-olive transition-colors after:absolute after:inset-0 after:rounded-3xl group-hover/card:text-terra focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-terra"
                  >
                    {a.name}
                  </button>
                  <Specs a={a} />
                  <div className="mt-auto pt-2">
                    <Price value={a.priceFrom} />
                  </div>
                </div>
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
        onCancel={(event) => {
          event.preventDefault();
          hide();
        }}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && hide()}
        aria-labelledby={`${tabsId}-dialog-title`}
        className="m-auto max-h-[92svh] w-[min(72rem,calc(100vw-1.5rem))] overflow-y-auto rounded-[2rem] bg-paper p-0 text-ink shadow-2xl md:overflow-hidden"
      >
        {open && (
          <Sheet
            key={open.slug}
            a={open}
            titleId={`${tabsId}-dialog-title`}
            bookingUrl={bookingUrl}
            onClose={hide}
            // Primer es tanca la fitxa (és modal) perquè el mapa quedi a la vista.
            map={mapLinks ? <ShowOnMapButton target={mapTargetFor(open, onMap)} beforeShow={() => dialog.current?.close()} className="text-base text-olive" /> : null}
          />
        )}
      </dialog>
    </div>
  );
}

/** La fitxa: la foto que ve de la targeta a l'esquerra, amb les altres a sota, i les dades a la dreta. Cada bloc entra un moment després de l'anterior. */
function Sheet({ a, titleId, bookingUrl, onClose, map }: { a: Accommodation; titleId: string; bookingUrl: string | null; onClose: () => void; map: ReactNode }) {
  const t = useTranslations("accommodation");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  // La de la targeta primer, perquè la transició arribi a la mateixa foto.
  const photos = a.cover ? [a.cover, ...a.gallery.filter((m) => m.src !== a.cover?.src)] : a.gallery;
  const photo = photos[index];
  const equipment = equipmentOnly(a.features, a.airConditioning ? [t("airConditioning")] : []);
  const go = (step: number) => setIndex((index + step + photos.length) % photos.length);

  return (
    <article style={{ viewTransitionName: SHEET_TRANSITION }} className="relative bg-paper md:grid md:h-[min(44rem,92svh)] md:grid-cols-[1.2fr_1fr]">
      <div className="sticky top-0 z-20 flex h-0 justify-end md:absolute md:inset-x-0">
        <button type="button" onClick={onClose} aria-label={tNav("close")} className="m-3 grid size-11 shrink-0 place-items-center rounded-full bg-card text-olive shadow-lg transition hover:scale-105">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex min-h-0 flex-col gap-3 p-3 sm:p-4 md:overflow-y-auto">
        <div style={{ viewTransitionName: PHOTO_TRANSITION }} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[1.5rem] bg-paper-2">
          {photo && (
            <Image
              key={photo.src}
              src={photo.src}
              alt={t("photo", { index: index + 1, total: photos.length })}
              fill
              priority
              sizes="(min-width: 768px) 55vw, 100vw"
              className="object-cover"
              style={{ objectPosition: photo.position }}
            />
          )}
          {photos.length > 1 && (
            <>
              <PhotoButton label={t("previousPhoto")} onClick={() => go(-1)} side="left" />
              <PhotoButton label={t("nextPhoto")} onClick={() => go(1)} side="right" />
              <span className="absolute bottom-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-xs font-bold tabular-nums text-olive">
                {index + 1} / {photos.length}
              </span>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <ul aria-label={t("gallery", { name: a.name })} className="accommodation-build snap-strip shrink-0 auto-cols-[5.5rem] gap-2 p-1" style={{ ["--i" as string]: 0 }}>
            {photos.map((m, i) => (
              <li key={m.src}>
                <button
                  type="button"
                  aria-current={i === index}
                  aria-label={t("photo", { index: i + 1, total: photos.length })}
                  onClick={() => setIndex(i)}
                  className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl opacity-70 transition hover:opacity-100 aria-[current=true]:opacity-100 aria-[current=true]:ring-2 aria-[current=true]:ring-olive aria-[current=true]:ring-offset-2 aria-[current=true]:ring-offset-paper"
                >
                  <Image src={m.src} alt="" fill sizes="88px" className="object-cover" style={{ objectPosition: m.position }} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="flex-1 px-5 pb-6 pt-2 sm:px-7 md:overflow-y-auto md:pt-7">
          <h3 id={titleId} className="accommodation-build font-display pr-12 text-3xl leading-tight text-olive sm:text-4xl" style={{ ["--i" as string]: 1 }}>
            {a.name}
          </h3>
          <div className="accommodation-build mt-4" style={{ ["--i" as string]: 2 }}>
            <Specs a={a} large />
          </div>
          <div className="accommodation-build" style={{ ["--i" as string]: 3 }}>
            <Description text={a.description} />
          </div>
          {equipment.length > 0 && (
            <div className="accommodation-build mt-7" style={{ ["--i" as string]: 4 }}>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-terra">{t("equipment")}</h4>
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {equipment.map((f) => (
                  <li key={f} className="rounded-full border border-line bg-card px-3 py-1.5">
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="accommodation-build sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-paper px-5 py-4 sm:px-7" style={{ ["--i" as string]: 5 }}>
          {map}
          <div className="ml-auto flex items-center gap-4">
            <Price value={a.priceFrom} />
            {bookingUrl && (
              <a href={bookingLink(bookingUrl, { locale })} target="_blank" rel="noopener" className="rounded-full bg-band-olive px-6 py-3 font-bold text-on-dark transition hover:brightness-125">
                {tNav("book")}
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function PhotoButton({ label, onClick, side }: { label: string; onClick: () => void; side: "left" | "right" }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className={`absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-paper/90 text-olive shadow transition hover:bg-paper ${side === "left" ? "left-3" : "right-3"}`}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d={side === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
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

/** El text sencer és llarg: es veu el començament i «Llegir més» desplega la resta. */
function Description({ text }: { text: string | null }) {
  const t = useTranslations("accommodation");
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const long = text.length > COLLAPSED_LENGTH;
  return (
    <div className="mt-5">
      {/* `line-clamp` i `grid` es trepitgen (tots dos posen `display`): plegat, només el primer. */}
      <RichText text={text} className={`leading-relaxed text-muted [&_strong]:text-ink ${long && !expanded ? "line-clamp-4" : "grid gap-4"}`} />
      {long && (
        <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-3 font-bold text-olive underline underline-offset-4">
          {expanded ? t("readLess") : t("readMore")}
        </button>
      )}
    </div>
  );
}

/** «des de 31 €/nit». Sense preu no s'ensenya res: un preu inventat seria pitjor que cap. */
function Price({ value }: { value: number | null }) {
  const t = useTranslations("accommodation");
  const locale = useLocale();
  if (value == null) return null;
  return (
    <p className="text-sm leading-tight text-muted">
      {t("from")}
      <span className="block text-lg font-bold text-ink">
        {new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)}
        <span className="text-sm font-normal text-muted">{t("perNight")}</span>
      </span>
    </p>
  );
}

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
