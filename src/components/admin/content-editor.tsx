import Link from "next/link";
import { addGalleryImageAction, deleteContentAction, moveGalleryImageAction, removeGalleryImageAction, removeImageAction, replaceImageAction, saveContentAction } from "@/app/admin/actions";
import type { EntityName } from "@/lib/admin/entities";
import { editorConfig } from "@/lib/admin/sections";
import { getGallery, type ContentDetail } from "@/lib/supabase/admin-content";
import { ContentForm } from "./content-form";
import { DeleteButton } from "./delete-button";
import { GalleryField } from "./gallery-field";
import { ImageField } from "./image-field";

/** Tot el que es pot fer amb un contingut: foto, galeria, textos i esborrar. Només el que aquell contingut fa servir a la web (`editorConfig`). */
export async function ContentEditor({ entity, content, canDelete = true }: { entity: EntityName; content: ContentDetail; canDelete?: boolean }) {
  const { id } = content;
  const config = editorConfig(entity, id);
  const gallery = config.gallery ? await getGallery(entity, id) : [];

  return (
    <>
      {(config.where || config.related?.length) && (
        <div className="max-w-3xl rounded-3xl bg-paper-2 px-6 py-4 text-base">
          {config.where && <p>{config.where}</p>}
          {config.related && config.related.length > 0 && (
            <p className="mt-1 text-muted">
              També s&apos;edita a part:{" "}
              {config.related.map((link, i) => (
                <span key={link.href}>
                  {i > 0 && " · "}
                  <Link href={link.href} className="font-bold text-olive underline underline-offset-4">
                    {link.label}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
      {config.image && (
        <ImageField
          // Quan la foto canvia al servidor (s'ha tret o se n'ha posat una altra), el camp torna a començar amb la nova.
          key={content.image?.src ?? "sense-foto"}
          action={replaceImageAction.bind(null, entity, id)}
          remove={removeImageAction.bind(null, entity, id)}
          label={config.image.label}
          help={config.image.help}
          current={content.image}
        />
      )}
      {config.gallery && (
        <GalleryField
          label={config.gallery.label}
          help={config.gallery.help}
          max={config.gallery.max}
          items={gallery}
          add={addGalleryImageAction.bind(null, entity, id)}
          remove={removeGalleryImageAction.bind(null, entity, id)}
          move={moveGalleryImageAction.bind(null, entity, id)}
        />
      )}
      <ContentForm action={saveContentAction.bind(null, entity, id)} text={config.text} base={config.base} initial={{ base: content.base, translations: content.translations }} />
      {config.create && canDelete && <DeleteButton action={deleteContentAction.bind(null, entity, id)} what={`${config.feminine ? "aquesta" : "aquest"} ${config.singular}`} />}
    </>
  );
}
