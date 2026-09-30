import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  getAccommodationCategories,
  getRestaurants,
  getSections,
  getServices,
  getSiteSettings,
} from "@/lib/supabase/content";

// Home provisional de la fase 1: demostra que tot el contingut surt de Supabase en els 5 idiomes.
// El disseny de debò arriba a la fase 2.
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [t, settings, sections, categories, services, restaurants] = await Promise.all([
    getTranslations(),
    getSiteSettings(locale),
    getSections(locale),
    getAccommodationCategories(locale),
    getServices(locale),
    getRestaurants(locale),
  ]);

  return (
    <main className="bg-[var(--color-bg)] text-[var(--color-ink)]">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8">
        {settings.logo ? (
          <MediaImage media={settings.logo} alt={settings.brandName} className="h-12 w-auto dark:invert" priority />
        ) : (
          <span className="text-xl font-bold">{settings.brandName}</span>
        )}
        <nav aria-label="Idioma" className="flex flex-wrap gap-2">
          {routing.locales.map((l) => (
            <Link
              key={l}
              href="/"
              locale={l}
              aria-current={l === locale ? "true" : undefined}
              className="rounded-full border border-[var(--color-line)] px-3 py-1 text-sm uppercase aria-[current]:bg-[var(--color-primary)] aria-[current]:text-[var(--color-bg)]"
            >
              {l}
            </Link>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-accent)]">{t("skeleton.notice")}</p>
        {settings.season.notice && <p className="mt-2 text-[var(--color-muted)]">{settings.season.notice}</p>}

        <div className="mt-12 grid gap-16">
          {sections.map((s) => (
            <section key={s.key} aria-labelledby={`s-${s.key}`} className="grid items-center gap-6 md:grid-cols-2">
              {s.media && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <MediaImage media={s.media} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                </div>
              )}
              <div>
                <h2 id={`s-${s.key}`} className="text-3xl font-bold">
                  {s.title}
                </h2>
                <RichText text={s.body} className="mt-4 grid gap-3 text-[var(--color-muted)]" />
                {s.highlight && <p className="mt-4 font-semibold text-[var(--color-primary)]">{s.highlight}</p>}
              </div>
            </section>
          ))}
        </div>

        <section aria-labelledby="accommodation" className="mt-24">
          <h2 id="accommodation" className="text-3xl font-bold">
            {t("nav.accommodation")}
          </h2>
          {categories.map((c) => (
            <div key={c.key} className="mt-10">
              <h3 className="text-xl font-semibold">
                {c.name}{" "}
                <span className="text-sm font-normal text-[var(--color-muted)]">
                  · {t("units.accommodations", { count: c.accommodations.length })}
                </span>
              </h3>
              <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {c.accommodations.map((a) => (
                  <li key={a.slug} className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
                    {a.cover && (
                      <div className="relative aspect-[4/3]">
                        <MediaImage media={a.cover} alt={a.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="font-medium">{a.name}</p>
                      <p className="text-sm text-[var(--color-muted)]">
                        {[
                          a.capacityMax && t("units.people", { count: a.capacityMax }),
                          a.sizeM2 && `${a.sizeM2} m²`,
                          a.bedrooms && t("units.bedrooms", { count: a.bedrooms }),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="services" className="mt-24">
          <h2 id="services" className="text-3xl font-bold">
            {t("nav.services")}
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {services.map((s) => (
              <li
                key={s.slug}
                className="flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-2 pr-4 text-sm"
              >
                {s.icon && <MediaImage media={s.icon} alt="" className="size-6" />}
                {s.name}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="gastronomy" className="mt-24">
          <h2 id="gastronomy" className="text-3xl font-bold">
            {t("nav.gastronomy")}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {restaurants.map((r) => (
              <li key={r.slug} className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
                {r.cover && (
                  <div className="relative aspect-square">
                    <MediaImage media={r.cover} alt={r.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-sm text-[var(--color-muted)]">{r.hours}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mt-24 border-t border-[var(--color-line)] pt-6 text-sm text-[var(--color-muted)]">
          <p>
            {settings.legalName} · {settings.address}
          </p>
          {settings.phone && (
            <p>
              {settings.phone.display} · {settings.email}
            </p>
          )}
          <p>{settings.licenseCode}</p>
        </footer>
      </div>
    </main>
  );
}
