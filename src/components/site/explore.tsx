import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { Link } from "@/i18n/navigation";
import type { Section } from "@/lib/supabase/content";
import { SectionHeading } from "./section-heading";

/** El que té pàgina pròpia, a la portada: foto, títol, una descripció curta (el text de la secció, tallat) i l'enllaç. Una foto a cada banda, alternant. */
export async function Explore({ items, index }: { items: { href: string; section: Section }[]; index: number }) {
  const t = await getTranslations("explore");
  if (!items.length) return null;
  return (
    <section aria-labelledby="explore-title" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
      <SectionHeading id="explore-title" index={index} eyebrow={t("eyebrow")} title={t("title")} />
      <ul className="mt-12 grid gap-12 lg:gap-16">
        {items.map(({ href, section }, i) => (
          <li key={href} data-edit={`sections:${section.key}`} className="reveal grid items-center gap-6 lg:grid-cols-2 lg:gap-14">
            <Link href={href} tabIndex={-1} aria-hidden="true" className={`group relative block aspect-[16/10] overflow-hidden rounded-[2rem] bg-paper-2 ${i % 2 ? "lg:order-2" : ""}`}>
              {section.media && <MediaImage media={section.media} alt="" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />}
            </Link>
            <div>
              <h3 data-edit-field="title" className="font-display text-3xl leading-tight text-olive sm:text-4xl">
                {section.title}
              </h3>
              <RichText field="body" text={section.body} className="mt-4 line-clamp-4 text-lg leading-relaxed text-muted [&_strong]:text-ink" />
              <Link href={href} className="mt-6 inline-flex items-center gap-2 rounded-full bg-band-olive px-6 py-3 font-bold text-on-dark transition hover:brightness-125">
                {t("cta")}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
