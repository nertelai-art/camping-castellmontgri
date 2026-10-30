import type { Metadata } from "next";
import Link from "next/link";
import { ProgrammeDay, ProgrammeWeekCopy } from "@/components/admin/programme-editor";
import { entityHref, PROGRAMME_HREF } from "@/lib/admin/nav";
import { addDays, isDay, mondayOf, todayAtCamping, weekDays } from "@/lib/content/programme";
import { listContent, listSessions } from "@/lib/supabase/admin-content";

export const metadata: Metadata = { title: "Programa setmanal" };

const format = (day: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("ca", { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
const NAV = "rounded-full border border-line px-4 py-2 text-base font-bold transition hover:border-olive";

export default async function Programme({ searchParams }: PageProps<"/admin/programme">) {
  const { week } = await searchParams;
  const today = todayAtCamping(new Date());
  const monday = mondayOf(isDay(week) ? week : today);
  const thisWeek = monday === mondayOf(today);
  const [activities, sessions] = await Promise.all([listContent("activities"), listSessions(monday)]);
  const names = new Map(activities.map((activity) => [activity.id, activity]));
  const options = activities.map((activity) => ({ id: activity.id, name: activity.published ? activity.name : `${activity.name} (esborrany)` }));
  const hidden = new Set(sessions.filter((session) => !names.get(session.activityId)?.published).map((session) => session.activityId));

  return (
    <>
      <h1 className="font-display text-4xl text-olive">Programa setmanal</h1>
      <p className="mt-2 max-w-2xl text-lg text-muted">Què es fa cada dia. A la web surt el de la setmana en curs, i cada canvi es desa sol.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href={`${PROGRAMME_HREF}?week=${addDays(monday, -7)}`} className={NAV}>
          ← Anterior
        </Link>
        <p className="font-display min-w-56 text-center text-2xl text-olive">
          {format(monday, { day: "numeric", month: "short" })} – {format(addDays(monday, 6), { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <Link href={`${PROGRAMME_HREF}?week=${addDays(monday, 7)}`} className={NAV}>
          Següent →
        </Link>
        {!thisWeek && (
          <Link href={PROGRAMME_HREF} className="text-base font-bold text-terra hover:underline">
            Torna a aquesta setmana
          </Link>
        )}
      </div>

      {options.length === 0 && (
        <p className="mt-8 max-w-3xl rounded-2xl border border-dashed border-line p-8 text-lg text-muted">
          Primer cal crear alguna activitat a{" "}
          <Link href={entityHref("activities")} className="font-bold text-terra hover:underline">
            Animació
          </Link>
          .
        </p>
      )}
      {hidden.size > 0 && (
        <p className="mt-6 max-w-3xl rounded-2xl border border-line bg-card p-4 text-base">
          Hi ha activitats en esborrany: no sortiran a la web fins que les publiquis a{" "}
          <Link href={entityHref("activities")} className="font-bold text-terra hover:underline">
            Animació
          </Link>
          .
        </p>
      )}

      <ProgrammeWeekCopy monday={monday} />

      <div className="mt-6 grid max-w-4xl gap-4">
        {weekDays(monday).map((day) => (
          <ProgrammeDay
            key={day}
            day={day}
            title={format(day, { weekday: "long", day: "numeric", month: "long" })}
            today={day === today}
            activities={options}
            sessions={sessions.filter((session) => session.day === day).map((session) => ({ ...session, name: names.get(session.activityId)?.name ?? "Sense nom" }))}
          />
        ))}
      </div>
    </>
  );
}
