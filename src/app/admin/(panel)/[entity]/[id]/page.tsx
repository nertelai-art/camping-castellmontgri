import type { Metadata } from "next";
import { MousePointerClick } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/content-editor";
import { displayName, ENTITIES, isEntity, type EntityConfig } from "@/lib/admin/entities";
import { getContent } from "@/lib/supabase/admin-content";
import { PageHeader, SECONDARY } from "@/components/admin/page-header";
import { ENTITY_ICONS, LEGAL_SITE_PAGES, SITE_PAGES, visualPageHref } from "@/lib/admin/nav";

export const metadata: Metadata = { title: "Edita" };

export default async function ContentPage({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id: rawId } = await params;
  if (!isEntity(entity)) notFound();
  const id = decodeURIComponent(rawId);
  const config: EntityConfig = ENTITIES[entity];
  const content = await getContent(entity, id);
  if (!content) notFound();
  // Si és el text d'una pàgina del web, es pot editar també sobre aquella pàgina.
  const page = entity === "sections" ? [...SITE_PAGES, ...LEGAL_SITE_PAGES].find((p) => p.section === id) : undefined;

  return (
    <>
      <PageHeader
        back={config.single ? { href: "/admin", label: "Tauler" } : { href: `/admin/${entity}`, label: config.title }}
        icon={page?.icon ?? ENTITY_ICONS[entity]}
        title={displayName(config, content.translations, id, content.base)}
        actions={
          page && (
            <Link href={visualPageHref(page.path)} className={SECONDARY}>
              <MousePointerClick aria-hidden="true" className="size-5" />
              Edita-la sobre la web
            </Link>
          )
        }
      />
      <ContentEditor entity={entity} content={content} />
    </>
  );
}
