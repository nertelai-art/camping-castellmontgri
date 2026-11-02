import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { documentBlocks } from "@/lib/content/rich-text";
import { isLegalSlug, LEGAL_PAGES } from "@/lib/content/legal";
import { getSection } from "@/lib/supabase/content";
import type { Inline } from "@/lib/content/rich-text";

export async function generateMetadata({ params }: PageProps<"/[locale]/legal/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLegalSlug(slug)) return {};
  return subpageMetadata(locale, `legal/${slug}`, LEGAL_PAGES[slug]);
}

const text = (inlines: Inline[]) => inlines.map((part, i) => (part.bold ? <strong key={i}>{part.text}</strong> : part.text));

/** Privacitat, galetes, avís legal i condicions de reserva: el text de la secció, amb els seus títols. S'edita al panell. */
export default async function LegalPage({ params }: PageProps<"/[locale]/legal/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = assertLocale(raw);
  if (!isLegalSlug(slug)) notFound();
  const section = await getSection(locale, LEGAL_PAGES[slug]);
  if (!section) notFound();
  return (
    <Subpage locale={locale}>
      <article data-edit={`sections:${section.key}`} className="mx-auto max-w-3xl px-4 pb-24 pt-6 sm:px-6 lg:pb-32">
        <h1 data-edit-field="title" className="font-display text-4xl leading-tight text-olive sm:text-5xl">
          {section.title}
        </h1>
        <div data-edit-field="body" className="mt-8 grid gap-4 leading-relaxed text-muted [&_strong]:text-ink">
          {documentBlocks(section.body).map((block, i) =>
            block.kind === "paragraph" ? (
              <p key={i}>{text(block.inlines)}</p>
            ) : block.level === 2 ? (
              <h2 key={i} className="font-display mt-6 text-2xl text-olive">
                {text(block.inlines)}
              </h2>
            ) : (
              <h3 key={i} className="mt-3 font-bold text-ink">
                {text(block.inlines)}
              </h3>
            ),
          )}
        </div>
      </article>
    </Subpage>
  );
}
