import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ENTITIES, isEntity, LOCALE_NAMES, type EntityConfig } from "@/lib/admin/entities";
import { createContentAction } from "@/app/admin/actions";
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

  return (
    <>
      <h1 className="font-display text-4xl text-olive">{config.title}</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">{config.description}</p>
      {config.create && (
        <form action={createContentAction.bind(null, entity)} className="mt-6">
          <button type="submit" className="rounded-full bg-olive px-6 py-3 text-lg font-bold text-paper transition hover:brightness-110">
            + Afegeix un {config.singular}
          </button>
        </form>
      )}
      <ul className="mt-8 grid gap-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/admin/${entity}/${encodeURIComponent(row.id)}`}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-line bg-card px-5 py-4 transition hover:border-olive"
            >
              <span className="text-lg font-bold">{row.name}</span>
              {!row.published && <span className="rounded-full bg-paper-2 px-3 py-0.5 text-sm font-bold text-muted">No es veu a la web</span>}
              {row.missing.length > 0 && (
                <span className="rounded-full bg-band-terra px-3 py-0.5 text-sm font-bold text-on-dark">
                  Falta: {row.missing.map((l) => LOCALE_NAMES[l].toLowerCase()).join(", ")}
                </span>
              )}
              <span aria-hidden="true" className="ml-auto text-lg font-bold text-terra">
                Edita →
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="mt-8 rounded-2xl border border-dashed border-line p-8 text-lg text-muted">Encara no hi ha cap {config.singular}.</p>}
    </>
  );
}
