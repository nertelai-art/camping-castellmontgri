import type { Metadata } from "next";
import Link from "next/link";
import { ENTITIES, isEntity } from "@/lib/admin/entities";
import { listChanges } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "Registre de canvis" };

const WHEN = new Intl.DateTimeFormat("ca", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });
const ACTION = { text: "ha canviat els textos de", image: "ha canviat la foto de", create: "ha creat", delete: "ha esborrat" } as const;

export default async function Changes() {
  const changes = await listChanges();

  return (
    <>
      <h1 className="font-display text-4xl text-olive">Registre de canvis</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">Qui ha canviat què des del panell, del més nou al més antic (els últims 100).</p>
      <ol className="mt-8 grid max-w-3xl gap-2">
        {changes.map((change) => (
          <li key={change.id} className="rounded-2xl border border-line bg-card px-5 py-4 text-lg">
            <time dateTime={change.at} className="block text-base text-muted">
              {WHEN.format(new Date(change.at))}
            </time>
            <span className="font-bold">{change.editor}</span> {ACTION[change.action]}{" "}
            {isEntity(change.entity) && change.action !== "delete" ? (
              <>
                <Link href={`/admin/${change.entity}/${encodeURIComponent(change.rowId)}`} className="font-bold text-terra hover:underline">
                  {change.rowName}
                </Link>{" "}
                {ENTITIES[change.entity].title !== change.rowName && <span className="text-muted">({ENTITIES[change.entity].title})</span>}
              </>
            ) : (
              <>
                <span className="font-bold">{change.rowName}</span> {isEntity(change.entity) && <span className="text-muted">({ENTITIES[change.entity].title})</span>}
              </>
            )}
          </li>
        ))}
      </ol>
      {changes.length === 0 && <p className="mt-8 max-w-3xl rounded-2xl border border-dashed border-line p-8 text-lg text-muted">Encara no s&apos;ha canviat res des del panell.</p>}
    </>
  );
}
