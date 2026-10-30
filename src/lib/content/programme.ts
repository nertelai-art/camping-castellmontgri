// El programa setmanal d'animació. Els dies són text («2027-07-05»), com la columna `date`: així no hi ha fus horari
// pel mig. L'hora d'ara entra sempre per paràmetre.

const DAY_MS = 86_400_000;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const toDate = (day: string) => new Date(`${day}T00:00:00Z`);
const toDay = (date: Date) => date.toISOString().slice(0, 10);

/** Si és un dia que existeix, escrit com a AAAA-MM-DD. */
export function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = toDate(value);
  return !Number.isNaN(date.getTime()) && toDay(date) === value;
}

export const addDays = (day: string, days: number) => toDay(new Date(toDate(day).getTime() + days * DAY_MS));

/** El dilluns de la setmana d'un dia. */
export const mondayOf = (day: string) => addDays(day, -((toDate(day).getUTCDay() + 6) % 7));

/** Els set dies d'una setmana, de dilluns a diumenge. */
export const weekDays = (monday: string) => Array.from({ length: 7 }, (_, i) => addDays(monday, i));

/** Quin dia és ara al càmping. */
export const todayAtCamping = (now: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(now);

/** Una hora de la base de dades («10:00:00»), tal com es llegeix («10:00»). */
export const shortTime = (time: string) => time.slice(0, 5);

export type SessionInput = { activityId: string; day: string; startsAt: string; endsAt: string | null; place: string | null };

/** Una sessió tal com arriba del formulari del panell, comprovada. */
export function parseSession(form: FormData): { ok: true; value: SessionInput } | { ok: false; errors: string[] } {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const activityId = text("activity_id");
  const day = text("day");
  const startsAt = text("starts_at");
  const endsAt = text("ends_at");
  const errors: string[] = [];
  if (!activityId) errors.push("Tria una activitat.");
  if (!isDay(day)) errors.push("El dia no és vàlid.");
  if (!TIME.test(startsAt)) errors.push("Escriu l'hora d'inici.");
  if (endsAt && !TIME.test(endsAt)) errors.push("L'hora de final no és vàlida.");
  else if (endsAt && TIME.test(startsAt) && endsAt <= startsAt) errors.push("L'hora de final ha de ser després de la d'inici.");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { activityId, day, startsAt, endsAt: endsAt || null, place: text("place") || null } };
}
