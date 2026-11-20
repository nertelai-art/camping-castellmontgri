import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { FoodShowcase, type FoodStepContent } from "@/components/scene/FoodShowcase";
import type { Restaurant, Section } from "@/lib/supabase/content";
import { SubpageHero } from "./subpage-hero";

const ZONES = ["ombra", "panorama"] as const;

// Cada restaurant va al pas que li toca (menjar, gelats o beure) segons què és.
const ICECREAM = /helad|gelat|glacier|ice-cream/;
const DRINKS = /^bar-|barra|pub|disco|lera|cafeteria/;
function stepFor(slug: string): 0 | 1 | 2 {
  if (ICECREAM.test(slug)) return 1;
  if (DRINKS.test(slug)) return 2;
  return 0;
}

/**
 * La pàgina de gastronomia: la capçalera de la secció, la taula que es para amb les fotos dels locals (FoodShowcase) i, a sota,
 * cada zona amb els seus restaurants i bars en targetes (foto, horari, carta).
 */
export async function Gastronomy({ section, restaurants }: { section: Section; restaurants: Restaurant[] }) {
  const t = await getTranslations("gastronomy");
  // A cada pas, primer els llocs amb la foto més gran: són les que surten a taula.
  const steps: FoodStepContent[] = (["food", "icecream", "drinks"] as const).map((key, i) => ({
    title: t(`steps.${key}`),
    places: restaurants
      .filter((r) => stepFor(r.slug) === i)
      .toSorted((a, b) => (b.cover?.width ?? 0) - (a.cover?.width ?? 0))
      .map((r) => ({ name: r.name, image: r.cover })),
  }));
  return (
    <div id="gastronomy">
      <SubpageHero section={section} id="gastronomy-title" />
      <section aria-labelledby="gastronomy-places-title" className="py-16 lg:py-24">
        <FoodShowcase
          heading={
            <h2 id="gastronomy-places-title" className="font-display text-4xl text-olive sm:text-5xl">
              {t("places")}
            </h2>
          }
          steps={steps}
          srDescription={t("sceneDescription")}
        />
        <div className="cv mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {ZONES.map((zone) => {
            const items = restaurants.filter((r) => r.zone === zone);
            if (!items.length) return null;
            return (
              <div key={zone} className="mt-20">
                <h3 className="font-display flex items-baseline gap-4 text-3xl text-terra sm:text-4xl">
                  {t(`zone.${zone}`)}
                  <span aria-hidden="true" className="h-px flex-1 bg-line" />
                </h3>
                <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {items.map((r) => (
                    <li key={r.slug} data-edit={`restaurants:${r.slug}`} className="reveal group flex flex-col overflow-hidden rounded-3xl border border-line bg-card transition duration-300 hover:border-olive hover:shadow-[0_28px_44px_-24px_rgb(35_42_20/.4)]">
                      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                        {r.cover && <MediaImage media={r.cover} fill sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-5">
                        <h4 data-edit-field="name" className="font-display text-2xl leading-tight text-olive">
                          {r.name}
                        </h4>
                        {r.hours && (
                          <p className="flex items-start gap-1.5 text-sm font-bold text-terra">
                            <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" aria-hidden="true">
                              <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
                              <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span className="sr-only">{t("hours")}: </span>
                            <span data-edit-field="hours">{r.hours}</span>
                          </p>
                        )}
                        {r.menuUrl && (
                          <a href={r.menuUrl} target="_blank" rel="noopener" className="mt-auto self-start rounded-full border-2 border-olive px-4 py-1.5 text-sm font-bold text-olive transition hover:bg-olive hover:text-paper">
                            {t("menu")}
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
    </div>
  );
}
