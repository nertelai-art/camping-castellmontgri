import { getTranslations } from "next-intl/server";
import type { MapPoint, Section } from "@/lib/supabase/content";
import { MapExplorer, type Place } from "./map-explorer";
import { SectionHeading } from "./section-heading";

/** Mapa interactiu: la maqueta 3D del càmping amb els punts de l'admin (taula map_points) i la llegenda. */
export async function MapSection({
  section,
  points,
  places,
  index,
}: {
  section: Section;
  points: MapPoint[];
  places: Record<string, Place>;
  index: number;
}) {
  const t = await getTranslations("map");
  if (!section.media) return null;
  return (
    <section aria-labelledby="map-title" className="bg-band-olive py-24 text-on-dark lg:py-32">
      <div id="map" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading id="map-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} tone="dark" />
        <MapExplorer image={section.media} points={points} places={places} />
      </div>
    </section>
  );
}
