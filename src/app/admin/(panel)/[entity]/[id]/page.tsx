import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/content-editor";
import { displayName, ENTITIES, isEntity, type EntityConfig } from "@/lib/admin/entities";
import { getContent } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "Edita" };

export default async function ContentPage({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id: rawId } = await params;
  if (!isEntity(entity)) notFound();
  const id = decodeURIComponent(rawId);
  const config: EntityConfig = ENTITIES[entity];
  const content = await getContent(entity, id);
  if (!content) notFound();

  return (
    <>
      <Link href={config.single ? "/admin" : `/admin/${entity}`} className="text-base font-bold text-terra hover:underline">
        ← {config.single ? "Inici" : config.title}
      </Link>
      <h1 className="font-display mt-3 text-4xl text-olive">{displayName(config, content.translations, id, content.base)}</h1>
      <ContentEditor entity={entity} content={content} />
    </>
  );
}
