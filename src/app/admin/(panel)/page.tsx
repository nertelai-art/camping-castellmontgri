import { ArrowRight, CheckCircle2, CircleAlert, ExternalLink, EyeOff, Languages, MousePointerClick, PencilLine, Plus } from "lucide-react";
import Link from "next/link";
import { createContentAction } from "@/app/admin/actions";
import { AdminIcon } from "@/components/admin/admin-icons";
import { ChangeList } from "@/components/admin/change-list";
import { CARD, PageHeader } from "@/components/admin/page-header";
import { ENTITIES, ENTITY_NAMES, type EntityName } from "@/lib/admin/entities";
import { CHANGES_HREF, CREATABLE, createLabel, ENTITY_ICONS, entityHref, LEGAL_SITE_PAGES, pendingWork, SITE_PAGES, TASKS, visualPageHref, type SitePage } from "@/lib/admin/nav";
import { listChanges, listContent, type ContentListItem } from "@/lib/supabase/admin-content";
import { currentEditor } from "@/lib/supabase/session";

const H2 = "font-display text-2xl text-olive";

/** Les xifres del tauler: el que es veu a la web de cada contingut, i quants n'hi ha en total. */
const STATS: readonly EntityName[] = ["accommodations", "activities", "restaurants", "services", "testimonials", "map_points"];

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Una pàgina del web: la seva foto, si es veu i quins idiomes li falten, i les dues maneres d'editar-la. */
function PageCard({ page, section }: { page: SitePage; section: ContentListItem | undefined }) {
  const hidden = section && !section.published;
  const missing = section?.missing.length ?? 0;
  return (
    <li className={`${CARD} group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[0_24px_40px_-28px_rgb(35_42_20/.5)]`}>
      {/* La foto porta al mateix lloc que el botó «Sobre la web»: per al teclat i el lector de pantalla, n'hi ha prou amb el botó. */}
      <Link href={visualPageHref(page.path)} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/9] overflow-hidden bg-paper-2">
        {section?.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniatura de Storage, ja reduïda: no cal l'optimitzador.
          <img src={section.image} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <span className="grid size-full place-items-center bg-[linear-gradient(135deg,var(--color-paper-2),var(--color-card))] text-olive/50">
            <AdminIcon name={page.icon} className="size-12" />
          </span>
        )}
        <span className="absolute inset-0 grid place-items-center bg-ink/45 opacity-0 transition group-hover:opacity-100">
          <span className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold text-ink">
            <MousePointerClick aria-hidden="true" className="size-4" />
            Edita sobre la web
          </span>
        </span>
        <span className={`absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${hidden ? "bg-band-terra text-on-dark" : "bg-card/95 text-olive"}`}>
          {hidden ? <EyeOff aria-hidden="true" className="size-3.5" /> : <span aria-hidden="true" className="size-2 rounded-full bg-olive" />}
          {hidden ? "Amagada" : "Publicada"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <AdminIcon name={page.icon} className="size-5 text-olive" />
          <h3 className="text-lg font-bold text-ink">{page.title}</h3>
          {missing > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-terra/10 px-2 py-0.5 text-xs font-bold text-terra" title={`Falta traduir: ${section!.missing.join(", ")}`}>
              <Languages aria-hidden="true" className="size-3.5" />
              {missing} per traduir
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{page.hint}</p>
        <p className="mt-1 font-mono text-xs text-muted/80">/es{page.path}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={visualPageHref(page.path)} className="inline-flex items-center gap-1.5 rounded-full bg-olive px-3.5 py-1.5 text-sm font-bold text-paper transition hover:brightness-110">
            <MousePointerClick aria-hidden="true" className="size-4" />
            Sobre la web
          </Link>
          <Link href={page.edit} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-bold text-ink transition hover:border-olive">
            <PencilLine aria-hidden="true" className="size-4" />
            Textos i fotos
          </Link>
        </div>
      </div>
    </li>
  );
}

/** El dibuix de com funciona l'editor visual: la web, un bloc ressaltat i l'editor al costat. */
function VisualEditorSketch() {
  return (
    <div aria-hidden="true" className="relative hidden w-72 shrink-0 rotate-[-2deg] rounded-xl bg-card p-2 shadow-[0_30px_60px_-30px_rgb(0_0_0/.6)] md:block">
      <div className="flex gap-1 pb-2">
        <span className="size-2 rounded-full bg-terra/60" />
        <span className="size-2 rounded-full bg-line" />
        <span className="size-2 rounded-full bg-line" />
      </div>
      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <div className="grid gap-1.5">
          <div className="h-12 rounded-md bg-[linear-gradient(135deg,var(--color-olive),var(--color-sea))] opacity-80" />
          <div className="relative rounded-md p-1.5 outline-2 outline-terra outline-dashed">
            <div className="h-1.5 w-3/4 rounded bg-olive/60" />
            <div className="mt-1 h-1 w-full rounded bg-line" />
            <div className="mt-1 h-1 w-5/6 rounded bg-line" />
            <MousePointerClick className="absolute -bottom-2 -right-1 size-5 fill-card text-ink" strokeWidth={2} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="h-6 rounded bg-paper-2" />
            <div className="h-6 rounded bg-paper-2" />
            <div className="h-6 rounded bg-paper-2" />
          </div>
        </div>
        <div className="grid content-start gap-1.5 rounded-md bg-paper-2 p-1.5">
          <div className="h-1 w-2/3 rounded bg-muted/40" />
          <div className="h-4 rounded border border-line bg-card" />
          <div className="h-1 w-1/2 rounded bg-muted/40" />
          <div className="h-8 rounded border border-line bg-card" />
          <div className="h-3 w-3/4 rounded-full bg-olive" />
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const [editor, lists, changes] = await Promise.all([currentEditor(), Promise.all(ENTITY_NAMES.map(async (entity) => ({ entity, items: await listContent(entity) }))), listChanges(6)]);
  const byEntity = new Map(lists.map((list) => [list.entity, list.items]));
  const sections = new Map((byEntity.get("sections") ?? []).map((section) => [section.id, section]));
  const pending = pendingWork(lists);
  const firstName = (editor?.name ?? "").split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Hola, ${firstName}` : "Hola"}
        description="Des d'aquí canvies tot el que es veu a la web: textos, fotos, allotjaments, horaris i el programa. En desar, el canvi surt publicat."
        actions={
          <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-ink transition hover:border-olive">
            <span aria-hidden="true" className="size-2 rounded-full bg-olive shadow-[0_0_0_3px_rgb(80_96_40/.2)]" />
            La web està publicada
            <ExternalLink aria-hidden="true" className="size-4 text-muted" />
          </a>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Link href="/admin/visual" className="group relative flex items-center gap-6 overflow-hidden rounded-2xl bg-band-olive p-6 text-on-dark sm:p-8">
          <div className="min-w-0 flex-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em]">
              <MousePointerClick aria-hidden="true" className="size-4" />
              La manera més fàcil
            </span>
            <h2 className="font-display mt-4 text-3xl leading-tight sm:text-4xl">Edita sobre la web</h2>
            <p className="mt-2 max-w-md text-base text-on-dark/85 sm:text-lg">Veus la web tal com la veuen els clients. Clica un text o una foto, canvia-ho al costat i desa: es veu a l&apos;instant.</p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-on-dark px-5 py-2.5 font-bold text-band-olive transition group-hover:gap-3">
              Obre l&apos;editor
              <ArrowRight aria-hidden="true" className="size-4" />
            </span>
          </div>
          <VisualEditorSketch />
        </Link>

        <section aria-labelledby="create-title" className={`${CARD} p-6`}>
          <h2 id="create-title" className="flex items-center gap-2 text-lg font-bold text-ink">
            <Plus aria-hidden="true" className="size-5 text-olive" />
            Afegeix contingut nou
          </h2>
          <p className="mt-1 text-sm text-muted">Neix en esborrany: no surt a la web fins que el publiquis.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {CREATABLE.map((entity) => (
              <li key={entity}>
                <form action={createContentAction.bind(null, entity)}>
                  <button type="submit" className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left font-bold text-ink transition hover:border-olive hover:bg-paper-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-olive/10 text-olive">
                      <AdminIcon name={ENTITY_ICONS[entity]} className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{createLabel(entity)}</span>
                    <Plus aria-hidden="true" className="size-4 text-muted" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ul aria-label="Xifres" className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STATS.map((entity) => {
          const items = byEntity.get(entity) ?? [];
          const published = items.filter((item) => item.published).length;
          return (
            <li key={entity}>
              <Link href={entityHref(entity)} className={`${CARD} flex h-full flex-col p-4 transition hover:border-olive`}>
                <span className="flex items-start justify-between gap-2 text-sm font-bold text-muted">
                  {ENTITIES[entity].title}
                  <AdminIcon name={ENTITY_ICONS[entity]} className="size-5 shrink-0 text-olive" />
                </span>
                <span className="font-display mt-auto block pt-2 text-3xl text-ink">{published}</span>
                <span className="text-xs text-muted">{published === items.length ? "tots a la web" : `a la web, de ${items.length}`}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="pages-title" className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="pages-title" className={H2}>
              Les pàgines del web
            </h2>
            <p className="mt-1 text-base text-muted">Tria una pàgina i edita-la sobre la web, o obre&apos;n directament els textos i les fotos.</p>
          </div>
        </div>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {SITE_PAGES.map((page) => (
            <PageCard key={page.path} page={page} section={sections.get(page.section)} />
          ))}
        </ul>
        <div className={`${CARD} mt-5 flex flex-wrap items-center gap-2 px-4 py-3`}>
          <span className="mr-2 text-sm font-bold text-muted">Textos legals</span>
          {LEGAL_SITE_PAGES.map((page) => (
            <Link key={page.path} href={page.edit} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm font-bold text-ink transition hover:border-olive">
              <AdminIcon name={page.icon} className="size-4 text-olive" />
              {page.title}
              {(sections.get(page.section)?.missing.length ?? 0) > 0 && <span className="size-2 rounded-full bg-terra" title="Falta traduir" />}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <section aria-labelledby="pending-title" className={`${CARD} p-6`}>
          <h2 id="pending-title" className={H2}>
            Per acabar
          </h2>
          {pending.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-base text-muted">
              <CheckCircle2 aria-hidden="true" className="size-5 text-olive" />
              Tot és a la web i traduït als cinc idiomes.
            </p>
          ) : (
            <ul className="mt-4 grid gap-2">
              {pending.map((work) => (
                <li key={work.entity}>
                  <Link href={entityHref(work.entity)} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 transition hover:border-olive hover:bg-paper-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-terra/10 text-terra">
                      <CircleAlert aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-ink">{work.title}</span>
                      <span className="block text-sm text-muted">
                        {[work.hidden > 0 && count(work.hidden, "no es veu a la web", "no es veuen a la web"), work.untranslated > 0 && `${work.untranslated} per traduir`].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <ArrowRight aria-hidden="true" className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.16em] text-muted">Feines habituals</h3>
          <ul className="mt-3 grid gap-1">
            {TASKS.map((task) => (
              <li key={task.label}>
                <Link href={task.href} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-base text-ink transition hover:bg-paper-2">
                  {task.label}
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="changes-title" className={`${CARD} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <h2 id="changes-title" className={H2}>
              Activitat recent
            </h2>
            <Link href={CHANGES_HREF} className="text-sm font-bold text-terra hover:underline">
              Veure-ho tot
            </Link>
          </div>
          <div className="mt-5">{changes.length > 0 ? <ChangeList changes={changes} /> : <p className="text-base text-muted">Encara no s&apos;ha canviat res des del panell.</p>}</div>
        </section>
      </div>
    </>
  );
}
