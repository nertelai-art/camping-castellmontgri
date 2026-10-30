"use client";

// El programa d'aquesta setmana. Es demana quan la secció és a prop: la pàgina surt d'una caché que no sap quin dia és, i
// així el programa no pesa a la càrrega inicial. Sense res programat (fora de temporada), no s'ensenya res.

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { mondayOf, todayAtCamping, weekDays } from "@/lib/content/programme";
import type { ProgrammeSession } from "@/lib/supabase/content";

const weekday = (day: string, locale: string, style: "short" | "long") =>
  new Intl.DateTimeFormat(locale, { weekday: style, day: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));

export function WeekProgramme() {
  const t = useTranslations("entertainment.programme");
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const [week, setWeek] = useState<{ today: string; sessions: ProgrammeSession[] } | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const today = todayAtCamping(new Date());
        fetch(`/api/programme?locale=${locale}&week=${today}`)
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { sessions: ProgrammeSession[] } | null) => data && setWeek({ today, sessions: data.sessions }))
          .catch(() => {});
      },
      { rootMargin: "600px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [locale]);

  const active = picked ?? week?.today;
  const sessions = week?.sessions.filter((session) => session.day === active) ?? [];

  return (
    <div ref={root}>
      {week && week.sessions.length > 0 && (
        <div className="mt-16 rounded-[2rem] border border-on-dark/30 p-6 sm:p-8">
          <h3 className="font-display text-3xl">{t("title")}</h3>
          <div role="group" aria-label={t("days")} className="mt-5 flex flex-wrap gap-2">
            {weekDays(mondayOf(week.today)).map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={day === active}
                onClick={() => setPicked(day)}
                className="rounded-full border border-on-dark/40 px-4 py-2 font-bold capitalize transition hover:border-on-dark aria-pressed:bg-on-dark aria-pressed:text-band-terra"
              >
                {weekday(day, locale, "short")}
              </button>
            ))}
          </div>
          {sessions.length > 0 ? (
            <ul className="mt-5 grid gap-x-8 gap-y-3 md:grid-cols-2">
              {sessions.map((session) => (
                <li key={`${session.start}-${session.name}`} className="flex gap-4 border-t border-on-dark/20 pt-3">
                  <span className="w-28 shrink-0 font-bold tabular-nums">
                    {session.start}
                    {session.end && `–${session.end}`}
                  </span>
                  <span>
                    <span className="block font-bold">{session.name}</span>
                    {session.place && <span className="block text-sm">{session.place}</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5">{t("empty")}</p>
          )}
        </div>
      )}
    </div>
  );
}
