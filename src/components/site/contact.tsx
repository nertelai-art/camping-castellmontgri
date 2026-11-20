import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { RichText } from "@/components/rich-text";
import { bookingLink } from "@/lib/booking/link";
import { formatDayMonth } from "@/lib/content/format";
import type { Section, SiteSettings } from "@/lib/supabase/content";

/**
 * Contacte, a la portada: el menú «Contacte» hi porta. El títol i la frase són de la secció (panell); el telèfon, els correus,
 * l'adreça i la temporada, de les dades generals. A la dreta, la reserva. Una dada que no hi és, no surt.
 */
export async function Contact({ section, settings }: { section: Section; settings: SiteSettings }) {
  const [t, tFooter, tHero, tNav, locale] = await Promise.all([
    getTranslations("contact"),
    getTranslations("footer"),
    getTranslations("hero"),
    getTranslations("nav"),
    getLocale(),
  ]);
  const { phone, emails, address, season, bookingUrl } = settings;
  const street = [address.street, [address.postalCode, address.locality].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <section data-edit="sections:contact" id="contact" aria-labelledby="contact-title" className="cv mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
        <div className="reveal">
          {section.eyebrow && (
            <p data-edit-field="eyebrow" className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-terra">
              {section.eyebrow}
            </p>
          )}
          <h2 id="contact-title" data-edit-field="title" className="font-display text-4xl leading-[1.04] text-olive sm:text-5xl lg:text-6xl">
            {section.title}
          </h2>
          <RichText field="body" text={section.body} className="mt-6 grid gap-4 text-lg leading-relaxed text-muted" />
          {bookingUrl && (
            <div className="mt-10 rounded-[1.75rem] bg-band-olive p-7 text-on-dark">
              <p className="font-display text-2xl">{t("bookTitle")}</p>
              <p className="mt-2 text-on-dark/85">{t("bookText")}</p>
              <a href={bookingLink(bookingUrl, { locale })} target="_blank" rel="noopener" className="mt-5 inline-block rounded-full bg-white px-7 py-3 font-bold text-band-olive transition hover:bg-on-dark">
                {tNav("book")}
              </a>
            </div>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2">
          {phone && (
            <Card icon="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" title={t("call")}>
              {phone.e164 ? (
                <a href={`tel:${phone.e164}`} className="font-display text-2xl text-olive hover:text-terra">
                  {phone.display}
                </a>
              ) : (
                <p className="font-display text-2xl text-olive">{phone.display}</p>
              )}
            </Card>
          )}
          {(emails.info || emails.reservations) && (
            <Card icon="M4 6h16v12H4zM4 7l8 6 8-6" title={t("write")}>
              <dl className="grid gap-2 text-sm">
                {emails.info && <Email label={t("info")} address={emails.info} />}
                {emails.reservations && <Email label={t("reservations")} address={emails.reservations} />}
              </dl>
            </Card>
          )}
          {street && (
            <Card icon="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5" title={t("visit")}>
              <p className="text-ink">{street}</p>
              <a href="#directions" className="mt-3 inline-block text-sm font-bold text-terra hover:underline">
                {tFooter("howToGet")}
              </a>
            </Card>
          )}
          {season.open && season.close && (
            <Card icon="M7 3.5v3M17 3.5v3M4 9.5h16M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5z" title={tFooter("season")}>
              <p className="font-display text-xl text-olive">
                {tHero("from", { open: formatDayMonth(season.open, locale), close: formatDayMonth(season.close, locale) })}
              </p>
            </Card>
          )}
        </ul>
      </div>
    </section>
  );
}

function Card({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <li className="reveal flex flex-col rounded-[1.75rem] border border-line bg-card p-6 transition hover:border-olive">
      <span className="grid size-12 place-items-center rounded-2xl bg-paper-2 text-olive">
        <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
          <path d={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <h3 className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-muted">{title}</h3>
      <div className="mt-2">{children}</div>
    </li>
  );
}

function Email({ label, address }: { label: string; address: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>
        <a href={`mailto:${address}`} className="break-all font-bold text-olive hover:text-terra">
          {address}
        </a>
      </dd>
    </div>
  );
}
