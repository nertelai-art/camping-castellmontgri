import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section } from "@/lib/supabase/content";
import { MontgriLine } from "./montgri-line";

type Facts = { accommodations: number; restaurants: number; services: number; activities: number };

/**
 * Benvinguda: el text entre fotos, amb la carena del Montgrí de paisatge, i a sota les xifres (comptades del contingut, mai escrites a mà).
 * La primera foto de la galeria de la secció és la del mig; la resta, les del voltant. Es canvien des del panell. La composició és a `.welcome` (globals.css).
 */
export async function Welcome({ section, facts }: { section: Section; facts: Facts }) {
  const t = await getTranslations("facts");
  const items = [
    [facts.accommodations, t("accommodations")],
    [facts.restaurants, t("restaurants")],
    [facts.services, t("services")],
    [facts.activities, t("activities")],
  ] as const;
  const [main = section.media, ...around] = section.gallery;

  return (
    <section data-edit="sections:welcome" id="welcome" aria-labelledby="welcome-title" className="welcome">
      <div className="welcome-stage">
        <div className="welcome-intro">
          <h2 id="welcome-title" data-edit-field="title" className="font-display text-4xl leading-[1.04] text-olive sm:text-5xl xl:text-6xl">
            {section.title}
          </h2>
          <RichText field="body" text={section.body} className="mt-5 grid gap-4 text-base leading-relaxed text-muted sm:text-lg [&_strong]:font-bold [&_strong]:text-ink" />
        </div>

        <div className="welcome-ridge">
          <MontgriLine className="block h-full w-full text-olive/70" fillClassName="fill-paper-2" />
        </div>

        <div className="welcome-photos">
          {main && (
            <div className="welcome-main">
              <MediaImage media={main} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
            </div>
          )}
          {around.slice(0, 6).map((photo, i) => (
            <div key={photo.path} aria-hidden="true" className="welcome-tile" data-slot={i + 1}>
              <MediaImage media={photo} alt="" fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-paper-2 px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-20">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {items.map(([value, label]) => (
            <div key={label} className="flex flex-col border-t border-olive/40 pt-4">
              <dt className="order-2 mt-1 text-sm leading-snug text-muted sm:text-base">{label}</dt>
              <dd className="font-display -order-1 text-5xl tabular-nums text-olive sm:text-6xl">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
