"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ASSISTANTS, clampNights, MAX_NIGHTS, MIN_NIGHTS, TRIP_TYPES, type Assistant, type TripType } from "@/lib/trip/assistants";
import { SectionHeading } from "./section-heading";

/** «El teu viatge, amb la IA»: tria nits i tipus de viatge, i el text va a l'assistent de cadascú. No s'envia res a cap servidor nostre. */
export function TripPlanner({ camping, place, url, index }: { camping: string; place: string | null; url: string; index: number }) {
  const t = useTranslations("trip");
  const [nights, setNights] = useState(3);
  const [type, setType] = useState<TripType>("family");
  const [copied, setCopied] = useState(false);
  const prompt = t("prompt", { nights, camping, place: place ?? "", url, type: t(`types.${type}`) });

  const copy = async () => {
    // Sense permís per copiar, el text continua a la vista i es pot seleccionar.
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const onAssistant = (assistant: Assistant) => {
    if (assistant.needsCopy) void copy();
  };

  return (
    <section aria-labelledby="trip-title" className="cv mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <SectionHeading id="trip-title" index={index} eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
          <div className="reveal mt-8 grid gap-4 sm:grid-cols-2">
            <div>
              <p id="trip-nights" className="text-sm font-bold text-olive">
                {t("duration")}
              </p>
              <div role="group" aria-labelledby="trip-nights" className="mt-2 flex items-center justify-between rounded-full bg-paper-2 p-1.5">
                <button type="button" aria-label={t("fewer")} disabled={nights <= MIN_NIGHTS} onClick={() => setNights(clampNights(nights - 1))} className="grid size-10 place-items-center rounded-full bg-card text-xl font-bold text-olive disabled:opacity-40">
                  −
                </button>
                <output aria-live="polite" className="font-bold">
                  {t("nights", { count: nights })}
                </output>
                <button type="button" aria-label={t("more")} disabled={nights >= MAX_NIGHTS} onClick={() => setNights(clampNights(nights + 1))} className="grid size-10 place-items-center rounded-full bg-card text-xl font-bold text-olive disabled:opacity-40">
                  +
                </button>
              </div>
            </div>
            <fieldset>
              <legend className="text-sm font-bold text-olive">{t("type")}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {TRIP_TYPES.map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input type="radio" name="trip-type" checked={type === option} onChange={() => setType(option)} className="peer sr-only" />
                    <span className="inline-block rounded-full bg-paper-2 px-4 py-2 text-sm font-bold text-ink transition peer-checked:bg-band-olive peer-checked:text-on-dark peer-focus-visible:outline-2 peer-focus-visible:outline-terra">
                      {t(`types.${option}`)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="reveal rounded-[2rem] bg-band-olive p-5 text-on-dark shadow-[0_30px_60px_-30px_rgb(35_42_20/.7)] sm:p-7">
          <p aria-live="polite" className="whitespace-pre-line text-[0.95rem] leading-relaxed sm:text-base">
            {prompt}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-on-dark/25 pt-5">
            <span className="mr-1 text-sm">{t("openIn")}</span>
            {ASSISTANTS.map((assistant) => (
              <a
                key={assistant.name}
                href={assistant.href(prompt)}
                target="_blank"
                rel="noopener"
                onClick={() => onAssistant(assistant)}
                className="rounded-full border border-on-dark/40 px-4 py-2 text-sm font-bold transition hover:bg-on-dark hover:text-band-olive"
              >
                {assistant.name}
              </a>
            ))}
            <button type="button" onClick={copy} className="ml-auto rounded-full bg-on-dark px-4 py-2 text-sm font-bold text-band-olive transition hover:brightness-95">
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
