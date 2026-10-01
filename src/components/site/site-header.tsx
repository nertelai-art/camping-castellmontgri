import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import type { SiteSettings } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";

export const NAV = ["accommodation", "map", "gastronomy", "services", "entertainment", "surroundings", "contact"] as const;

// Nom de cada idioma en el seu propi idioma: no es tradueix.
const LANGUAGE_NAMES: Record<Locale, string> = { es: "Español", ca: "Català", fr: "Français", en: "English", nl: "Nederlands" };

function Flag({ media }: { media: MediaRef | undefined }) {
  if (!media) return null;
  return <MediaImage media={media} alt="" className="size-5 shrink-0 rounded-full object-cover ring-1 ring-line" />;
}

/** Desplegable d'idiomes amb bandera. Sense JS: <details>, accessible amb teclat. */
function LanguageMenu({ locale, label, flags }: { locale: Locale; label: string; flags: MediaRef[] }) {
  const flag = (l: Locale) => flags.find((f) => f.path.endsWith(`/${l}.svg`));
  return (
    <details className="group/lang relative">
      <summary
        aria-label={`${label}: ${LANGUAGE_NAMES[locale]}`}
        className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-line px-3 max-sm:gap-1 max-sm:px-2 text-sm font-bold uppercase text-ink transition hover:border-olive [&::-webkit-details-marker]:hidden"
      >
        <Flag media={flag(locale)} />
        {/* A mòbil només la bandera: amb el codi, la capçalera no hi cap i tota la pàgina s'eixampla. */}
        <span className="max-sm:hidden">{locale}</span>
        <svg viewBox="0 0 24 24" className="size-4 text-muted transition group-open/lang:rotate-180" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-line bg-card p-2 shadow-xl">
        {routing.locales.map((l) => (
          <li key={l}>
            <Link
              href="/"
              locale={l}
              hrefLang={l}
              lang={l}
              prefetch={false}
              aria-current={l === locale ? "true" : undefined}
              className="flex items-center gap-3 rounded-xl px-3 py-2 font-bold text-ink hover:bg-paper-2 aria-[current]:bg-olive aria-[current]:text-paper"
            >
              <Flag media={flag(l)} />
              {LANGUAGE_NAMES[l]}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export async function SiteHeader({ settings, locale, flags }: { settings: SiteSettings; locale: Locale; flags: MediaRef[] }) {
  const t = await getTranslations("nav");
  const book = settings.bookingUrl && (
    <a
      href={settings.bookingUrl}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center rounded-full bg-terra px-5 py-2.5 text-sm font-bold text-paper shadow-[0_6px_20px_-8px_var(--terra)] transition hover:bg-terra-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terra"
    >
      {t("book")}
    </a>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded focus:bg-olive focus:px-3 focus:py-2 focus:text-paper">
        {t("skip")}
      </a>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="shrink-0" aria-label={settings.brandName}>
          {settings.logo ? (
            <MediaImage media={settings.logo} alt={settings.brandName} priority className="h-10 w-auto lg:h-12 dark:brightness-0 dark:invert" />
          ) : (
            <span className="font-display text-xl text-olive">{settings.brandName}</span>
          )}
        </Link>

        <nav aria-label={t("menu")} className="hidden flex-1 justify-center xl:flex">
          <ul className="flex gap-6 text-sm font-bold text-ink/80">
            {NAV.map((key) => (
              <li key={key}>
                <a href={`#${key}`} className="transition hover:text-terra">
                  {t(key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageMenu locale={locale} label={t("language")} flags={flags} />
          {book}
          {/* Menú mòbil sense JS: <details> és accessible amb teclat i lector de pantalla. */}
          <details className="group relative xl:hidden">
            <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line text-olive [&::-webkit-details-marker]:hidden">
              <span className="sr-only">{t("menu")}</span>
              <svg viewBox="0 0 24 24" className="size-5 group-open:hidden" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <svg viewBox="0 0 24 24" className="hidden size-5 group-open:block" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute right-0 top-12 w-64 rounded-2xl border border-line bg-card p-4 shadow-xl">
              <ul className="grid gap-1">
                {NAV.map((key) => (
                  <li key={key}>
                    <a href={`#${key}`} className="block rounded-lg px-3 py-2 font-bold text-ink hover:bg-paper-2">
                      {t(key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
