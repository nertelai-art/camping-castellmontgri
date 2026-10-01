import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VisualShell } from "@/components/admin/visual-shell";
import { currentEditor } from "@/lib/supabase/session";

export const metadata: Metadata = { title: "Edita sobre la web" };

/** L'editor visual ocupa tota la pantalla. Com la resta del panell, demana sessió d'editor. */
export default async function VisualLayout({ children }: LayoutProps<"/admin/visual">) {
  if (!(await currentEditor())) redirect("/admin/login");
  return <VisualShell>{children}</VisualShell>;
}
