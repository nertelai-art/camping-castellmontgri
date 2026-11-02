import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { Surroundings } from "@/components/site/surroundings";
import { getMediaByFolder, getSections } from "@/lib/supabase/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/surroundings">): Promise<Metadata> {
  const { locale } = await params;
  return subpageMetadata(locale, "surroundings", "surroundings");
}

export default async function SurroundingsPage({ params }: PageProps<"/[locale]/surroundings">) {
  const locale = assertLocale((await params).locale);
  const [sections, photos] = await Promise.all([getSections(locale), getMediaByFolder("entorno", locale)]);
  if (!sections.surroundings) notFound();
  return (
    <Subpage locale={locale}>
      <Surroundings section={sections.surroundings} photos={photos} index={1} level={1} />
    </Subpage>
  );
}
