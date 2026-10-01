import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { ENTITIES, ENTITY_NAMES } from "@/lib/admin/entities";
import { currentEditor } from "@/lib/supabase/session";

/** Tot el que penja d'aquí demana sessió d'editor. Les accions de servidor ho tornen a comprovar pel seu compte. */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const editor = await currentEditor();
  if (!editor) redirect("/admin/login");

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-line bg-card px-5 py-5 lg:border-b-0 lg:border-r lg:py-8">
        <Link href="/admin" className="font-display block text-2xl leading-tight text-olive">
          Panell de continguts
        </Link>
        <Link href="/admin/visual" className="mt-5 block rounded-2xl bg-band-terra px-4 py-3 text-center text-base font-bold text-on-dark transition hover:brightness-110">
          Edita sobre la web
        </Link>
        <nav aria-label="Continguts" className="mt-5">
          <ul className="flex flex-wrap gap-1 lg:grid">
            {ENTITY_NAMES.map((name) => (
              <li key={name}>
                <Link href={`/admin/${name}`} className="block rounded-xl px-3 py-2.5 text-base font-bold text-ink transition hover:bg-paper-2">
                  {ENTITIES[name].title}
                </Link>
              </li>
            ))}
            <li className="lg:mt-3 lg:border-t lg:border-line lg:pt-3">
              <Link href="/admin/changes" className="block rounded-xl px-3 py-2.5 text-base font-bold text-ink transition hover:bg-paper-2">
                Registre de canvis
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-5 border-t border-line pt-5 text-base">
          <p className="truncate font-bold">{editor.name ?? editor.email}</p>
          <p className="text-muted">{editor.role === "admin" ? "Administració" : "Edició"}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <a href="/" target="_blank" rel="noopener" className="font-bold text-terra hover:underline">
              Veure la web ↗
            </a>
            <form action={signOut}>
              <button type="submit" className="font-bold text-terra hover:underline">
                Tanca la sessió
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
