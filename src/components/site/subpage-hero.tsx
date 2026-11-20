import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section } from "@/lib/supabase/content";

/**
 * La capçalera de les pàgines del web (instal·lacions, animació, gastronomia, entorn, galeria): la ruta, la foto de la secció en gran
 * amb el títol a sobre, i a sota el text i la frase destacada. Sense foto, el títol va sol. Tot surt de la secció i s'edita al panell.
 */
export async function SubpageHero({ section, id }: { section: Section; id: string }) {
  const [t, locale] = await Promise.all([getTranslations("accommodation"), getLocale()]);
  const eyebrow = section.eyebrow && (
    <p data-edit-field="eyebrow" className="text-xs font-bold uppercase tracking-[0.22em]">
      {section.eyebrow}
    </p>
  );
  const title = (className: string) => (
    <h1 id={id} data-edit-field="title" className={`font-display leading-[1.02] ${className}`}>
      {section.title}
    </h1>
  );

  return (
    <header data-edit={`sections:${section.key}`} className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <nav aria-label={t("breadcrumb")} className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-2">
          <li>
            <Link href={`/${locale}`} className="hover:text-olive hover:underline">
              {t("home")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-bold text-ink">
            {section.title}
          </li>
        </ol>
      </nav>

      {section.media ? (
        <div className="subpage-hero relative mt-5 aspect-[4/5] overflow-hidden rounded-[2rem] sm:aspect-[16/9] lg:aspect-[21/8]">
          <MediaImage media={section.media} alt="" fill priority sizes="(min-width: 1280px) 1240px, 100vw" className="subpage-hero-photo object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10 lg:p-14">
            {eyebrow}
            {title("mt-3 text-5xl sm:text-6xl lg:text-7xl")}
          </div>
        </div>
      ) : (
        <div className="mt-8 text-terra">
          {eyebrow}
          {title("mt-3 text-5xl text-olive sm:text-6xl")}
        </div>
      )}

      {(section.body || section.highlight) && (
        <div className="reveal mt-10 grid gap-8 lg:mt-14 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <RichText field="body" text={section.body} className="grid gap-4 text-lg leading-relaxed text-muted [&_strong]:text-ink" />
          {section.highlight && (
            <p data-edit-field="highlight" className="font-display text-2xl leading-snug text-terra lg:border-l lg:border-line lg:pl-10">
              {section.highlight}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
