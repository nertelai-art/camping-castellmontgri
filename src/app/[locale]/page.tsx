import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Esquelet provisional: llista les seccions de la landing i permet canviar d'idioma.
// El contingut real vindrà de Supabase (fase 1 del ROADMAP).
const SECTIONS = ["accommodation", "map", "gastronomy", "services", "entertainment", "surroundings", "contact"] as const;

export default function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations();

  return (
    <main className="min-h-dvh bg-[var(--color-bg)] px-4 py-16 text-[var(--color-ink)] sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">
          {t("skeleton.notice")}
        </p>
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">Natura Village Castell Montgrí</h1>

        <nav aria-label="Idioma" className="mt-8 flex flex-wrap gap-2">
          {routing.locales.map((l) => (
            <Link
              key={l}
              href="/"
              locale={l}
              aria-current={l === locale ? "true" : undefined}
              className="rounded-full border border-[var(--color-line)] px-4 py-1.5 text-sm uppercase aria-[current]:bg-[var(--color-primary)] aria-[current]:text-[var(--color-bg)]"
            >
              {l}
            </Link>
          ))}
        </nav>

        <h2 className="mt-12 text-lg font-semibold">{t("skeleton.sections")}</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          {SECTIONS.map((key, i) => (
            <li key={key} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <span className="text-sm text-[var(--color-muted)]">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-medium">{t(`nav.${key}`)}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
