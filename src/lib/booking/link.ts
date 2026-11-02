// L'enllaç al motor de reserves. Tot el que se sap de WitBooking és aquí: canviar de motor és tocar aquest fitxer.
// Els paràmetres s'han llegit del codi del motor i s'han provat a mà: `datein` i `dateout` en DD-MM-AAAA (en un altre format
// els ignora sense dir res), `adults` i `ninos`. L'idioma és el primer tram del camí.

export type BookingSearch = { locale?: string; checkIn?: string; checkOut?: string; adults?: number; children?: number };

const ENGINE_HOST = "engine.witbooking.com";

/** De la data d'un `<input type="date">` (AAAA-MM-DD) a la del motor (DD-MM-AAAA). */
const engineDate = (day: string) => day.split("-").toReversed().join("-");

/**
 * L'adreça configurada al panell, amb la cerca a dins. Si no és el motor conegut (s'ha canviat al panell),
 * es retorna tal qual: millor portar-hi sense dates que amb uns paràmetres que no entendria.
 */
export function bookingLink(base: string, { locale, checkIn, checkOut, adults, children }: BookingSearch = {}): string {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return base;
  }
  if (url.hostname !== ENGINE_HOST) return base;
  if (locale) url.pathname = url.pathname.replace(/^\/[a-z]{2}(?=\/)/, `/${locale}`);
  if (checkIn && checkOut) {
    url.searchParams.set("datein", engineDate(checkIn));
    url.searchParams.set("dateout", engineDate(checkOut));
  }
  if (adults) url.searchParams.set("adults", String(adults));
  if (children) url.searchParams.set("ninos", String(children));
  return url.toString();
}
