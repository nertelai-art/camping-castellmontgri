import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pools } from "@/components/site/pools";
import { ServicesGrid } from "@/components/site/services-grid";
import { assertLocale, Subpage, subpageMetadata } from "@/components/site/subpage";
import { getSections, getServices } from "@/lib/supabase/content";

export async function generateMetadata({ params }: PageProps<"/[locale]/services">): Promise<Metadata> {
  const { locale } = await params;
  return subpageMetadata(locale, "services", "services");
}

/** Instal·lacions: tots els serveis i, a sota, les piscines i els tobogans. Aquí no hi ha mapa: «Veure al mapa» no hi surt. */
export default async function ServicesPage({ params }: PageProps<"/[locale]/services">) {
  const locale = assertLocale((await params).locale);
  const [sections, services] = await Promise.all([getSections(locale), getServices(locale)]);
  if (!sections.services) notFound();
  const pools = services.find((s) => s.slug === "swimming-pools");
  const slides = services.find((s) => s.slug === "slides");
  return (
    <Subpage locale={locale}>
      <ServicesGrid section={sections.services} services={services.filter((s) => s !== pools && s !== slides)} onMap={new Set()} index={1} level={1} />
      {pools && <Pools pools={pools} slides={slides} onMap={new Set()} index={2} />}
    </Subpage>
  );
}
