import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import type { Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";

/** Plànol il·lustrat (fase 2: estàtic). A la fase 3 aquest bloc esdevé el visor interactiu. */
export async function MapTeaser({ section, index }: { section: Section; index: number }) {
  const t = await getTranslations("map");
  return (
    <section aria-labelledby="map-title" className="cv bg-band-olive py-24 text-on-dark lg:py-32">
      <div id="map" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading id="map-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} tone="dark" />
          <p className="rounded-full border border-on-dark/40 px-4 py-2 text-sm font-bold">{t("soon")}</p>
        </div>
        {section.media && (
          <a
            href={section.media.src}
            target="_blank"
            rel="noopener"
            className="reveal group relative mt-12 block overflow-hidden rounded-[2rem] ring-1 ring-on-dark/20"
          >
            <MediaImage
              media={section.media}
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="h-auto w-full transition duration-700 group-hover:scale-[1.03]"
            />
            <span className="absolute bottom-4 right-4 rounded-full bg-paper px-4 py-2 text-sm font-bold text-olive shadow-lg">
              {t("open")} ↗
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
