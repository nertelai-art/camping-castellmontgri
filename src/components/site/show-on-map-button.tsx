"use client";

import { useTranslations } from "next-intl";
import { showOnMap } from "@/lib/map/events";
import type { MapTarget } from "@/lib/supabase/content";

/** Botó «Veure al plànol»: porta el visor fins al lloc i n'obre la fitxa. */
export function ShowOnMapButton({
  target,
  beforeShow,
  className = "",
}: {
  target: MapTarget;
  beforeShow?: () => void;
  className?: string;
}) {
  const t = useTranslations("map");
  return (
    <button type="button" onClick={() => {
        beforeShow?.();
        showOnMap(target);
      }} className={`inline-flex items-center gap-1.5 text-sm font-bold hover:underline ${className}`}>
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
        <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="9.5" r="2.5" fill="currentColor" />
      </svg>
      {t("showOnMap")}
    </button>
  );
}
