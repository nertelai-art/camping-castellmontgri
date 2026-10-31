import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { Link } from "@/i18n/navigation";
import type { Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";

/** Les seccions que tenen pàgina pròpia, a la portada només com a tres portes grans: la foto, el títol i cap text. */
export async function Explore({ items, index }: { items: { href: string; section: Section }[]; index: number }) {
  const t = await getTranslations("explore");
  if (!items.length) return null;
  return (
    <section aria-labelledby="explore-title" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <SectionHeading id="explore-title" index={index} eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {items.map(({ href, section }) => {
          const photo = section.media ?? section.gallery[0];
          return (
            <li key={href} className="reveal">
              <Link href={href} className="group relative isolate flex aspect-[16/11] flex-col justify-end overflow-hidden rounded-[2rem] bg-band-olive p-6 text-on-dark md:aspect-[4/5] lg:p-8">
                {photo && <MediaImage media={photo} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="-z-10 object-cover transition duration-700 group-hover:scale-105" />}
                <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(22_27_13/0)_35%,rgb(22_27_13/.78)_100%)]" />
                <span className="font-display text-3xl leading-tight lg:text-4xl">{section.title}</span>
                <span className="mt-2 inline-flex items-center gap-2 font-bold">
                  {t("cta")}
                  <span aria-hidden="true" className="transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
