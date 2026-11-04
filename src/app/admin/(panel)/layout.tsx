import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/app/admin/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { SIDEBAR_COOKIE } from "@/lib/admin/nav";
import { currentEditor } from "@/lib/supabase/session";

/** Tot el que penja d'aquí demana sessió d'editor. Les accions de servidor ho tornen a comprovar pel seu compte. */
export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const [editor, jar] = await Promise.all([currentEditor(), cookies()]);
  if (!editor) redirect("/admin/login");

  return (
    <AdminShell editor={{ name: editor.name, email: editor.email, role: editor.role }} signOut={signOut} initialCollapsed={jar.get(SIDEBAR_COOKIE)?.value === "1"}>
      {children}
    </AdminShell>
  );
}
