import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/site/image-gallery";
import { SectionHeading } from "@/components/site/section-heading";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { getSections } from "@/lib/supabase/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const { locale } = await params;
  return subpageMetadata(locale, "gallery", "gallery");
}

export default async function GalleryPage({ params }: PageProps<"/[locale]/gallery">) {
  const locale = assertLocale((await params).locale);
  const [t, sections] = await Promise.all([getTranslations("gallery"), getSections(locale)]);
  const section = sections.gallery;
  if (!section || section.gallery.length === 0) notFound();
  return (
    <Subpage locale={locale}>
      <section data-edit="sections:gallery" aria-labelledby="gallery-title" className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8 lg:pb-32">
        <SectionHeading id="gallery-title" index={1} eyebrow={t("eyebrow")} title={section.title} body={section.body} highlight={section.highlight} level={1} />
        <ImageGallery photos={section.gallery} />
      </section>
    </Subpage>
  );
}
