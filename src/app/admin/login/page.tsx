import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { currentEditor } from "@/lib/supabase/session";

export const metadata: Metadata = { title: "Inicia sessió" };

export default async function LoginPage() {
  if (await currentEditor()) redirect("/admin");
  return (
    <main className="mx-auto grid min-h-svh w-full max-w-md content-center px-5 py-12">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-terra">Natura Village · Castell Montgrí</p>
      <h1 className="font-display mt-2 text-4xl text-olive">Panell de continguts</h1>
      <p className="mt-3 text-lg text-muted">Des d&apos;aquí es canvien els textos i les fotos de la web.</p>
      <div className="mt-8 rounded-3xl border border-line bg-card p-6 shadow-[0_24px_50px_-30px_rgb(35_42_20/.5)] sm:p-8">
        <LoginForm />
      </div>
    </main>
  );
}
