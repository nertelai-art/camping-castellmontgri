import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addGalleryImageAction, deleteContentAction, moveGalleryImageAction, removeGalleryImageAction, replaceImageAction, saveContentAction } from "@/app/admin/actions";
import { ContentForm } from "@/components/admin/content-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { GalleryField } from "@/components/admin/gallery-field";
import { ImageField } from "@/components/admin/image-field";
import { displayName, ENTITIES, isEntity, type EntityConfig } from "@/lib/admin/entities";
import { getContent, getGallery } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "Edita" };

export default async function ContentEditor({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity, id: rawId } = await params;
  if (!isEntity(entity)) notFound();
  const id = decodeURIComponent(rawId);
  const config: EntityConfig = ENTITIES[entity];
  const content = await getContent(entity, id);
  if (!content) notFound();

  const name = displayName(config, content.translations, id, content.base);
  const gallery = config.gallery ? await getGallery(entity, id) : [];

  return (
    <>
      <Link href={config.single ? "/admin" : `/admin/${entity}`} className="text-base font-bold text-terra hover:underline">
        ← {config.single ? "Inici" : config.title}
      </Link>
      <h1 className="font-display mt-3 text-4xl text-olive">{name}</h1>
      {config.image && <ImageField action={replaceImageAction.bind(null, entity, id)} label={config.image.label} current={content.image} />}
      {config.gallery && (
        <GalleryField
          label={config.gallery.label}
          items={gallery}
          add={addGalleryImageAction.bind(null, entity, id)}
          remove={removeGalleryImageAction.bind(null, entity, id)}
          move={moveGalleryImageAction.bind(null, entity, id)}
        />
      )}
      <ContentForm
        action={saveContentAction.bind(null, entity, id)}
        text={config.text}
        base={config.base}
        initial={{ base: content.base, translations: content.translations }}
      />
      {config.create && <DeleteButton action={deleteContentAction.bind(null, entity, id)} what={`${config.feminine ? "aquesta" : "aquest"} ${config.singular}`} />}
    </>
  );
}
