import { getTranslations } from "next-intl/server";
import { paragraphs } from "@/lib/content/rich-text";
import type { Testimonial } from "@/lib/supabase/content";

/** Opinions en l'idioma original (lang al blockquote perquè el lector de pantalla les pronunciï bé). */
export async function Testimonials({ testimonials, index }: { testimonials: Testimonial[]; index: number }) {
  const t = await getTranslations("testimonials");
  if (!testimonials.length) return null;
  return (
    <section aria-labelledby="testimonials-title" className="cv bg-paper-2 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-terra">
          <span className="font-display text-sm normal-case tracking-normal">{String(index).padStart(2, "0")}</span>
          <span aria-hidden="true" className="h-px w-8 bg-terra/60" />
          {t("eyebrow")}
        </p>
        <h2 id="testimonials-title" className="font-display mt-4 text-4xl text-olive sm:text-5xl">
          {t("title")}
        </h2>
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <li key={item.id} className="reveal">
              <figure className="relative h-full rounded-[2rem] bg-card p-8 lg:p-10">
                <span aria-hidden="true" className="font-display absolute -top-6 left-6 text-8xl leading-none text-terra/80">
                  “
                </span>
                <blockquote lang={item.locale}>
                  {item.title && <p className="font-display text-2xl text-olive">{item.title}</p>}
                  {paragraphs(item.quote).map((p, i) => (
                    <p key={i} className="mt-3 leading-relaxed text-muted">
                      {p}
                    </p>
                  ))}
                </blockquote>
                <figcaption className="mt-6 text-sm font-bold text-ink">
                  {item.author}
                  {item.source && <span className="font-normal text-muted"> · {t("via", { source: item.source })}</span>}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
