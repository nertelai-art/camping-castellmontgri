import type { CSSProperties } from "react";
import { iconStyle } from "@/lib/map/icons";
import { kindColor } from "@/lib/map/kinds";
import type { MapPoint } from "@/lib/supabase/content";

/** La icona de la llegenda del punt; si no en té (allotjaments), un cercle del color del tipus amb una caseta. */
export function MarkerIcon({ point, className = "" }: { point: Pick<MapPoint, "icon" | "kind">; className?: string }) {
  if (point.icon) return <span aria-hidden="true" className={`block shrink-0 rounded-full bg-white ${className}`} style={iconStyle(point.icon)} />;
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full text-white ${className}`} style={{ background: kindColor(point.kind) }}>
      <svg viewBox="0 0 24 24" className="size-[58%]">
        <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" fill="currentColor" />
      </svg>
    </span>
  );
}

/** Marcador del mapa: la icona sobre una tija, amb el nom a sobre quan s'hi passa o està triat. */
export function MapMarker({
  point,
  selected,
  onClick,
  className = "",
  style,
}: {
  point: MapPoint;
  selected: boolean;
  onClick: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={point.label}
      aria-pressed={selected}
      className={`group pointer-events-auto flex flex-col items-center outline-none ${className}`}
      style={style}
    >
      <span className="pointer-events-none mb-1 hidden whitespace-nowrap rounded-full bg-ink px-3 py-1 text-sm font-bold text-paper shadow-lg group-hover:block group-focus-visible:block group-aria-pressed:block">
        {point.label}
      </span>
      <MarkerIcon
        point={point}
        className="size-9 shadow-[0_3px_10px_rgb(0_0_0/.45)] ring-2 ring-white transition-transform group-hover:scale-115 group-focus-visible:ring-4 group-focus-visible:ring-terra group-aria-pressed:scale-125 group-aria-pressed:ring-4 group-aria-pressed:ring-terra"
      />
      <span aria-hidden="true" className="h-2.5 w-0.5 bg-white shadow" />
    </button>
  );
}
