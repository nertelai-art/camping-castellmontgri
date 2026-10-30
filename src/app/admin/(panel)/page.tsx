import Link from "next/link";
import { ChangeList } from "@/components/admin/change-list";
import { ENTITY_NAMES } from "@/lib/admin/entities";
import { entityHref, pendingWork, TASKS } from "@/lib/admin/nav";
import { listChanges, listContent } from "@/lib/supabase/admin-content";

const SECTION_TITLE = "mt-10 text-sm font-bold uppercase tracking-[0.18em] text-muted";

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function PanelHome() {
  const [lists, changes] = await Promise.all([Promise.all(ENTITY_NAMES.map(async (entity) => ({ entity, items: await listContent(entity) }))), listChanges(3)]);
  const pending = pendingWork(lists);

  return (
    <>
      <h1 className="font-display text-4xl text-olive">Què vols fer?</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">Els canvis es veuen a la web tan bon punt els deses.</p>
      <Link
        href="/admin/visual"
        className="mt-8 block max-w-3xl rounded-3xl bg-band-olive p-7 text-on-dark transition hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-28px_rgb(35_42_20/.7)]"
      >
        <span className="font-display text-3xl">Canviar un text o una foto de la web</span>
        <span className="mt-1 block text-lg">Veus la web, cliques el que vols canviar i ho edites al costat. La manera més fàcil.</span>
      </Link>
      <ul className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-2">
        {TASKS.map((task) => (
          <li key={task.label}>
            <Link href={entityHref(task.entity)} className="block h-full rounded-2xl border border-line bg-card px-5 py-4 transition hover:border-olive">
              <span className="block text-lg font-bold text-ink">{task.label}</span>
              <span className="mt-1 block text-base text-muted">{task.hint}</span>
            </Link>
          </li>
        ))}
      </ul>

      {pending.length > 0 && (
        <>
          <h2 className={SECTION_TITLE}>Per acabar</h2>
          <ul className="mt-4 grid max-w-3xl gap-2">
            {pending.map((work) => (
              <li key={work.entity}>
                <Link href={entityHref(work.entity)} className="flex flex-wrap items-baseline justify-between gap-x-4 rounded-2xl border border-line bg-card px-5 py-3 transition hover:border-olive">
                  <span className="text-lg font-bold text-ink">{work.title}</span>
                  <span className="text-base text-muted">
                    {[work.hidden > 0 && count(work.hidden, "no es veu a la web", "no es veuen a la web"), work.untranslated > 0 && count(work.untranslated, "per traduir", "per traduir")].filter(Boolean).join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {changes.length > 0 && (
        <>
          <h2 className={SECTION_TITLE}>Últims canvis</h2>
          <ChangeList changes={changes} />
          <Link href="/admin/changes" className="mt-3 inline-block text-base font-bold text-terra hover:underline">
            Veure tot el registre
          </Link>
        </>
      )}
    </>
  );
}
