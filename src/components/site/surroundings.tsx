import { MediaImage } from "@/components/media-image";
import type { Section } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { SubpageHero } from "./subpage-hero";

/** La pàgina d'entorn: la capçalera amb la foto aèria de les Medes i, a sota, totes les fotos de l'entorn en un mosaic. */
export async function Surroundings({ section, photos }: { section: Section; photos: MediaRef[] }) {
  const mosaic = photos.length >= 5;
  return (
    <div id="surroundings">
      <SubpageHero section={section} id="surroundings-title" />
      {photos.length > 0 && (
        // Amb cinc fotos o més, mosaic (una de gran cada cinc); amb menys, totes iguals en una fila, perquè no quedi cap forat.
        <ul className={`mx-auto grid max-w-7xl gap-3 px-4 py-16 sm:px-6 lg:px-8 lg:py-24 ${mosaic ? "grid-cols-2 lg:grid-cols-4" : ["", "sm:grid-cols-1", "sm:grid-cols-2", "sm:grid-cols-3", "sm:grid-cols-2 lg:grid-cols-4"][photos.length]}`}>
          {photos.map((p, i) => {
            const big = mosaic && i % 5 === 0;
            return (
              <li key={p.path} className={`reveal group relative overflow-hidden rounded-3xl bg-paper-2 ${big ? "col-span-2 row-span-2 aspect-square" : "aspect-[4/5]"}`}>
                <MediaImage media={p} fill sizes={big ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"} className="object-cover transition duration-700 group-hover:scale-105" />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
