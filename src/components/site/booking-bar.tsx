"use client";

// La cerca de la portada: dates i persones, i al motor de reserves amb tot omplert. Els selectors són propis (cap <select> ni
// calendari del navegador). Sense JS els panells no s'obren, però el formulari porta al motor igualment.

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { bookingLink } from "@/lib/booking/link";
import { formatDay, localDay, nightsBetween, pickDay, type Range } from "@/lib/booking/calendar";
import { BookingCalendar } from "./booking-calendar";

type Panel = "dates" | "guests" | null;

const MAX_ADULTS = 8;
const MAX_CHILDREN = 6;

export function BookingBar({ bookingUrl }: { bookingUrl: string }) {
  const t = useTranslations("booking");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [panel, setPanel] = useState<Panel>(null);
  const [range, setRange] = useState<Range>({ checkIn: "", checkOut: "" });
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  // «Avui» es calcula en obrir, no en pintar: la pàgina surt d'una caché que no sap quin dia és.
  const [today, setToday] = useState("");
  const root = useRef<HTMLFormElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const open = (next: Exclude<Panel, null>, from: HTMLElement) => {
    trigger.current = from;
    setToday(localDay(new Date()));
    setPanel((current) => (current === next ? null : next));
  };

  useEffect(() => {
    if (!panel) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setPanel(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPanel(null);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    // Que el panell es vegi sencer si la barra queda baixa a la pantalla.
    if (window.matchMedia("(min-width: 1024px)").matches) sheet.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const guests = [t("adultsCount", { count: adults }), ...(children ? [t("childrenCount", { count: children }) ] : [])].join(" · ");
  const nights = range.checkIn && range.checkOut ? nightsBetween(range.checkIn, range.checkOut) : 0;

  return (
    <form
      ref={root}
      action={bookingUrl}
      target="_blank"
      aria-label={t("search")}
      onSubmit={(event) => {
        event.preventDefault();
        // Una entrada sense sortida no és una cerca: el motor ignoraria la data sense dir res.
        if (range.checkIn && !range.checkOut) {
          trigger.current = event.currentTarget.querySelector("button");
          setToday(localDay(new Date()));
          return setPanel("dates");
        }
        setPanel(null);
        window.open(bookingLink(bookingUrl, { locale, ...range, adults, children }), "_blank", "noopener");
      }}
      className="relative w-full max-w-3xl text-left"
    >
      <div className="grid grid-cols-2 items-center gap-1 rounded-[1.75rem] bg-card p-1.5 text-ink shadow-[0_24px_60px_-20px_rgb(22_27_13/.7)] lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:rounded-full">
        <Field label={t("checkIn")} active={panel === "dates"} onClick={(el) => open("dates", el)} expanded={panel === "dates"}>
          {range.checkIn ? formatDay(range.checkIn, locale) : t("addDate")}
        </Field>
        <Field label={t("checkOut")} active={panel === "dates"} onClick={(el) => open("dates", el)} expanded={panel === "dates"}>
          {range.checkOut ? formatDay(range.checkOut, locale) : t("addDate")}
        </Field>
        <div className="col-span-2 lg:col-span-1">
          <Field label={t("guests")} active={panel === "guests"} onClick={(el) => open("guests", el)} expanded={panel === "guests"}>
            {guests}
          </Field>
        </div>
        <button type="submit" className="col-span-2 flex h-13 items-center justify-center gap-2 rounded-full bg-band-olive px-7 font-bold text-on-dark transition hover:brightness-125 lg:col-span-1">
          <svg viewBox="0 0 24 24" className="size-[1.1rem]" aria-hidden="true">
            <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.8-3.8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          {tNav("book")}
        </button>
      </div>

      {panel && (
        <>
          {/* Al mòbil el panell és una làmina que puja de baix, amb el fons enfosquit; a l'escriptori, un desplegable sota la barra. */}
          <div aria-hidden="true" onClick={() => setPanel(null)} className="fixed inset-0 z-40 bg-[rgb(22_27_13/.55)] lg:hidden" />
          <div
            ref={sheet}
            role="dialog"
            aria-label={panel === "dates" ? t("checkIn") + " · " + t("checkOut") : t("guests")}
            className={`booking-panel scroll-mb-4 fixed inset-x-0 bottom-0 z-50 max-h-[88svh] overflow-y-auto overscroll-contain rounded-t-[1.75rem] bg-card p-5 text-ink shadow-2xl lg:absolute lg:inset-x-auto lg:bottom-auto lg:top-full lg:mt-3 lg:rounded-[1.75rem] lg:p-6 ${
              panel === "dates" ? "lg:left-1/2 lg:w-[44rem] lg:-translate-x-1/2" : "lg:right-0 lg:w-[22rem]"
            }`}
          >
            {panel === "dates" ? (
              <>
                <p aria-live="polite" className="mb-3 text-center text-sm font-bold text-muted">
                  {nights ? `${formatDay(range.checkIn, locale)} – ${formatDay(range.checkOut, locale)} · ${t("nights", { count: nights })}` : range.checkIn ? t("chooseCheckOut") : t("chooseCheckIn")}
                </p>
                <BookingCalendar
                  range={range}
                  today={today}
                  onPick={(day) => {
                    const next = pickDay(range, day);
                    setRange(next);
                    if (next.checkOut) {
                      setPanel(null);
                      trigger.current?.focus();
                    }
                  }}
                />
                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <button type="button" onClick={() => setRange({ checkIn: "", checkOut: "" })} disabled={!range.checkIn} className="rounded-full px-3 py-2 text-sm font-bold text-olive underline underline-offset-4 disabled:invisible">
                    {t("clear")}
                  </button>
                  <button type="button" onClick={() => setPanel(null)} className="rounded-full bg-paper-2 px-5 py-2.5 text-sm font-bold text-olive transition hover:bg-line">
                    {t("done")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <ul className="grid gap-1">
                  <Stepper label={t("adults")} value={adults} min={1} max={MAX_ADULTS} onChange={setAdults} />
                  <Stepper label={t("children")} value={children} min={0} max={MAX_CHILDREN} onChange={setChildren} />
                </ul>
                <div className="mt-3 flex justify-end border-t border-line pt-3">
                  <button type="button" onClick={() => setPanel(null)} className="rounded-full bg-paper-2 px-5 py-2.5 text-sm font-bold text-olive transition hover:bg-line">
                    {t("done")}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </form>
  );
}

function Field({ label, active, expanded, onClick, children }: { label: string; active: boolean; expanded: boolean; onClick: (el: HTMLElement) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={expanded}
      onClick={(event) => onClick(event.currentTarget)}
      className={`block w-full min-w-0 rounded-full px-5 py-2 text-left transition-colors ${active ? "bg-paper-2" : "hover:bg-paper-2"}`}
    >
      <span className="block text-xs font-bold text-olive">{label}</span>
      <span className="block truncate text-[0.95rem] text-ink">{children}</span>
    </button>
  );
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const t = useTranslations("booking");
  return (
    <li className="flex items-center justify-between gap-4 py-2.5">
      <span className="font-bold">{label}</span>
      <span className="flex items-center gap-3">
        <StepButton label={t("less", { label })} disabled={value <= min} onClick={() => onChange(value - 1)} path="M6 12h12" />
        <output aria-live="polite" aria-label={label} className="w-6 text-center text-lg font-bold tabular-nums">
          {value}
        </output>
        <StepButton label={t("more", { label })} disabled={value >= max} onClick={() => onChange(value + 1)} path="M12 6v12M6 12h12" />
      </span>
    </li>
  );
}

function StepButton({ label, disabled, onClick, path }: { label: string; disabled: boolean; onClick: () => void; path: string }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-10 place-items-center rounded-full border border-line text-olive transition hover:border-olive hover:bg-paper-2 disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
