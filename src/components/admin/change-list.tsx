import { CalendarDays, ImageIcon, PencilLine, Plus, Trash2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { ENTITIES, isEntity } from "@/lib/admin/entities";
import type { Change, ChangeAction } from "@/lib/supabase/admin-content";

const WHEN = new Intl.DateTimeFormat("ca", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });
const ACTION = { text: "ha canviat els textos de", image: "ha canviat la foto de", create: "ha creat", delete: "ha esborrat", programme: "ha canviat el programa de" } as const;
const ICON: Record<ChangeAction, { icon: LucideIcon; tone: string }> = {
  text: { icon: PencilLine, tone: "bg-olive/10 text-olive" },
  image: { icon: ImageIcon, tone: "bg-sea/10 text-sea" },
  create: { icon: Plus, tone: "bg-olive/10 text-olive" },
  delete: { icon: Trash2, tone: "bg-terra/10 text-terra" },
  programme: { icon: CalendarDays, tone: "bg-sea/10 text-sea" },
};

/** Qui ha canviat què, com una línia de temps. El fan servir el registre de canvis i el tauler. */
export function ChangeList({ changes }: { changes: Change[] }) {
  return (
    <ol className="grid">
      {changes.map((change, i) => {
        const { icon: Icon, tone } = ICON[change.action];
        return (
          <li key={change.id} className="relative flex gap-3 pb-5 last:pb-0">
            {i < changes.length - 1 && <span aria-hidden="true" className="absolute left-[1.0625rem] top-10 bottom-1 w-px bg-line" />}
            <span className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}>
              <Icon aria-hidden="true" className="size-4" strokeWidth={2} />
            </span>
            <div className="min-w-0 pt-1 text-base leading-snug">
              <span className="font-bold">{change.editor}</span> {ACTION[change.action]}{" "}
              {isEntity(change.entity) && change.action !== "delete" ? (
                <Link href={`/admin/${change.entity}/${encodeURIComponent(change.rowId)}`} className="font-bold text-terra hover:underline">
                  {change.rowName}
                </Link>
              ) : (
                <span className="font-bold">{change.rowName}</span>
              )}
              {isEntity(change.entity) && ENTITIES[change.entity].title !== change.rowName && <span className="text-muted"> · {ENTITIES[change.entity].title}</span>}
              <time dateTime={change.at} className="mt-0.5 block text-sm text-muted">
                {WHEN.format(new Date(change.at))}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
