import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/site/image-gallery";
import { SubpageHero } from "@/components/site/subpage-hero";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { getSections } from "@/lib/supabase/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/gallery">): Promise<Metadata> {
  const { locale } = await params;
  return subpageMetadata(locale, "gallery", "gallery");
}

export default async function GalleryPage({ params }: PageProps<"/[locale]/gallery">) {
  const locale = assertLocale((await params).locale);
  const sections = await getSections(locale);
  const section = sections.gallery;
  if (!section || section.gallery.length === 0) notFound();
  return (
    <Subpage locale={locale}>
      <SubpageHero section={section} id="gallery-title" />
      <section aria-labelledby="gallery-title" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8 lg:pb-32">
        <ImageGallery photos={section.gallery} />
      </section>
    </Subpage>
  );
}
