// Geometria del visor del plànol: una capa escalada (z) i desplaçada (x, y) dins un marc de mida fixa.
// Funcions pures perquè es puguin provar sense navegador.

export type View = { x: number; y: number; z: number };
export type Size = { w: number; h: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 6;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Manté el plànol cobrint tot el marc: ni zoom fora de límits ni vores buides. */
export function clampView(view: View, size: Size): View {
  const z = clamp(view.z, MIN_ZOOM, MAX_ZOOM);
  return {
    z,
    x: clamp(view.x, size.w - size.w * z, 0),
    y: clamp(view.y, size.h - size.h * z, 0),
  };
}

/** Amplia o redueix mantenint quiet el punt (px, py) del marc (on és el dit o el cursor). */
export function zoomAt(view: View, factor: number, px: number, py: number, size: Size): View {
  const z = clamp(view.z * factor, MIN_ZOOM, MAX_ZOOM);
  const k = z / view.z;
  return clampView({ z, x: px - (px - view.x) * k, y: py - (py - view.y) * k }, size);
}

/** Centra un punt del plànol (en % de la il·lustració) al mig del marc, amb el zoom demanat. */
export function centerOn(xPct: number, yPct: number, z: number, size: Size): View {
  const zz = clamp(z, MIN_ZOOM, MAX_ZOOM);
  const px = (xPct / 100) * size.w * zz;
  const py = (yPct / 100) * size.h * zz;
  return clampView({ z: zz, x: size.w / 2 - px, y: size.h / 2 - py }, size);
}
