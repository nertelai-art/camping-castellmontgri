"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Section, SiteSettings } from "@/lib/supabase/content";

// Com es va a Google Maps (`travelmode`), amb la seva icona (traç de 24 px).
const MODES = [
  { key: "driving", label: "car", icon: "M5 16h14M6.5 16v2M17.5 16v2M4 16v-3.5l2-5.5a2 2 0 0 1 1.9-1.3h8.2A2 2 0 0 1 18 7l2 5.5V16M4.5 12h15M7.5 14h.01M16.5 14h.01" },
  { key: "transit", label: "transit", icon: "M6 16V6.5A2.5 2.5 0 0 1 8.5 4h7A2.5 2.5 0 0 1 18 6.5V16a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16zM6 11h12M9 14.5h.01M15 14.5h.01M8.5 17.5 7 20M15.5 17.5 17 20" },
  { key: "bicycling", label: "bike", icon: "M6 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM18 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6 14.5 9.5 8H15l3 6.5M8.5 8H11M12 14.5 15 8" },
  { key: "walking", label: "walk", icon: "M13 6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM10 21l2.5-6-2-2.5.8-4 2.7 1 1.5 2.5H18M8 12l.8-3.5 2.5-.5M14.5 15.5 16 21" },
] as const;

/**
 * Com arribar-hi: el formulari de la ruta i el mapa, un al costat de l'altre. La ruta és un formulari normal cap a Google Maps: va sense JS i no passa per
 * cap servidor nostre. El mapa és una imatge nostra (`public/map/zona.webp`, `scripts/build-directions-map.py`): surt a l'instant i, en visitar la web,
 * no es demana res a cap servidor de tercers. El càmping és al centre exacte de la imatge i l'agulla hi va a sobre. En clicar-hi s'obre a Google Maps,
 * que és on la gent busca com arribar. Les dades del mapa són d'OpenStreetMap: la seva llicència demana l'atribució, i va petita al racó.
 */
export function Directions({ section, settings }: { section: Section; settings: SiteSettings }) {
  const t = useTranslations("directions");
  const { address, geo, phone, emails } = settings;
  const destination = geo ? `${geo.lat},${geo.lng}` : [address.street, address.locality].filter(Boolean).join(", ");
  const mapUrl = geo ? `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}` : null;

  return (
    <section data-edit="sections:directions" aria-labelledby="directions-title" className="cv mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div id="directions">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-5">
          <div className="reveal rounded-[1.75rem] border border-line bg-card p-6 text-ink sm:p-8">
            {section.eyebrow && (
              <p data-edit-field="eyebrow" className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-terra">
                {section.eyebrow}
              </p>
            )}
            <h2 id="directions-title" data-edit-field="title" className="font-display text-4xl leading-[1.04] text-olive sm:text-5xl">
              {section.title}
            </h2>
            <address className="mt-3 not-italic text-muted">
              {address.street}, {[address.postalCode, address.locality].filter(Boolean).join(" ")}
              {address.region && `, ${address.region}`}
            </address>

            <form action="https://www.google.com/maps/dir/" target="_blank" className="mt-6 grid gap-3">
              <input type="hidden" name="api" value="1" />
              <input type="hidden" name="destination" value={destination} />
              <fieldset>
                <legend className="sr-only">{t("mode")}</legend>
                <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-paper-2 p-1.5">
                  {MODES.map((mode, i) => (
                    <label key={mode.key} className="cursor-pointer" title={t(`modes.${mode.label}`)}>
                      <input type="radio" name="travelmode" value={mode.key} defaultChecked={i === 0} className="peer sr-only" />
                      <span className="flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-xs font-bold text-muted transition peer-checked:bg-card peer-checked:text-olive peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-terra">
                        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                          <path d={mode.icon} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {t(`modes.${mode.label}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="block rounded-2xl border border-line px-4 py-2.5 transition focus-within:border-olive">
                <span className="block text-xs font-bold text-olive">{t("from")}</span>
                <input name="origin" autoComplete="off" placeholder={t("fromPlaceholder")} className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none" />
              </label>
              <button type="submit" className="flex items-center justify-center gap-2 rounded-full bg-band-olive px-6 py-3.5 font-bold text-on-dark transition hover:brightness-125">
                {t("route")}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm font-bold text-olive">
              {phone?.e164 && (
                <a href={`tel:${phone.e164}`} className="underline-offset-4 hover:underline">
                  {phone.display}
                </a>
              )}
              {emails.info && (
                <a href={`mailto:${emails.info}`} className="underline-offset-4 hover:underline">
                  {t("email")}
                </a>
              )}
            </div>
          </div>

          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener"
              aria-label={t("openMap")}
              className="reveal group relative block min-h-[22rem] overflow-hidden rounded-[1.75rem] border border-line bg-paper-2"
            >
              <Image
                src="/map/zona.webp"
                alt={t("mapTitle")}
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              {/* L'agulla, al centre: el càmping és el centre de la imatge. */}
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full drop-shadow-lg">
                <svg viewBox="0 0 32 42" className="h-12 w-9">
                  <path d="M16 41s14-13.6 14-25A14 14 0 0 0 2 16c0 11.4 14 25 14 25z" fill="var(--band-olive)" stroke="white" strokeWidth="2.5" />
                  <circle cx="16" cy="16" r="5.5" fill="white" />
                </svg>
              </span>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-card px-5 py-2.5 text-sm font-bold text-olive shadow-xl transition group-hover:scale-105">
                {t("openMap")}
              </span>
              <span className="absolute bottom-1 right-2 text-[10px] text-ink/55">© OpenStreetMap</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
