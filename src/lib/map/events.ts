import type { MapTarget } from "@/lib/supabase/content";

// Comunicació entre «Veure al plànol» (a qualsevol secció) i el visor, sense estat global.
export const MAP_FOCUS_EVENT = "camping:map-focus";

export const targetKey = (t: MapTarget) => `${t.type}:${t.slug}`;

export function showOnMap(target: MapTarget) {
  window.dispatchEvent(new CustomEvent<MapTarget>(MAP_FOCUS_EVENT, { detail: target }));
}

// Obrir el mapa sense triar cap lloc: la imatge flotant «Explora el càmping».
export const MAP_OPEN_EVENT = "camping:map-open";

export function openMapView() {
  window.dispatchEvent(new Event(MAP_OPEN_EVENT));
}
