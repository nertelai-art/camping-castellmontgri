import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section } from "@/lib/supabase/content";

type Facts = { accommodations: number; restaurants: number; services: number; activities: number };

/** Benvinguda + xifres. Les xifres es compten a partir del contingut: mai números escrits a mà. */
export async function Welcome({ section, facts }: { section: Section; facts: Facts }) {
  const t = await getTranslations("facts");
  const items = [
    [facts.accommodations, t("accommodations")],
    [facts.restaurants, t("restaurants")],
    [facts.services, t("services")],
    [facts.activities, t("activities")],
  ] as const;

  return (
    <section data-edit="sections:welcome" id="welcome" aria-labelledby="welcome-title" className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-32">
      <div className="reveal lg:col-span-7">
        <h2 id="welcome-title" className="font-display text-4xl leading-tight text-olive sm:text-5xl">
          {section.title}
        </h2>
        <RichText text={section.body} className="mt-6 grid gap-4 text-xl leading-relaxed text-muted [&_strong]:font-bold [&_strong]:text-ink" />
        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {items.map(([value, label]) => (
            <div key={label} className="flex flex-col border-t-2 border-olive pt-3">
              <dt className="order-2 text-sm leading-snug text-muted">{label}</dt>
              <dd className="font-display -order-1 text-5xl text-terra">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {section.media && (
        <figure className="reveal relative lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem] shadow-[0_30px_60px_-30px_rgb(35_42_20/.6)]">
            <MediaImage media={section.media} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          </div>
        </figure>
      )}
    </section>
  );
}
