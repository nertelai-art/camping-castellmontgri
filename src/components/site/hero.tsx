import { getTranslations } from "next-intl/server";
import { Fragment } from "react";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section, SiteSettings } from "@/lib/supabase/content";
import { BookingBar } from "./booking-bar";

/** Hero: la foto aèria real del càmping amb el titular i la cerca de reserva al mig. */
export async function Hero({ section, settings }: { section: Section; settings: SiteSettings }) {
  const t = await getTranslations("hero");
  const words = section.title.split(" ");

  return (
    // z-20: els panells de la cerca surten per sobre de la secció següent.
    <section data-edit="sections:hero" aria-labelledby="hero-title" className="relative z-20 px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative isolate flex min-h-[calc(100svh-6.5rem)] flex-col items-center justify-center rounded-[2rem] bg-band-olive text-center text-on-dark lg:rounded-[2.5rem]">
        {/* El retall va només a la foto: si anés al contenidor, tallaria els panells de la cerca. */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
          {section.media && <MediaImage media={section.media} fill priority fetchPriority="high" sizes="100vw" className="ken-burns object-cover" />}
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(22_27_13/.55)_0%,rgb(22_27_13/.42)_55%,rgb(22_27_13/.3)_100%)]" />
        </div>

        <div className="flex w-full flex-col items-center px-4 py-16 sm:px-10">
          <h1 id="hero-title" data-edit-field="title" className="font-display max-w-4xl text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.98]">
            {words.map((word, i) => (
              <Fragment key={i}>
                <span className="rise inline-block" style={{ ["--i" as string]: i }}>
                  {word}
                </span>
                {i < words.length - 1 && " "}
              </Fragment>
            ))}
          </h1>
          <div className="rise mt-4 max-w-2xl text-lg text-on-dark sm:text-xl" style={{ ["--i" as string]: words.length }}>
            <RichText field="body" text={section.body} />
          </div>
          {/* Sense `.rise`: un `transform` aquí faria que la làmina del mòbil (position: fixed) es col·loqués respecte d'aquest bloc. */}
          {settings.bookingUrl && (
            <div className="mt-8 flex w-full justify-center">
              <BookingBar bookingUrl={settings.bookingUrl} />
            </div>
          )}
        </div>

        <a href="#welcome" className="group absolute bottom-5 inline-flex items-center gap-2 font-bold text-on-dark max-sm:hidden">
          {t("discover")}
          <span aria-hidden="true" className="transition group-hover:translate-y-1">
            ↓
          </span>
        </a>
      </div>
    </section>
  );
}
