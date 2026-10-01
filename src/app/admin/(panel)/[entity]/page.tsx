import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ENTITIES, isEntity, tableColumns, type EntityConfig } from "@/lib/admin/entities";
import { createContentAction, moveContentAction, updateFieldAction } from "@/app/admin/actions";
import { ContentTable, type TableGroup } from "@/components/admin/content-table";
import { listContent } from "@/lib/supabase/admin-content";

export async function generateMetadata({ params }: PageProps<"/admin/[entity]">): Promise<Metadata> {
  const { entity } = await params;
  return { title: isEntity(entity) ? ENTITIES[entity].title : "No trobat" };
}

export default async function ContentList({ params }: PageProps<"/admin/[entity]">) {
  const { entity } = await params;
  if (!isEntity(entity)) notFound();
  const config: EntityConfig = ENTITIES[entity];
  if (config.single) redirect(`/admin/${entity}/${config.single}`);
  const rows = await listContent(entity);
  const columns = tableColumns(config);

  // Agrupada (els allotjaments per tipus): cada grup amb el seu nom i en l'ordre de l'altra llista.
  let groups: TableGroup[] = [{ name: null, rows }];
  if (config.groupBy && isEntity(config.groupBy.entity)) {
    const names = await listContent(config.groupBy.entity);
    groups = names.map((group) => ({ name: group.name, rows: rows.filter((row) => row.group === group.id) })).filter((group) => group.rows.length > 0);
    const orphans = rows.filter((row) => !names.some((group) => group.id === row.group));
    if (orphans.length) groups.push({ name: "Sense tipus", rows: orphans });
  }

  return (
    <>
      <h1 className="font-display text-4xl text-olive">{config.title}</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">{config.description}</p>
      {config.create && (
        <form action={createContentAction.bind(null, entity)} className="mt-6">
          <button type="submit" className="rounded-full bg-olive px-6 py-3 text-lg font-bold text-paper transition hover:brightness-110">
            + Afegeix {config.feminine ? "una" : "un"} {config.singular}
          </button>
        </form>
      )}
      {rows.length > 0 && (
        <>
          <p className="mt-6 max-w-3xl text-base text-muted">
            {columns.length > 0 && "Les dades de la taula es canvien aquí mateix i es desen soles. "}
            Per als textos i les fotos, clica el nom.{config.sortable && " L'ordre és el de la web: canvia'l amb les fletxes."}
          </p>
          <ContentTable
            entity={entity}
            groups={groups}
            columns={columns}
            hasImage={Boolean(config.image)}
            hasTranslations={Boolean(config.translations)}
            sortable={Boolean(config.sortable)}
            update={updateFieldAction.bind(null, entity)}
            move={moveContentAction.bind(null, entity)}
          />
        </>
      )}
      {rows.length === 0 && <p className="mt-8 rounded-2xl border border-dashed border-line p-8 text-lg text-muted">Encara no hi ha cap {config.singular}.</p>}
    </>
  );
}
