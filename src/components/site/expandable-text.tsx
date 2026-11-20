"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { RichText } from "@/components/rich-text";

/** Un text de targeta: tres línies i «Llegir més» per desplegar-lo, si és llarg. Sense JS es veuen les tres línies. */
export function ExpandableText({ text, field, limit = 150, className = "" }: { text: string | null; field?: string; limit?: number; className?: string }) {
  const t = useTranslations("accommodation");
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const long = text.length > limit;
  return (
    <>
      <RichText field={field} text={text} className={`leading-relaxed text-muted [&_strong]:text-ink ${long && !expanded ? "line-clamp-3" : "grid gap-3"} ${className}`} />
      {long && (
        <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-3 self-start text-sm font-bold text-olive underline underline-offset-4">
          {expanded ? t("readLess") : t("readMore")}
        </button>
      )}
    </>
  );
}
