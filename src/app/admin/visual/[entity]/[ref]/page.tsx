import { ContentEditor } from "@/components/admin/content-editor";
import { displayName, ENTITIES, isEntity, type EntityConfig } from "@/lib/admin/entities";
import { getContent, resolveRef } from "@/lib/supabase/admin-content";

export default async function VisualEditor({ params }: PageProps<"/admin/visual/[entity]/[ref]">) {
  const { entity, ref: rawRef } = await params;
  const ref = decodeURIComponent(rawRef);
  const id = isEntity(entity) ? await resolveRef(entity, ref) : null;
  const content = id && isEntity(entity) ? await getContent(entity, id) : null;
  if (!content || !isEntity(entity)) {
    return <p className="rounded-2xl border border-dashed border-line p-6 text-lg text-muted">Aquest bloc no s&apos;ha trobat. Potser s&apos;ha esborrat; clica&apos;n un altre.</p>;
  }
  const config: EntityConfig = ENTITIES[entity];

  return (
    <div className="[&_form]:mt-6 [&_section]:mt-6">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-muted">{config.title}</p>
      <h1 className="font-display mt-1 text-3xl text-olive">{displayName(config, content.translations, content.id, content.base)}</h1>
      {/* key: en canviar de bloc els formularis comencen de nou amb els valors del bloc nou */}
      <ContentEditor key={`${entity}:${content.id}`} entity={entity} content={content} canDelete={false} />
    </div>
  );
}
