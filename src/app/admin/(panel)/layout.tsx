import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { PanelNav } from "@/components/admin/panel-nav";
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
        <PanelNav>
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
        </PanelNav>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
    </div>
  );
}
