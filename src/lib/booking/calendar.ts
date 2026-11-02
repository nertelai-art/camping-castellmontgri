// El calendari de la cerca de reserva: dies com a text AAAA-MM-DD (el que es compara i es desa). Sense rellotge a dins: «avui» entra per paràmetre.

export type Range = { checkIn: string; checkOut: string };
/** Un mes: `month` de 0 a 11, com a `Date`. */
export type Month = { year: number; month: number };

const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const parse = (day: string) => Date.UTC(Number(day.slice(0, 4)), Number(day.slice(5, 7)) - 1, Number(day.slice(8, 10)));

/** El dia al calendari de qui mira, no el de Greenwich: a les 00:30 d'aquí ja és l'endemà. */
export const localDay = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

export const addDays = (day: string, days: number) => toDay(new Date(parse(day) + days * 86_400_000));

export const nightsBetween = (checkIn: string, checkOut: string) => Math.round((parse(checkOut) - parse(checkIn)) / 86_400_000);

export const monthOf = (day: string): Month => ({ year: Number(day.slice(0, 4)), month: Number(day.slice(5, 7)) - 1 });

export const addMonths = ({ year, month }: Month, months: number): Month => {
  const total = year * 12 + month + months;
  return { year: Math.floor(total / 12), month: total % 12 };
};

/** Les caselles d'un mes, de dilluns a diumenge: `null` és una casella buida abans del dia 1. */
export function monthCells({ year, month }: Month): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const blanks = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [...Array<null>(blanks).fill(null), ...Array.from({ length: days }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`)];
}

/** El primer clic és l'entrada i el segon la sortida. Un dia que no va després de l'entrada torna a començar. */
export function pickDay({ checkIn, checkOut }: Range, day: string): Range {
  if (!checkIn || checkOut || day <= checkIn) return { checkIn: day, checkOut: "" };
  return { checkIn, checkOut: day };
}

/** Els noms curts dels dies, de dilluns a diumenge (l'1 de gener de 2024 va ser dilluns). */
export const weekdayNames = (locale: string) =>
  Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(Date.UTC(2024, 0, 1 + i)));

export const formatDay = (day: string, locale: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(parse(day));

export const formatMonth = ({ year, month }: Month, locale: string) =>
  new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month, 1));
