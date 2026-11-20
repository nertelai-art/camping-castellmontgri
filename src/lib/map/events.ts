import type { MapTarget } from "@/lib/supabase/content";

// Comunicació entre «Veure al plànol» (a qualsevol secció) i el visor, sense estat global.
export const MAP_FOCUS_EVENT = "camping:map-focus";

export const targetKey = (t: MapTarget) => `${t.type}:${t.slug}`;

export function showOnMap(target: MapTarget) {
  window.dispatchEvent(new CustomEvent<MapTarget>(MAP_FOCUS_EVENT, { detail: target }));
}

// Obrir el mapa sense triar cap lloc: el mapa flotant. Des d'una altra pàgina s'arriba a la portada amb `#explora` i s'obre en carregar.
export const MAP_OPEN_EVENT = "camping:map-open";
export const MAP_OPEN_HASH = "explora";

export function openMapView() {
  window.dispatchEvent(new Event(MAP_OPEN_EVENT));
}
