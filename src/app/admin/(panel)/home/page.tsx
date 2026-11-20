import type { Metadata } from "next";
import Link from "next/link";
import { HomeBlocks } from "@/components/admin/home-blocks";
import { entityHref, visualPageHref } from "@/lib/admin/nav";
import { PageHeader, SECONDARY } from "@/components/admin/page-header";
import { MousePointerClick } from "lucide-react";
import type { HomeBlock } from "@/lib/content/home";
import { listHomeBlocks } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "La portada" };

// Què hi ha a cada bloc, perquè qui edita sàpiga què amaga o mou.
const HINTS: Record<HomeBlock, string> = {
  welcome: "El text de benvinguda i les fotos del voltant.",
  accommodation: "Les targetes dels allotjaments, amb el filtre per tipus (de 9 en 9).",
  explore: "Les portes a Instal·lacions, Animació, Gastronomia i Entorn.",
  map: "El mapa interactiu del càmping.",
  directions: "Com arribar-hi: la ruta a Google Maps i el mapa de la zona.",
  trip: "El viatge amb la IA: ChatGPT, Claude i Gemini.",
  testimonials: "Les notes a Booking, Google… i les opinions dels clients.",
  contact: "Telèfon, correus, adreça i temporada (de les dades generals) i el botó de reservar. El menú «Contacte» hi porta.",
};

export default async function HomeLayout() {
  const blocks = (await listHomeBlocks()).map((block) => ({ ...block, hint: HINTS[block.key] }));
  return (
    <>
      <PageHeader
        icon="layout"
        title="La portada"
        actions={
          <Link href={visualPageHref("")} className={SECONDARY}>
            <MousePointerClick aria-hidden="true" className="size-5" />
            Edita-la sobre la web
          </Link>
        }
        description={
          <>
        Els blocs de la pàgina principal, en l&apos;ordre en què surten. Amb les fletxes es mouen i amb la casella s&apos;amaguen; es desa sol. La foto gran i
        la cerca de reserva van sempre primer: el seu text és a{" "}
        <Link href={`${entityHref("sections")}/hero`} className="font-bold text-terra hover:underline">
          la portada (hero)
        </Link>
        .
          </>
        }
      />
      <HomeBlocks blocks={blocks} />
    </>
  );
}
