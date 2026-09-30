/** «2026-04-27» → «27 d'abril» / «27 april»… Sense dependre de la zona horària del servidor. */
export function formatDayMonth(isoDate: string, locale: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(date);
}

/** Enllaç de Google Maps per arribar-hi: un enllaç normal, sense incrustar res (ni galetes). */
export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
