import Link from "next/link";
import { ENTITIES, isEntity } from "@/lib/admin/entities";
import type { Change } from "@/lib/supabase/admin-content";

const WHEN = new Intl.DateTimeFormat("ca", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });
const ACTION = { text: "ha canviat els textos de", image: "ha canviat la foto de", create: "ha creat", delete: "ha esborrat", programme: "ha canviat el programa de" } as const;

/** Qui ha canviat què. El fan servir el registre de canvis i la pàgina d'inici. */
export function ChangeList({ changes }: { changes: Change[] }) {
  return (
    <ol className="mt-4 grid max-w-3xl gap-2">
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
  );
}
