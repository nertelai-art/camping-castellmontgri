import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { NavIcon } from "@/lib/admin/nav";
import { AdminIcon } from "./admin-icons";

/** El capçal de cada pàgina del panell: d'on penja, la icona i el títol, què s'hi fa i, a la dreta, els botons. */
export function PageHeader({ title, description, back, icon, actions }: { title: ReactNode; description?: ReactNode; back?: { href: string; label: string }; icon?: NavIcon; actions?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-wrap items-end gap-x-6 gap-y-4">
      <div className="min-w-0 flex-1 basis-80">
        {back && (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-muted transition hover:text-terra">
            <ChevronLeft aria-hidden="true" className="size-4" />
            {back.label}
          </Link>
        )}
        <div className="flex items-center gap-3">
          {icon && (
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-olive/10 text-olive">
              <AdminIcon name={icon} className="size-6" />
            </span>
          )}
          <h1 className="font-display min-w-0 text-3xl leading-tight text-olive sm:text-4xl">{title}</h1>
        </div>
        {description && <div className="mt-2 max-w-3xl text-base text-muted sm:text-lg">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** Un botó principal del panell (crear, desar…). */
export const PRIMARY = "inline-flex items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-base font-bold text-paper shadow-sm transition hover:brightness-110";
/** Un botó secundari, amb vora. */
export const SECONDARY = "inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-base font-bold text-ink transition hover:border-olive";
/** Una targeta del panell. */
export const CARD = "rounded-2xl border border-line bg-card shadow-[0_1px_2px_rgb(35_42_20/.05)]";
