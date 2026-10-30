import { NextResponse, type NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { isDay, mondayOf, todayAtCamping } from "@/lib/content/programme";
import { getWeekProgramme } from "@/lib/supabase/content";

// El programa d'una setmana, públic: el fa servir la web quan s'hi arriba (a la càrrega inicial no hi cal, i una pàgina en
// caché no sabria quina setmana és) i serveix per a qualsevol altre canal que hagi de dir què hi ha aquesta setmana.
// GET /api/programme?locale=ca&week=2027-07-05  (sense `week`, la setmana d'avui)

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") ?? routing.defaultLocale;
  const week = request.nextUrl.searchParams.get("week") ?? todayAtCamping(new Date());
  if (!hasLocale(routing.locales, locale) || !isDay(week)) return NextResponse.json({ error: "invalid params" }, { status: 400 });

  const monday = mondayOf(week);
  return NextResponse.json({ week: monday, sessions: await getWeekProgramme(locale, monday) });
}
