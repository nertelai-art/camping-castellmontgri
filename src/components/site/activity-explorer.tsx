"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RichText } from "@/components/rich-text";
import type { Activity } from "@/lib/supabase/content";

const AUDIENCES = ["children", "family", "adult"] as const;
type Audience = (typeof AUDIENCES)[number];

/**
 * Les activitats d'animació en targetes: foto, per a qui és, horari i una descripció curta (tres línies; «Llegir més» la desplega).
 * A dalt, un filtre per a qui és. Les targetes que apareixen en filtrar pugen l'una després de l'altra (`.card-in`).
 */
export function ActivityExplorer({ activities }: { activities: Activity[] }) {
  const t = useTranslations("entertainment");
  const [audience, setAudience] = useState<Audience | "all">("all");
  const present = AUDIENCES.filter((a) => activities.some((activity) => activity.audience === a));
  const list = audience === "all" ? activities : activities.filter((a) => a.audience === audience);

  return (
    <div>
      {present.length > 1 && (
        <div role="group" aria-label={t("filter")} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          {(["all", ...present] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={audience === key}
              onClick={() => setAudience(key)}
              className="shrink-0 whitespace-nowrap rounded-full border border-line px-5 py-2.5 font-bold text-ink transition hover:border-olive aria-pressed:border-olive aria-pressed:bg-olive aria-pressed:text-paper"
            >
              {key === "all" ? t("all") : t(`audience.${key}`)}
              <span className="ml-1.5 font-normal">{key === "all" ? activities.length : activities.filter((a) => a.audience === key).length}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((a, i) => (
          <ActivityCard key={`${audience}-${a.slug}`} activity={a} index={i} />
        ))}
      </ul>
    </div>
  );
}

function ActivityCard({ activity: a, index }: { activity: Activity; index: number }) {
  const t = useTranslations("entertainment");
  const tAcc = useTranslations("accommodation");
  const [expanded, setExpanded] = useState(false);
  const long = (a.description?.length ?? 0) > 150;

  return (
    <li data-edit={`activities:${a.slug}`} className="card-in group flex flex-col overflow-hidden rounded-3xl border border-line bg-card transition duration-300 hover:border-olive hover:shadow-[0_28px_44px_-24px_rgb(35_42_20/.4)]" style={{ ["--i" as string]: index % 9 }}>
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
        {a.cover && (
          <Image
            src={a.cover.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-105"
            style={{ objectPosition: a.cover.position }}
          />
        )}
        {a.audience && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-olive shadow-sm">{t(`audience.${a.audience as Audience}`)}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 data-edit-field="name" className="font-display text-2xl leading-tight text-olive">
          {a.name}
        </h3>
        {a.hours && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-terra">
            <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span data-edit-field="hours">{a.hours}</span>
          </p>
        )}
        {a.description && (
          <>
            <RichText field="description" text={a.description} className={`mt-3 leading-relaxed text-muted [&_strong]:text-ink ${long && !expanded ? "line-clamp-3" : "grid gap-3"}`} />
            {long && (
              <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-3 self-start text-sm font-bold text-olive underline underline-offset-4">
                {expanded ? tAcc("readLess") : tAcc("readMore")}
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
