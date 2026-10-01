import { getTranslations } from "next-intl/server";
import { Fragment } from "react";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { formatDayMonth } from "@/lib/content/format";
import type { Section, SiteSettings } from "@/lib/supabase/content";
import { MontgriLine } from "./montgri-line";

/** Hero: la foto aèria real del càmping, el titular i la reserva. El 3D viu a la secció del mapa. */
export async function Hero({ section, settings, locale }: { section: Section; settings: SiteSettings; locale: string }) {
  const t = await getTranslations("hero");
  const tNav = await getTranslations("nav");
  const words = section.title.split(" ");

  return (
    <section aria-labelledby="hero-title" className="relative px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="relative isolate flex min-h-[calc(100svh-5.5rem)] flex-col justify-end overflow-hidden rounded-[2rem] bg-band-olive text-on-dark lg:rounded-[2.5rem]">
        {section.media && (
          <MediaImage media={section.media} fill priority fetchPriority="high" sizes="100vw" className="ken-burns -z-10 object-cover" />
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(22_27_13/.15)_0%,rgb(22_27_13/.05)_35%,rgb(22_27_13/.78)_100%)]" />

        {settings.season.open && settings.season.close && (
          <p
            className="rise absolute right-4 top-4 grid size-28 rotate-6 place-content-center rounded-full border-2 border-dashed border-on-dark/70 bg-band-terra/90 p-3 text-center text-[0.68rem] font-bold uppercase leading-tight tracking-wider shadow-lg sm:right-8 sm:top-8 sm:size-36 sm:text-xs"
            style={{ ["--i" as string]: 4 }}
          >
            <span className="font-display text-2xl normal-case tracking-normal sm:text-3xl">{settings.season.open.slice(0, 4)}</span>
            {t("season")}
            <span className="mt-1 font-normal normal-case tracking-normal">
              {t("from", { open: formatDayMonth(settings.season.open, locale), close: formatDayMonth(settings.season.close, locale) })}
            </span>
          </p>
        )}

        <div className="relative px-5 pb-10 sm:px-10 sm:pb-14 lg:px-16 lg:pb-20">
          <h1 id="hero-title" className="font-display max-w-5xl text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.92]">
            {words.map((word, i) => (
              <Fragment key={i}>
                <span className="rise inline-block" style={{ ["--i" as string]: i }}>
                  {word}
                </span>
                {i < words.length - 1 && " "}
              </Fragment>
            ))}
          </h1>
          <div className="rise mt-6 max-w-xl text-lg text-on-dark/90 sm:text-xl" style={{ ["--i" as string]: words.length }}>
            <RichText text={section.body} />
          </div>
          <div className="rise mt-8 flex flex-wrap items-center gap-4" style={{ ["--i" as string]: words.length + 1 }}>
            {settings.bookingUrl && (
              <a
                href={settings.bookingUrl}
                target="_blank"
                rel="noopener"
                className="rounded-full bg-band-terra px-7 py-3.5 font-bold text-on-dark transition hover:brightness-110"
              >
                {section.ctaLabel ?? tNav("book")}
              </a>
            )}
            <a href="#welcome" className="group inline-flex items-center gap-2 font-bold text-on-dark">
              {t("discover")}
              <span aria-hidden="true" className="transition group-hover:translate-y-1">
                ↓
              </span>
            </a>
          </div>
        </div>
        <MontgriLine className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full text-on-dark/60 sm:h-24" />
      </div>
    </section>
  );
}
