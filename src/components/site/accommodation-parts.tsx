import { useLocale, useTranslations } from "next-intl";
import type { Accommodation } from "@/lib/supabase/content";

// Peces que comparteixen la targeta (client) i la pàgina de detall (servidor): sense `"use client"` ni hooks d'estat.

// Icones de les dades (traç de 24 px): persones, superfície, habitacions, banys, aire condicionat i adaptat.
const SPEC_ICON = {
  people: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.7a3 3 0 0 1 0 5.6",
  size: "M4 9V4h5M20 15v5h-5M4 4l6.5 6.5M20 20l-6.5-6.5M15 4h5v5M9 20H4v-5",
  bedrooms: "M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M3 18v1.5M21 18v1.5M7 9V7.5A1.5 1.5 0 0 1 8.5 6h7A1.5 1.5 0 0 1 17 7.5V9",
  bathrooms: "M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6.5A2.5 2.5 0 0 1 8.5 4c1.2 0 2.1.8 2.4 1.9M7 19l-1 2M17 19l1 2",
  airConditioning: "M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5",
  accessible: "M11 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3M11 8v6h5l2.5 5M11 10.5h4M8 12.2A5 5 0 1 0 14.5 19",
} as const;

export type SpecIcon = keyof typeof SPEC_ICON;

export function SpecGlyph({ icon, className }: { icon: SpecIcon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={SPEC_ICON[icon]} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Les dades de l'allotjament amb icona. A la targeta, les tres principals; a la fitxa (`large`), totes. */
export function Specs({ a, large = false }: { a: Accommodation; large?: boolean }) {
  const t = useTranslations("accommodation");
  const items = [
    a.capacityMax && { icon: "people", text: t("people", { count: a.capacityMax }) },
    a.sizeM2 && { icon: "size", text: t("size", { value: a.sizeM2 }) },
    a.bedrooms ? { icon: "bedrooms", text: t("bedrooms", { count: a.bedrooms }) } : null,
    large && a.bathrooms ? { icon: "bathrooms", text: t("bathrooms", { count: a.bathrooms }) } : null,
    large && a.airConditioning ? { icon: "airConditioning", text: t("airConditioning") } : null,
    large && a.isAccessible ? { icon: "accessible", text: t("accessible") } : null,
  ].filter((item): item is { icon: SpecIcon; text: string } => Boolean(item));
  return (
    <ul className={`flex flex-wrap ${large ? "gap-x-6 gap-y-3 text-base font-bold text-ink" : "gap-x-4 gap-y-1.5 text-sm text-muted"}`}>
      {items.map((item) => (
        <li key={item.icon} className="flex items-center gap-1.5">
          <SpecGlyph icon={item.icon} className={`shrink-0 text-olive ${large ? "size-6" : "size-[1.1rem]"}`} />
          {item.text}
        </li>
      ))}
    </ul>
  );
}

/** «des de 31 €/nit». Sense preu no s'ensenya res: un preu inventat seria pitjor que cap. */
export function Price({ value, large = false }: { value: number | null; large?: boolean }) {
  const t = useTranslations("accommodation");
  const locale = useLocale();
  if (value == null) return null;
  return (
    <p className="text-sm leading-tight text-muted">
      {t("from")}
      <span className={`block font-bold text-ink ${large ? "text-3xl" : "text-lg"}`}>
        {new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)}
        <span className="text-sm font-normal text-muted">{t("perNight")}</span>
      </span>
    </p>
  );
}
