import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section, Service } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";
import { ShowOnMapButton } from "./show-on-map-button";

/** Serveis: graella d'icones; cada un es desplega (details) per llegir-ne el detall sense sortir de la pàgina. */
export async function ServicesGrid({
  section,
  services,
  onMap,
  index,
}: {
  section: Section;
  services: Service[];
  onMap: Set<string>;
  index: number;
}) {
  const t = await getTranslations("services");
  return (
    <section data-edit="sections:services" aria-labelledby="services-title" className="cv mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div id="services" className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading id="services-title" index={index} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s.slug} data-edit={`services:${s.slug}`} className="reveal">
              <details className="group h-full rounded-2xl border border-line bg-card transition open:bg-paper-2 hover:border-olive">
                <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-paper-2 group-open:bg-card">
                    {s.icon && <MediaImage media={s.icon} alt="" className="size-8 dark:invert" />}
                  </span>
                  <span className="flex-1 font-bold text-ink">{s.name}</span>
                  <span aria-hidden="true" className="text-xl text-olive transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                {s.description && <RichText text={s.description} className="grid gap-3 px-4 pb-3 text-sm leading-relaxed text-muted [&_strong]:text-ink" />}
                {onMap.has(`service:${s.slug}`) && <ShowOnMapButton target={{ type: "service", slug: s.slug }} className="mx-4 mb-4 text-terra" />}
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
