import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Entertainment } from "@/components/site/entertainment";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { getActivities, getSections } from "@/lib/supabase/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/entertainment">): Promise<Metadata> {
  const { locale } = await params;
  return subpageMetadata(locale, "entertainment", "entertainment");
}

export default async function EntertainmentPage({ params }: PageProps<"/[locale]/entertainment">) {
  const locale = assertLocale((await params).locale);
  const [sections, activities] = await Promise.all([getSections(locale), getActivities(locale)]);
  if (!sections.entertainment) notFound();
  return (
    <Subpage locale={locale}>
      <Entertainment section={sections.entertainment} activities={activities} index={1} level={1} />
    </Subpage>
  );
}
