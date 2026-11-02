"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ASSISTANTS, clampNights, MAX_NIGHTS, MIN_NIGHTS, TRIP_TYPES, type AssistantKey, type TripType } from "@/lib/trip/assistants";
import { AssistantLogo } from "./ai-logos";
import { SectionHeading } from "./section-heading";

// Icones dels tipus de viatge (traç de 24 px).
const TYPE_ICON: Record<TripType, string> = {
  family: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20M17 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M16.5 15.5a3.5 3.5 0 0 1 4 3.5V20",
  adventure: "M3 20 9.5 7l4 7 2-3 5.5 9zM9.5 7l-2 4.5 2-1 2 1.5",
  romantic: "M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20z",
  culture: "M4 20h16M5 10h14M12 4l8 6H4zM7 10v10M12 10v10M17 10v10",
};

/** «El teu viatge, amb la IA»: tria nits i tipus de viatge, i el text va a l'assistent de cadascú. No s'envia res a cap servidor nostre. */
export function TripPlanner({ camping, place, url, index }: { camping: string; place: string | null; url: string; index: number }) {
  const t = useTranslations("trip");
  const [nights, setNights] = useState(3);
  const [type, setType] = useState<TripType>("family");
  const [assistantKey, setAssistantKey] = useState<AssistantKey>("chatgpt");
  const [copied, setCopied] = useState(false);
  const assistant = ASSISTANTS.find((a) => a.key === assistantKey) ?? ASSISTANTS[0];
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

  return (
    <section aria-labelledby="trip-title" className="cv mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14">
        <div>
          <SectionHeading id="trip-title" index={index} eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />

          <div className="reveal mt-9 grid gap-7">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-line bg-card px-5 py-4">
              <p id="trip-nights" className="font-bold text-ink">
                {t("duration")}
              </p>
              <div role="group" aria-labelledby="trip-nights" className="flex items-center gap-3">
                <NightButton label={t("fewer")} disabled={nights <= MIN_NIGHTS} onClick={() => setNights(clampNights(nights - 1))} path="M6 12h12" />
                <output aria-live="polite" className="min-w-[5.5rem] text-center">
                  <span className="font-display text-3xl leading-none text-olive">{nights}</span>{" "}
                  <span className="text-sm text-muted">{t("nightsLabel", { count: nights })}</span>
                </output>
                <NightButton label={t("more")} disabled={nights >= MAX_NIGHTS} onClick={() => setNights(clampNights(nights + 1))} path="M12 6v12M6 12h12" />
              </div>
            </div>

            <fieldset>
              <legend className="font-bold text-ink">{t("type")}</legend>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {TRIP_TYPES.map((option) => (
                  <label key={option} className="cursor-pointer">
                    <input type="radio" name="trip-type" checked={type === option} onChange={() => setType(option)} className="peer sr-only" />
                    <span className="flex h-full flex-col items-center gap-2 rounded-2xl border border-line bg-card px-2 py-4 text-center text-sm font-bold text-ink transition hover:border-olive peer-checked:border-band-olive peer-checked:bg-band-olive peer-checked:text-on-dark peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-terra">
                      <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                        <path d={TYPE_ICON[option]} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {t(`types.${option}`)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="reveal">
          <div role="group" aria-label={t("chooseAssistant")} className="mb-3 flex gap-1.5 rounded-full border border-line bg-card p-1.5">
            {ASSISTANTS.map((a) => (
              <button
                key={a.key}
                type="button"
                aria-pressed={a.key === assistant.key}
                onClick={() => setAssistantKey(a.key)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-paper-2 aria-pressed:bg-band-olive aria-pressed:text-on-dark"
              >
                <AssistantLogo assistant={a.key} className="size-4 shrink-0" />
                {a.name}
              </button>
            ))}
          </div>

          {/* Una finestra amb l'aspecte de l'assistent triat, amb el text a punt d'enviar. */}
          <div data-assistant={assistant.key} className="trip-chat flex min-h-[27rem] flex-col rounded-[2rem] p-5 shadow-[0_30px_60px_-30px_rgb(35_42_20/.6)] sm:p-7">
            <div className="flex items-center gap-2.5 font-bold">
              <AssistantLogo assistant={assistant.key} className="size-6 text-[var(--chat-logo)]" />
              {assistant.name}
            </div>
            <p className="trip-greeting font-display mt-6 text-2xl sm:text-3xl">{t("greeting")}</p>

            <p aria-live="polite" className="mt-5 ml-auto max-w-[94%] rounded-3xl rounded-br-md bg-[var(--chat-bubble)] px-5 py-4 text-[0.95rem] leading-relaxed">
              {prompt}
            </p>

            <div className="mt-auto flex flex-wrap items-center justify-end gap-2 border-t border-[var(--chat-line)] pt-5 max-sm:mt-6">
              <button type="button" onClick={copy} className="rounded-full px-4 py-2.5 text-sm font-bold text-[var(--chat-muted)] transition hover:text-[var(--chat-fg)]">
                {copied ? t("copied") : t("copy")}
              </button>
              <a
                href={assistant.href(prompt)}
                target="_blank"
                rel="noopener"
                onClick={() => {
                  if (assistant.needsCopy) void copy();
                }}
                className="flex items-center gap-2 rounded-full bg-[var(--chat-accent)] px-5 py-2.5 text-sm font-bold text-[var(--chat-accent-fg)] transition hover:opacity-85"
              >
                {t("openIn", { name: assistant.name })}
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                  <path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NightButton({ label, disabled, onClick, path }: { label: string; disabled: boolean; onClick: () => void; path: string }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-10 place-items-center rounded-full border border-line text-olive transition hover:border-olive hover:bg-paper-2 disabled:opacity-35 disabled:hover:border-line disabled:hover:bg-transparent">
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
