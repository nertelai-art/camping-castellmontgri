import type { Metadata } from "next";
import Link from "next/link";
import { HomeBlocks } from "@/components/admin/home-blocks";
import { entityHref } from "@/lib/admin/nav";
import type { HomeBlock } from "@/lib/content/home";
import { listHomeBlocks } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "La portada" };

// Què hi ha a cada bloc, perquè qui edita sàpiga què amaga o mou.
const HINTS: Record<HomeBlock, string> = {
  welcome: "El text de benvinguda, les fotos del voltant i les xifres.",
  accommodation: "Les targetes dels allotjaments, amb el filtre per tipus.",
  explore: "Les portes a Instal·lacions, Animació, Gastronomia i Entorn.",
  map: "El mapa interactiu del càmping.",
  directions: "Com arribar-hi: la ruta a Google Maps i el mapa de la zona.",
  trip: "El viatge amb la IA: ChatGPT, Claude i Gemini.",
  testimonials: "Les opinions dels clients.",
};

export default async function HomeLayout() {
  const blocks = (await listHomeBlocks()).map((block) => ({ ...block, hint: HINTS[block.key] }));
  return (
    <>
      <h1 className="font-display text-4xl text-olive">La portada</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">
        Els blocs de la pàgina principal, en l&apos;ordre en què surten. Amb les fletxes es mouen i amb la casella s&apos;amaguen; es desa sol. La foto gran i
        la cerca de reserva van sempre primer: el seu text és a{" "}
        <Link href={`${entityHref("sections")}/hero`} className="font-bold text-terra hover:underline">
          la portada (hero)
        </Link>
        .
      </p>
      <HomeBlocks blocks={blocks} />
    </>
  );
}
