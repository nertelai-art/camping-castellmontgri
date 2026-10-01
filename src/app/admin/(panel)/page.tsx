import Link from "next/link";
import { ENTITIES, ENTITY_NAMES } from "@/lib/admin/entities";
import { countContent } from "@/lib/supabase/admin-content";

export default async function PanelHome() {
  const counts = await Promise.all(ENTITY_NAMES.map((name) => countContent(name)));
  return (
    <>
      <h1 className="font-display text-4xl text-olive">Què vols canviar?</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">Tria una part de la web. Els canvis es veuen a la web tan bon punt els deses.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {ENTITY_NAMES.map((name, i) => (
          <li key={name}>
            <Link
              href={`/admin/${name}`}
              className="block h-full rounded-3xl border border-line bg-card p-6 transition hover:-translate-y-0.5 hover:border-olive hover:shadow-[0_20px_40px_-28px_rgb(35_42_20/.55)]"
            >
              <span className="font-display text-2xl text-olive">{ENTITIES[name].title}</span>
              <span className="mt-1 block text-base text-muted">{ENTITIES[name].description}</span>
              <span className="mt-4 block text-sm font-bold uppercase tracking-[0.16em] text-terra">{counts[i]} elements</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
