import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import type { Restaurant, Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";

const ZONES = ["ombra", "panorama"] as const;

/** Gastronomia (fase 2: estàtica). A la fase 4 hi entren les escenes 3D del plat i el gelat. */
export async function Gastronomy({ section, restaurants, index }: { section: Section; restaurants: Restaurant[]; index: number }) {
  const t = await getTranslations("gastronomy");
  return (
    <section aria-labelledby="gastronomy-title" className="cv bg-blush py-24 text-ink lg:py-32">
      <div id="gastronomy" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-10 lg:grid-cols-2">
          <SectionHeading id="gastronomy-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} />
          {section.media && (
            <div className="reveal relative aspect-[5/4] overflow-hidden rounded-[2rem] lg:-mb-6 lg:rotate-2">
              <MediaImage media={section.media} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            </div>
          )}
        </div>

        {ZONES.map((zone) => {
          const items = restaurants.filter((r) => r.zone === zone);
          if (!items.length) return null;
          return (
            <div key={zone} className="mt-20">
              <h3 className="font-display flex items-baseline gap-4 text-3xl text-terra">
                {t(`zone.${zone}`)}
                <span aria-hidden="true" className="h-px flex-1 bg-terra/30" />
              </h3>
              <ul className="snap-strip mt-6 auto-cols-[78%] gap-5 pb-4 sm:auto-cols-[45%] lg:auto-cols-[calc((100%-3.75rem)/4)]">
                {items.map((r) => (
                  <li key={r.slug} className="reveal flex flex-col overflow-hidden rounded-3xl bg-card shadow-[0_20px_40px_-30px_rgb(35_42_20/.6)]">
                    <div className="relative aspect-square">
                      {r.cover && <MediaImage media={r.cover} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 78vw" className="object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <h4 className="font-display text-2xl leading-tight text-olive">{r.name}</h4>
                      {r.hours && (
                        <p className="text-sm text-muted">
                          <span className="sr-only">{t("hours")}: </span>
                          {r.hours}
                        </p>
                      )}
                      {r.menuUrl && (
                        <a href={r.menuUrl} target="_blank" rel="noopener" className="mt-auto pt-2 text-sm font-bold text-terra hover:underline">
                          {t("menu")} ↗
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
