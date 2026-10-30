"use client";

// La cerca de la portada: dates i persones, i al motor de reserves amb tot omplert.
// Sense JS, el formulari obre el motor igualment, encara que sense les dates en el seu format.

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { bookingLink } from "@/lib/booking/link";

const FIELD = "w-full min-w-0 bg-transparent text-sm font-bold text-ink focus:outline-none sm:text-base";
const LABEL = "block min-w-0 px-4 py-2.5 text-left sm:px-5 text-xs font-bold uppercase tracking-wider text-muted focus-within:bg-paper-2";
const today = () => new Date().toLocaleDateString("en-CA");

export function BookingBar({ bookingUrl }: { bookingUrl: string }) {
  const t = useTranslations("booking");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [invalid, setInvalid] = useState(false);

  return (
    <form
      action={bookingUrl}
      target="_blank"
      aria-label={t("search")}
      onSubmit={(event) => {
        event.preventDefault();
        if (checkIn && checkOut && checkOut <= checkIn) return setInvalid(true);
        setInvalid(false);
        const data = new FormData(event.currentTarget);
        const link = bookingLink(bookingUrl, { locale, checkIn, checkOut, adults: Number(data.get("adults")), children: Number(data.get("ninos")) });
        window.open(link, "_blank", "noopener");
      }}
      className="w-full max-w-4xl"
    >
      <div className="grid overflow-hidden rounded-3xl bg-card text-ink shadow-2xl grid-cols-2 lg:grid-cols-[1.3fr_1.3fr_1fr_1fr_auto] lg:items-center lg:rounded-full lg:pl-3 lg:pr-2">
        <label className={`${LABEL} lg:rounded-full`}>
          {t("checkIn")}
          <input
            type="date"
            value={checkIn}
            onFocus={(event) => (event.currentTarget.min = today())}
            onChange={(event) => setCheckIn(event.target.value)}
            className={`${FIELD} mt-0.5`}
          />
        </label>
        <label className={`${LABEL} lg:rounded-full`}>
          {t("checkOut")}
          <input
            type="date"
            value={checkOut}
            min={checkIn || undefined}
            onFocus={(event) => !checkIn && (event.currentTarget.min = today())}
            onChange={(event) => setCheckOut(event.target.value)}
            className={`${FIELD} mt-0.5`}
          />
        </label>
        <label className={`${LABEL} lg:rounded-full`}>
          {t("adults")}
          <select name="adults" defaultValue="2" className={`${FIELD} mt-0.5`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className={`${LABEL} lg:rounded-full`}>
          {t("children")}
          <select name="ninos" defaultValue="0" className={`${FIELD} mt-0.5`}>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div className="col-span-2 p-2 lg:col-span-1 lg:p-0">
          <button type="submit" className="w-full rounded-full bg-band-olive px-8 py-3.5 font-bold text-on-dark transition hover:brightness-125">
            {tNav("book")}
          </button>
        </div>
      </div>
      <p aria-live="polite" className={invalid ? "mt-3 inline-block rounded-full bg-card px-4 py-1.5 text-sm font-bold text-terra" : "sr-only"}>
        {invalid && t("invalid")}
      </p>
    </form>
  );
}
