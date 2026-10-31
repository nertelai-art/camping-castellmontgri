"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { addDays, addMonths, formatDay, formatMonth, monthCells, monthOf, type Month, type Range, weekdayNames } from "@/lib/booking/calendar";

type Props = {
  range: Range;
  /** Avui, al dia de qui mira: abans no s'hi pot entrar. */
  today: string;
  onPick: (day: string) => void;
};

/** Dos mesos a l'escriptori i un al mòbil. Amb les fletxes es va de dia en dia; una sola parada de tabulador per a tota la graella. */
export function BookingCalendar({ range, today, onPick }: Props) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const [shown, setShown] = useState<Month>(() => monthOf(range.checkIn || today));
  const [hover, setHover] = useState("");
  const [focusDay, setFocusDay] = useState(range.checkOut || range.checkIn || today);
  const moveFocus = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  const weekdays = useMemo(() => weekdayNames(locale), [locale]);
  const firstMonth = monthOf(today);
  const atStart = shown.year === firstMonth.year && shown.month === firstMonth.month;

  // El focus va després de pintar: amb les fletxes es pot acabar en un mes que encara no hi era.
  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    grid.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus();
  }, [focusDay, shown]);

  const onKeyDown = (event: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = addDays(focusDay, step);
    if (next < today) return;
    moveFocus.current = true;
    setFocusDay(next);
    // Al mòbil només es veu el primer mes: la vista es mou sempre que se'n surti.
    const month = monthOf(next);
    if (month.year !== shown.year || month.month !== shown.month) setShown(month);
  };

  // Mentre es tria la sortida, el tram es dibuixa fins on és el ratolí.
  const end = range.checkOut || (range.checkIn && hover > range.checkIn ? hover : "");

  return (
    <div ref={grid} onKeyDown={onKeyDown} onMouseLeave={() => setHover("")} className="relative">
      <button
        type="button"
        onClick={() => setShown(addMonths(shown, -1))}
        disabled={atStart}
        aria-label={t("previousMonth")}
        className="absolute left-0 top-0 grid size-10 place-items-center rounded-full text-olive transition hover:bg-paper-2 disabled:invisible"
      >
        <Chevron direction="left" />
      </button>
      <button
        type="button"
        onClick={() => setShown(addMonths(shown, 1))}
        aria-label={t("nextMonth")}
        className="absolute right-0 top-0 grid size-10 place-items-center rounded-full text-olive transition hover:bg-paper-2"
      >
        <Chevron direction="right" />
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {[shown, addMonths(shown, 1)].map((month, index) => (
          <div key={`${month.year}-${month.month}`} className={index === 1 ? "max-lg:hidden" : undefined}>
            <p aria-live="polite" className="font-display flex h-10 items-center justify-center text-lg text-olive first-letter:uppercase">
              {formatMonth(month, locale)}
            </p>
            <div aria-hidden="true" className="mt-2 grid grid-cols-7 text-center text-xs font-bold text-muted">
              {weekdays.map((name) => (
                <span key={name} className="py-1 first-letter:uppercase">
                  {name}
                </span>
              ))}
            </div>
            <ul className="grid grid-cols-7 gap-y-0.5">
              {monthCells(month).map((day, cell) => {
                if (!day) return <li key={`blank-${cell}`} aria-hidden="true" />;
                const past = day < today;
                const isEdge = day === range.checkIn || day === range.checkOut;
                const inRange = Boolean(range.checkIn && end && day >= range.checkIn && day <= end);
                return (
                  <li key={day} className={`relative ${inRange ? "bg-paper-2" : ""} ${day === range.checkIn && end ? "rounded-l-full" : ""} ${day === end ? "rounded-r-full" : ""}`}>
                    <button
                      type="button"
                      data-day={day}
                      disabled={past}
                      tabIndex={day === focusDay ? 0 : -1}
                      aria-pressed={isEdge}
                      aria-label={formatDay(day, locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      onClick={() => {
                        setFocusDay(day);
                        onPick(day);
                      }}
                      onMouseEnter={() => setHover(day)}
                      className={`mx-auto grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm font-bold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-terra ${
                        isEdge ? "bg-band-olive text-on-dark" : past ? "text-muted/40 line-through" : "text-ink hover:bg-olive/15"
                      } ${day === today && !isEdge ? "ring-1 ring-inset ring-olive/50" : ""}`}
                    >
                      {Number(day.slice(8))}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
