import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Gastronomy } from "@/components/site/gastronomy";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { getRestaurants, getSections } from "@/lib/supabase/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/gastronomy">): Promise<Metadata> {
  const { locale } = await params;
  return subpageMetadata(locale, "gastronomy", "gastronomy");
}

export default async function GastronomyPage({ params }: PageProps<"/[locale]/gastronomy">) {
  const locale = assertLocale((await params).locale);
  const [sections, restaurants] = await Promise.all([getSections(locale), getRestaurants(locale)]);
  if (!sections.gastronomy) notFound();
  return (
    <Subpage locale={locale}>
      {/* Aquí no hi ha mapa: «Veure al mapa» no hi porta enlloc. */}
      <Gastronomy section={sections.gastronomy} restaurants={restaurants} onMap={new Set()} index={1} level={1} />
    </Subpage>
  );
}
