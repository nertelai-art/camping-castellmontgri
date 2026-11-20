import { getTranslations } from "next-intl/server";
import type { Activity, Section } from "@/lib/supabase/content";
import { ActivityExplorer } from "./activity-explorer";
import { SubpageHero } from "./subpage-hero";
import { WeekProgramme } from "./week-programme";

/** La pàgina d'animació: la capçalera de la secció, les activitats en targetes (filtrables per a qui són) i el programa de la setmana. */
export async function Entertainment({ section, activities }: { section: Section; activities: Activity[] }) {
  const t = await getTranslations("entertainment");
  return (
    <div id="entertainment">
      <SubpageHero section={section} id="entertainment-title" />
      <section aria-labelledby="activities-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 id="activities-title" className="font-display text-4xl text-olive sm:text-5xl">
          {t("activities")}
        </h2>
        <div className="mt-8">
          <ActivityExplorer activities={activities} />
        </div>
        <WeekProgramme />
      </section>
    </div>
  );
}
