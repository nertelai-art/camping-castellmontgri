import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import type { Section } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { SectionHeading } from "./section-heading";

/** Entorn: foto aèria de les Medes a sang i un mosaic amb les fotos de platges, cultura i Tossa. */
export async function Surroundings({ section, photos, index }: { section: Section; photos: MediaRef[]; index: number }) {
  const t = await getTranslations("surroundings");
  return (
    <section data-edit="sections:surroundings" aria-labelledby="surroundings-title" className="cv py-24 lg:py-32">
      <div id="surroundings" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="surroundings-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} />
      </div>
      <div className="mt-14 grid gap-3 px-3 sm:px-4 lg:grid-cols-4 lg:grid-rows-2">
        {section.media && (
          <div className="reveal relative aspect-[16/10] overflow-hidden rounded-[2rem] lg:col-span-3 lg:row-span-2 lg:aspect-auto">
            <MediaImage media={section.media} fill sizes="(min-width: 1024px) 75vw, 100vw" className="object-cover" />
          </div>
        )}
        {photos.slice(0, 2).map((p) => (
          <div key={p.path} className="reveal relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <MediaImage media={p} fill sizes="(min-width: 1024px) 25vw, 100vw" className="object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}
