import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveContentAction } from "@/app/admin/actions";
import { ContentForm } from "@/components/admin/content-form";
import { ENTITIES, isEntity } from "@/lib/admin/entities";
import { getContent } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "Edita" };

export default async function ContentEditor({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id: rawId } = await params;
  if (!isEntity(entity)) notFound();
  const id = decodeURIComponent(rawId);
  const config = ENTITIES[entity];
  const content = await getContent(entity, id);
  if (!content) notFound();

  const main = config.text[0].name;
  const name = content.translations.ca?.[main] || content.translations.es?.[main] || id;

  return (
    <>
      <Link href={`/admin/${entity}`} className="text-base font-bold text-terra hover:underline">
        ← {config.title}
      </Link>
      <h1 className="font-display mt-3 text-4xl text-olive">{name}</h1>
      <ContentForm
        action={saveContentAction.bind(null, entity, id)}
        text={config.text}
        base={config.base}
        initial={{ base: content.base, translations: content.translations }}
      />
    </>
  );
}
