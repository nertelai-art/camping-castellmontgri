import { getTranslations } from "next-intl/server";
import { HeroShowcase } from "@/components/scene/HeroShowcase";
import { formatDayMonth } from "@/lib/content/format";
import { kindColor } from "@/lib/map/kinds";
import type { MapPoint, Section, SiteSettings } from "@/lib/supabase/content";

// Punts que cauen al plànol del hero: els llocs que més es busquen (no tots, que seria soroll).
const HERO_KINDS = new Set(["pool", "food", "leisure"]);

/**
 * Hero: foto aèria real com a primer fotograma i, amb el scroll, el «vol» 3D sobre el plànol il·lustrat.
 * Textos i dades surten de l'admin; aquí només es preparen per al component de client.
 */
export async function Hero({
  section,
  mapSection,
  mapPoints,
  settings,
  locale,
}: {
  section: Section;
  mapSection: Section | undefined;
  mapPoints: MapPoint[];
  settings: SiteSettings;
  locale: string;
}) {
  const t = await getTranslations("hero");
  const tNav = await getTranslations("nav");
  const plan = mapSection?.media ?? null;

  const season =
    settings.season.open && settings.season.close ? (
      <p
        className="rise grid size-28 rotate-6 place-content-center rounded-full border-2 border-dashed border-on-dark/70 bg-band-terra/90 p-3 text-center text-[0.68rem] font-bold uppercase leading-tight tracking-wider shadow-lg sm:size-36 sm:text-xs"
        style={{ ["--i" as string]: 4 }}
      >
        <span className="font-display text-2xl normal-case tracking-normal sm:text-3xl">{settings.season.open.slice(0, 4)}</span>
        {t("season")}
        <span className="mt-1 font-normal normal-case tracking-normal">
          {t("from", { open: formatDayMonth(settings.season.open, locale), close: formatDayMonth(settings.season.close, locale) })}
        </span>
      </p>
    ) : null;

  return (
    <HeroShowcase
      poster={section.media}
      title={section.title}
      body={section.body}
      primaryCta={settings.bookingUrl ? { href: settings.bookingUrl, label: section.ctaLabel ?? tNav("book") } : null}
      discoverLabel={t("discover")}
      season={season}
      map={mapSection ? { title: mapSection.title, body: mapSection.body, ctaLabel: mapSection.ctaLabel ?? tNav("map") } : null}
      // Textura de 2048 px servida per l'optimitzador de Next (mateix origen, sense problemes de CORS).
      textureSrc={plan ? `/_next/image?url=${encodeURIComponent(plan.src)}&w=2048&q=75` : null}
      pins={mapPoints.filter((p) => HERO_KINDS.has(p.kind)).map((p) => ({ x: p.x, y: p.y, color: kindColor(p.kind) }))}
      srDescription={t("sceneDescription")}
    />
  );
}
