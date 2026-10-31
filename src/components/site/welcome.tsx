import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section } from "@/lib/supabase/content";
import { MontgriLine } from "./montgri-line";
import { WelcomeStage } from "./welcome-stage";

type Facts = { accommodations: number; restaurants: number; services: number; activities: number };

/**
 * Benvinguda: el text entre fotos i, amb el scroll, la foto del mig s'obre fins a omplir la pantalla, les altres fugen
 * cap als costats i hi apareixen les xifres (comptades del contingut, mai escrites a mà).
 * La primera foto de la galeria de la secció és la que s'obre; la resta, les del voltant. Es canvien des del panell.
 * Sense JS, amb moviment reduït o en una pantalla molt baixa, és un mosaic normal (`.welcome` a globals.css).
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
    <WelcomeStage data-edit="sections:welcome" id="welcome" aria-labelledby="welcome-title" className="welcome">
      <div className="welcome-stage">
        <div className="welcome-intro">
          <h2 id="welcome-title" data-edit-field="title" className="font-display text-4xl leading-[1.04] text-olive sm:text-5xl xl:text-6xl">
            {section.title}
          </h2>
          <RichText field="body" text={section.body} className="mt-5 grid gap-4 text-base leading-relaxed text-muted sm:text-lg [&_strong]:font-bold [&_strong]:text-ink" />
        </div>

        {/* La muntanya del footer, aquí com a paisatge: el text al cel, les fotos al davant i el castell a sobre de la foto que s'obre. */}
        <div className="welcome-ridge">
          <MontgriLine className="block h-full w-full text-olive/70" fillClassName="fill-paper-2" />
        </div>

        <ul aria-hidden="true" className="welcome-tiles">
          {around.slice(0, 6).map((photo, i) => (
            <li key={photo.path} className="welcome-tile" data-slot={i + 1}>
              <MediaImage media={photo} alt="" fill sizes="(min-width: 1024px) 22vw, 40vw" className="object-cover" />
            </li>
          ))}
        </ul>

        <div className="welcome-main">
          {main && (
            <div className="welcome-photo">
              <MediaImage media={main} fill sizes="100vw" className="object-cover" />
            </div>
          )}
          <div className="welcome-facts">
            <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
              {items.map(([value, label]) => (
                <div key={label} className="flex flex-col border-t border-on-dark/50 pt-4">
                  <dt className="order-2 mt-1 text-sm leading-snug text-on-dark sm:text-base">{label}</dt>
                  <dd data-count={value} className="font-display -order-1 text-6xl tabular-nums text-on-dark sm:text-7xl xl:text-8xl">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </WelcomeStage>
  );
}
