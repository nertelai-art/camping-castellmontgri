import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { Link } from "@/i18n/navigation";
import type { Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";

const SHOWN = 5;

/** La galeria a la portada: cinc fotos que porten a la pàgina amb totes. */
export async function GalleryPreview({ section, index }: { section: Section; index: number }) {
  const t = await getTranslations("gallery");
  const photos = section.gallery.slice(0, SHOWN);
  if (!photos.length) return null;
  return (
    <section data-edit="sections:gallery" aria-labelledby="gallery-title" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div id="image-gallery">
        <SectionHeading id="gallery-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} />
      </div>
      <Link href="/gallery" aria-label={t("all", { count: section.gallery.length })} className="group reveal mt-10 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4 lg:grid-rows-2">
        {photos.map((photo, i) => (
          <span key={photo.path} className={`relative block overflow-hidden rounded-2xl bg-paper-2 ${i === 0 ? "col-span-2 aspect-[16/10] lg:row-span-2 lg:aspect-auto" : "aspect-[4/3]"}`}>
            <MediaImage media={photo} alt="" fill sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"} className="object-cover transition duration-700 group-hover:scale-105" />
          </span>
        ))}
      </Link>
      <p className="mt-5 text-right">
        <Link href="/gallery" className="font-bold text-olive underline underline-offset-4">
          {t("all", { count: section.gallery.length })} <span aria-hidden="true">→</span>
        </Link>
      </p>
    </section>
  );
}
