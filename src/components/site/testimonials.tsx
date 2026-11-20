import { getLocale, getTranslations } from "next-intl/server";
import { paragraphs } from "@/lib/content/rich-text";
import type { ReviewPlatform, Section, Testimonial } from "@/lib/supabase/content";
import { PlatformLogo } from "./platform-logo";

/**
 * Les opinions, a sobre dels allotjaments: la nota del càmping a cada plataforma (enllaçada a les seves ressenyes) i, a sota, les opinions
 * en l'idioma original (lang al blockquote perquè el lector de pantalla les pronunciï bé). Les notes i les opinions s'editen al panell.
 */
export async function Testimonials({ section, testimonials, platforms }: { section: Section; testimonials: Testimonial[]; platforms: ReviewPlatform[] }) {
  const [t, locale] = await Promise.all([getTranslations("testimonials"), getLocale()]);
  if (!testimonials.length && !platforms.length) return null;
  const score = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section data-edit="sections:testimonials" id="reviews" aria-labelledby="testimonials-title" className="cv bg-paper-2 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="reveal max-w-2xl">
            {section.eyebrow && (
              <p data-edit-field="eyebrow" className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-terra">
                {section.eyebrow}
              </p>
            )}
            <h2 id="testimonials-title" data-edit-field="title" className="font-display text-4xl leading-[1.04] text-olive sm:text-5xl">
              {section.title}
            </h2>
          </div>

          {platforms.length > 0 && (
            <ul className="reveal grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {platforms.map((p) => {
                const body = (
                  <>
                    <span className="flex items-center gap-2.5">
                      <PlatformLogo platform={p.platform} />
                      <span className="text-sm font-bold text-ink">{p.platform}</span>
                    </span>
                    <span className="mt-3 flex items-baseline gap-1">
                      <span className="font-display text-4xl tabular-nums text-olive">{score.format(p.rating)}</span>
                      <span className="text-sm font-bold text-muted">/{p.scale}</span>
                    </span>
                    <Stars value={p.rating / p.scale} />
                    {p.reviewCount != null && <span className="mt-2 text-xs text-muted">{t("reviews", { count: p.reviewCount })}</span>}
                    <span className="sr-only">{t("score", { rating: score.format(p.rating), scale: p.scale })}</span>
                  </>
                );
                const box = "flex h-full min-w-44 flex-col rounded-3xl border border-line bg-card px-5 py-4 transition";
                return (
                  <li key={p.id} data-edit={`review_platforms:${p.id}`}>
                    {p.url ? (
                      <a href={p.url} target="_blank" rel="noopener" aria-label={t("seeOn", { platform: p.platform })} className={`${box} hover:-translate-y-0.5 hover:border-olive hover:shadow-lg`}>
                        {body}
                      </a>
                    ) : (
                      <div className={box}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {testimonials.length > 0 && (
          <ul className="snap-strip -mx-4 mt-12 auto-cols-[min(85%,26rem)] gap-5 px-4 pb-2 md:mx-0 md:grid-flow-row md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3">
            {testimonials.map((item) => (
              <li key={item.id} data-edit={`testimonials:${item.id}`} className="reveal">
                <figure className="flex h-full flex-col rounded-[2rem] bg-card p-7 lg:p-8">
                  {item.rating != null && <Stars value={item.rating / 5} />}
                  <blockquote lang={item.locale} className="mt-4 flex-1">
                    {item.title && (
                      <p data-edit-field="title" className="font-display text-2xl text-olive">
                        “{item.title}”
                      </p>
                    )}
                    {paragraphs(item.quote).map((p, i) => (
                      <p key={i} className="mt-3 line-clamp-6 leading-relaxed text-muted">
                        {p}
                      </p>
                    ))}
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-4 text-sm font-bold text-ink">
                    {item.source && <PlatformLogo platform={item.source} className="size-8" />}
                    <span>
                      <span data-edit-field="author">{item.author}</span>
                      {item.source && <span className="block font-normal text-muted">{t("via", { source: item.source })}</span>}
                    </span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Cinc estrelles omplertes fins a la proporció de la nota (0 a 1). Decoratives: la nota ja es diu amb text. */
function Stars({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  const row = "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z";
  const stars = (className: string) => (
    <svg viewBox="0 0 120 24" className={`h-4 w-20 ${className}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={row} transform={`translate(${i * 24} 0)`} fill="currentColor" />
      ))}
    </svg>
  );
  return (
    <span aria-hidden="true" className="relative mt-1 block h-4 w-20">
      <span className="absolute inset-0 text-line">{stars("")}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-terra-2" style={{ width }}>
        {stars("max-w-none")}
      </span>
    </span>
  );
}
