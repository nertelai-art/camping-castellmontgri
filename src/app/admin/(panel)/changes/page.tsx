import type { Metadata } from "next";
import { ChangeList } from "@/components/admin/change-list";
import { listChanges } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "Registre de canvis" };

export default async function Changes() {
  const changes = await listChanges();

  return (
    <>
      <h1 className="font-display text-4xl text-olive">Registre de canvis</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">Qui ha canviat què des del panell, del més nou al més antic (els últims 100).</p>
      <div className="mt-8">{changes.length > 0 && <ChangeList changes={changes} />}</div>
      {changes.length === 0 && <p className="mt-8 max-w-3xl rounded-2xl border border-dashed border-line p-8 text-lg text-muted">Encara no s&apos;ha canviat res des del panell.</p>}
    </>
  );
}
