"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MediaImage } from "@/components/media-image";
import type { SiteSettings } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { SectionHeading } from "./section-heading";

/**
 * Com arribar-hi: l'adreça, la ruta a Google Maps i el contacte. El mapa és d'OpenStreetMap i només es carrega si es demana:
 * un iframe de tercers no ha d'entrar a la càrrega de la pàgina ni avisar ningú que s'hi ha passat.
 */
export function Directions({ settings, photo, index }: { settings: SiteSettings; photo: MediaRef | null; index: number }) {
  const t = useTranslations("directions");
  const [showMap, setShowMap] = useState(false);
  const { address, geo, phone, emails } = settings;
  const destination = geo ? `${geo.lat},${geo.lng}` : [address.street, address.locality].filter(Boolean).join(", ");
  const delta = 0.012;
  const mapSrc = geo
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${geo.lng - delta},${geo.lat - delta},${geo.lng + delta},${geo.lat + delta}&layer=mapnik&marker=${geo.lat},${geo.lng}`
    : null;

  return (
    <section aria-labelledby="directions-title" className="cv mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div id="directions" className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading id="directions-title" index={index} eyebrow={t("eyebrow")} title={t("title")} />
          <address className="reveal mt-6 text-lg not-italic text-muted">
            {address.street}
            <br />
            {[address.postalCode, address.locality].filter(Boolean).join(" ")}
            {address.region && `, ${address.region}`}
          </address>
          <div className="reveal mt-7 flex flex-wrap gap-3">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`}
              target="_blank"
              rel="noopener"
              className="rounded-full bg-band-olive px-6 py-3 font-bold text-on-dark transition hover:brightness-125"
            >
              {t("route")} <span aria-hidden="true">→</span>
            </a>
            {phone?.e164 && (
              <a href={`tel:${phone.e164}`} className="rounded-full border border-line px-6 py-3 font-bold text-olive transition hover:border-olive">
                {phone.display}
              </a>
            )}
            {emails.info && (
              <a href={`mailto:${emails.info}`} className="rounded-full border border-line px-6 py-3 font-bold text-olive transition hover:border-olive">
                {t("email")}
              </a>
            )}
          </div>
        </div>

        <div className="reveal relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-paper-2">
          {showMap && mapSrc ? (
            <iframe src={mapSrc} title={t("mapTitle")} loading="lazy" className="absolute inset-0 size-full border-0" />
          ) : (
            <>
              {photo && <MediaImage media={photo} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />}
              {mapSrc && (
                <div className="absolute inset-0 grid place-items-center bg-[rgb(22_27_13/.3)]">
                  <button type="button" onClick={() => setShowMap(true)} className="rounded-full bg-card px-6 py-3 font-bold text-olive shadow-xl transition hover:scale-105">
                    {t("showMap")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
