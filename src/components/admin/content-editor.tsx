import { addGalleryImageAction, deleteContentAction, moveGalleryImageAction, removeGalleryImageAction, replaceImageAction, saveContentAction } from "@/app/admin/actions";
import { ENTITIES, type EntityConfig, type EntityName } from "@/lib/admin/entities";
import { getGallery, type ContentDetail } from "@/lib/supabase/admin-content";
import { ContentForm } from "./content-form";
import { DeleteButton } from "./delete-button";
import { GalleryField } from "./gallery-field";
import { ImageField } from "./image-field";

/** Tot el que es pot fer amb un contingut: foto, galeria, textos i esborrar. */
export async function ContentEditor({ entity, content, canDelete = true }: { entity: EntityName; content: ContentDetail; canDelete?: boolean }) {
  const config: EntityConfig = ENTITIES[entity];
  const { id } = content;
  const gallery = config.gallery ? await getGallery(entity, id) : [];

  return (
    <>
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
      <ContentForm action={saveContentAction.bind(null, entity, id)} text={config.text} base={config.base} initial={{ base: content.base, translations: content.translations }} />
      {config.create && canDelete && <DeleteButton action={deleteContentAction.bind(null, entity, id)} what={`${config.feminine ? "aquesta" : "aquest"} ${config.singular}`} />}
    </>
  );
}
