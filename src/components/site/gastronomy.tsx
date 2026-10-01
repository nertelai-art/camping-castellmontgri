import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { FoodShowcase, type FoodStepContent } from "@/components/scene/FoodShowcase";
import type { Restaurant, Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";
import { ShowOnMapButton } from "./show-on-map-button";

const ZONES = ["ombra", "panorama"] as const;

// Cada restaurant va al pas que li toca (menjar, gelats o beure) segons què és.
const ICECREAM = /helad|gelat|glacier|ice-cream/;
const DRINKS = /^bar-|barra|pub|disco|lera|cafeteria/;
function stepFor(slug: string): 0 | 1 | 2 {
  if (ICECREAM.test(slug)) return 1;
  if (DRINKS.test(slug)) return 2;
  return 0;
}

/** Gastronomia: la taula que es para amb les fotos dels restaurants (FoodShowcase) i, a sota, cada zona amb els seus locals. */
export async function Gastronomy({
  section,
  restaurants,
  onMap,
  index,
}: {
  section: Section;
  restaurants: Restaurant[];
  onMap: Set<string>;
  index: number;
}) {
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
    <section aria-labelledby="gastronomy-title" className="bg-blush py-24 text-ink lg:py-32">
      <div id="gastronomy">
        <FoodShowcase
          heading={
            <SectionHeading id="gastronomy-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} />
          }
          steps={steps}
          srDescription={t("sceneDescription")}
        />
      </div>
      <div className="cv mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

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
                      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-terra">
                        {r.menuUrl && (
                          <a href={r.menuUrl} target="_blank" rel="noopener" className="text-sm font-bold hover:underline">
                            {t("menu")} ↗
                          </a>
                        )}
                        {onMap.has(`restaurant:${r.slug}`) && <ShowOnMapButton target={{ type: "restaurant", slug: r.slug }} />}
                      </div>
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
