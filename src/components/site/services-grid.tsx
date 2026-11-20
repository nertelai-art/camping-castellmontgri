import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import type { Section, Service } from "@/lib/supabase/content";
import { ExpandableText } from "./expandable-text";
import { SubpageHero } from "./subpage-hero";

/**
 * La pàgina d'instal·lacions: la capçalera de la secció i tots els serveis en targetes. Els que tenen foto la porten a dalt, amb la
 * icona a sobre; els que no, només la icona. La descripció, curta, es desplega amb «Llegir més».
 */
export async function ServicesGrid({ section, services }: { section: Section; services: Service[] }) {
  const t = await getTranslations("services");
  const withPhoto = services.filter((s) => s.media);
  const iconOnly = services.filter((s) => !s.media);
  return (
    <div id="services">
      <SubpageHero section={section} id="services-title" />
      <section aria-labelledby="services-list-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <h2 id="services-list-title" className="font-display text-4xl text-olive sm:text-5xl">
          {t("title")}
        </h2>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {withPhoto.map((s, i) => (
            <li key={s.slug} data-edit={`services:${s.slug}`} className="reveal group flex flex-col overflow-hidden rounded-3xl border border-line bg-card transition duration-300 hover:border-olive hover:shadow-[0_28px_44px_-24px_rgb(35_42_20/.4)]" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
              <div className="relative aspect-[16/10] overflow-hidden bg-paper-2">
                {s.media && <MediaImage media={s.media} alt="" fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
              </div>
              <div className="relative flex flex-1 flex-col px-5 pb-5 pt-9">
                <span className="absolute -top-7 left-5 grid size-14 place-items-center rounded-2xl bg-card shadow-md ring-1 ring-line">
                  {s.icon && <MediaImage media={s.icon} alt="" className="size-8" />}
                </span>
                <h3 data-edit-field="name" className="font-display text-2xl leading-tight text-olive">
                  {s.name}
                </h3>
                <div className="mt-2 flex flex-1 flex-col">
                  <ExpandableText field="description" text={s.description} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {iconOnly.length > 0 && (
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {iconOnly.map((s) => (
              <li key={s.slug} data-edit={`services:${s.slug}`} className="reveal flex gap-4 rounded-3xl bg-paper-2 p-5">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-card">{s.icon && <MediaImage media={s.icon} alt="" className="size-8" />}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 data-edit-field="name" className="font-display text-xl leading-tight text-olive">
                    {s.name}
                  </h3>
                  <div className="mt-1 flex flex-col text-sm">
                    <ExpandableText field="description" text={s.description} limit={110} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
