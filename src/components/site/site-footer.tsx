import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { directionsUrl, formatDayMonth } from "@/lib/content/format";
import type { SiteSettings } from "@/lib/supabase/content";
import type { MediaRef } from "@/lib/supabase/media";
import { MontgriLine } from "./montgri-line";

export async function SiteFooter({ settings, accreditations, locale }: { settings: SiteSettings; accreditations: MediaRef[]; locale: string }) {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tHero = await getTranslations("hero");
  const { address } = settings;

  return (
    <footer id="contact" className="relative bg-band-olive pt-24 text-on-dark">
      <MontgriLine className="absolute inset-x-0 top-0 h-20 w-full -translate-y-full text-olive" />
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div className="lg:col-span-2">
          <p className="font-display text-4xl leading-tight sm:text-5xl">{settings.brandName}</p>
          <p className="mt-4 max-w-sm text-on-dark/80">{settings.legalName}</p>
          {settings.bookingUrl && (
            <a href={settings.bookingUrl} target="_blank" rel="noopener" className="mt-8 inline-block rounded-full bg-band-terra px-6 py-3 font-bold hover:brightness-110">
              {tNav("book")}
            </a>
          )}
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-on-dark/70">{t("contact")}</h2>
          <address className="mt-4 grid gap-2 not-italic">
            <span>{address.street}</span>
            <span>
              {address.postalCode} {address.locality} ({address.region})
            </span>
            {settings.phone && (
              <a href={`tel:${settings.phone.e164}`} className="mt-2 font-bold hover:underline">
                {settings.phone.display}
              </a>
            )}
            {settings.emails.info && (
              <a href={`mailto:${settings.emails.info}`} className="hover:underline">
                {settings.emails.info}
              </a>
            )}
          </address>
          {settings.geo && (
            <a href={directionsUrl(settings.geo.lat, settings.geo.lng)} target="_blank" rel="noopener" className="mt-4 inline-block font-bold text-foam hover:underline">
              {t("howToGet")} ↗
            </a>
          )}
        </div>

        <div>
          {settings.season.open && settings.season.close && (
            <>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-on-dark/70">{t("season")}</h2>
              <p className="font-display mt-4 text-2xl">
                {tHero("from", { open: formatDayMonth(settings.season.open, locale), close: formatDayMonth(settings.season.close, locale) })}
              </p>
            </>
          )}
          {settings.clientPortalUrl && (
            <a href={`${settings.clientPortalUrl}/${locale}`} target="_blank" rel="noopener" className="mt-6 inline-block font-bold hover:underline">
              {tNav("clientArea")} ↗
            </a>
          )}
        </div>
      </div>

      {accreditations.length > 0 && (
        <ul className="mx-auto mt-16 flex max-w-7xl flex-wrap items-center gap-6 px-4 sm:px-6 lg:px-8">
          {accreditations.map((a) => (
            <li key={a.path} className="rounded-xl bg-paper/95 p-2">
              <MediaImage media={a} alt={a.alt || a.path.split("/").pop()!.replace(/\.\w+$/, "")} className="h-10 w-auto" sizes="120px" />
            </li>
          ))}
        </ul>
      )}

      <div className="mx-auto mt-16 flex max-w-7xl flex-wrap justify-between gap-4 border-t border-on-dark/20 px-4 py-6 text-sm text-on-dark/70 sm:px-6 lg:px-8">
        <p>
          © {settings.season.open?.slice(0, 4)} {settings.legalName}. {t("rights")}
        </p>
        {settings.licenseCode && (
          <p>
            {t("license")}: {settings.licenseCode}
          </p>
        )}
      </div>
    </footer>
  );
}
