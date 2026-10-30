import { getTranslations } from "next-intl/server";
import { Fragment } from "react";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section, SiteSettings } from "@/lib/supabase/content";
import { BookingBar } from "./booking-bar";

/** Hero: l'avís de temporada, la foto aèria real del càmping, el titular i la cerca de reserva. */
export async function Hero({ section, settings }: { section: Section; settings: SiteSettings }) {
  const t = await getTranslations("hero");
  const words = section.title.split(" ");

  return (
    <section data-edit="sections:hero" aria-labelledby="hero-title" className="relative px-3 pt-3 sm:px-4 sm:pt-4">
      {settings.season.notice && (
        <p className="font-display mb-3 rounded-[1.5rem] bg-paper-2 px-5 py-3 text-center text-lg text-olive sm:text-2xl">{settings.season.notice}</p>
      )}
      <div className="relative isolate flex min-h-[calc(100svh-10rem)] flex-col items-center justify-end overflow-hidden rounded-[2rem] bg-band-olive text-center text-on-dark lg:rounded-[2.5rem]">
        {section.media && (
          <MediaImage media={section.media} fill priority fetchPriority="high" sizes="100vw" className="ken-burns -z-10 object-cover" />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(22_27_13/.1)_0%,rgb(22_27_13/.3)_30%,rgb(22_27_13/.62)_55%,rgb(22_27_13/.8)_100%)]" />

        <div className="relative flex w-full flex-col items-center px-4 pb-8 pt-20 sm:px-10 sm:pb-12 lg:pb-14">
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
          {settings.bookingUrl && (
            <div className="rise mt-7 flex w-full justify-center" style={{ ["--i" as string]: words.length + 1 }}>
              <BookingBar bookingUrl={settings.bookingUrl} />
            </div>
          )}
          <a href="#welcome" className="rise group mt-5 inline-flex items-center gap-2 font-bold text-on-dark" style={{ ["--i" as string]: words.length + 2 }}>
            {t("discover")}
            <span aria-hidden="true" className="transition group-hover:translate-y-1">
              ↓
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
