import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import type { Activity, Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";

const AUDIENCES = ["children", "family", "adult"] as const;

export async function Entertainment({ section, activities, index }: { section: Section; activities: Activity[]; index: number }) {
  const t = await getTranslations("entertainment");
  return (
    <section data-edit="sections:entertainment" aria-labelledby="entertainment-title" className="cv bg-band-terra py-24 text-on-dark lg:py-32">
      <div id="entertainment" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <SectionHeading id="entertainment-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} tone="dark" />
          {section.media && (
            <div className="reveal relative aspect-[4/3] overflow-hidden rounded-[2rem] lg:-rotate-2">
              <MediaImage media={section.media} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
            </div>
          )}
        </div>
        <div className="mt-16 grid gap-10 lg:grid-cols-3">
          {AUDIENCES.map((audience) => {
            const items = activities.filter((a) => a.audience === audience);
            if (!items.length) return null;
            return (
              <div key={audience} className="reveal">
                <h3 className="font-display border-b border-on-dark/30 pb-3 text-3xl">{t(`audience.${audience}`)}</h3>
                <ul className="mt-4 grid gap-3">
                  {items.map((a) => (
                    <li key={a.slug} data-edit={`activities:${a.slug}`} className="flex items-center gap-4">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-on-dark/40">
                        {a.cover && <MediaImage media={a.cover} alt="" fill sizes="64px" className="object-cover" />}
                      </div>
                      <div>
                        <p data-edit-field="name" className="font-bold">{a.name}</p>
                        {a.hours && <p data-edit-field="hours" className="text-sm text-on-dark">{a.hours}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
