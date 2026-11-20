import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { Link } from "@/i18n/navigation";
import type { Section } from "@/lib/supabase/content";
import { ExploreParallax } from "./explore-parallax";
import { SectionHeading } from "./section-heading";

/**
 * El que té pàgina pròpia, a la portada: foto, títol, una descripció curta (el text de la secció, tallat) i l'enllaç. Una foto a cada banda, alternant.
 * En arribar-hi, la foto s'obre des del centre i s'aparta el zoom, i el text puja línia a línia; en baixar, la foto es mou més a poc a poc que la
 * pàgina (`ExploreParallax`). Tot és a `.explore-*` (globals.css) i, amb moviment reduït, surt quiet i sencer.
 */
export async function Explore({ section, items }: { section: Section; items: { href: string; section: Section }[] }) {
  const t = await getTranslations("explore");
  return (
    <section aria-labelledby="explore-title" className="explore mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <div data-edit="sections:explore">
        <SectionHeading id="explore-title" eyebrow={section.eyebrow} title={section.title} body={section.body} highlight={section.highlight} />
      </div>
      <ul className="mt-14 grid gap-16 lg:mt-20 lg:gap-28">
        {items.map(({ href, section }, i) => (
          <li key={href} data-edit={`sections:${section.key}`} className="explore-item reveal group grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
            <Link
              href={href}
              tabIndex={-1}
              aria-hidden="true"
              className={`explore-media relative block aspect-[16/11] overflow-hidden rounded-[2rem] bg-paper-2 lg:col-span-7 ${i % 2 ? "lg:order-2 lg:col-start-6" : ""}`}
            >
              <span data-parallax className="explore-photo absolute -inset-y-[8%] inset-x-0 block">
                {section.media && <MediaImage media={section.media} alt="" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" />}
              </span>
            </Link>
            <div className={`explore-copy lg:col-span-5 ${i % 2 ? "lg:order-1 lg:col-start-1" : ""}`}>
              <span aria-hidden="true" className="explore-rule block h-0.5 w-14 origin-left bg-terra" />
              <h3 data-edit-field="title" className="font-display mt-6 text-3xl leading-tight text-olive transition-colors duration-300 group-hover:text-terra sm:text-4xl lg:text-5xl" style={{ ["--d" as string]: 1 }}>
                {section.title}
              </h3>
              <div style={{ ["--d" as string]: 2 }}>
                <RichText field="body" text={section.body} className="mt-5 line-clamp-4 text-lg leading-relaxed text-muted [&_strong]:text-ink" />
              </div>
              <div style={{ ["--d" as string]: 3 }}>
                <Link href={href} className="explore-cta relative mt-8 inline-flex overflow-hidden rounded-full border-2 border-band-olive px-7 py-3 font-bold text-band-olive">
                  <span className="relative z-10">{t("cta")}</span>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <ExploreParallax />
    </section>
  );
}
