import { getTranslations } from "next-intl/server";
import type { MapPoint, Section } from "@/lib/supabase/content";
import { MapExplorer, type Place } from "./map-explorer";
import { SectionHeading } from "./section-heading";

/** Mapa interactiu: la maqueta 3D del càmping de fons, amb els punts de l'admin (taula map_points). En clicar-hi s'obre gran. */
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
    // Sense `overflow`, `transform` ni `contain`: el mapa obert és `position: fixed` i ha de sortir de la secció.
    <section data-edit="sections:map" id="map" aria-labelledby="map-title" className="bg-band-olive text-on-dark">
      <MapExplorer
        image={section.media}
        points={points}
        places={places}
        heading={<SectionHeading id="map-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} tone="dark" />}
      />
    </section>
  );
}
