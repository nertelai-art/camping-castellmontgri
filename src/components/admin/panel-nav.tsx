"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ENTITIES } from "@/lib/admin/entities";
import { entityHref, isCurrent, NAV_GROUPS } from "@/lib/admin/nav";

const ITEM = "block rounded-xl px-3 py-2 text-base font-bold transition";

function Item({ href, current, onClick, children }: { href: string; current: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Link href={href} onClick={onClick} aria-current={current ? "page" : undefined} className={`${ITEM} ${current ? "bg-olive text-paper" : "text-ink hover:bg-paper-2"}`}>
      {children}
    </Link>
  );
}

/** El menú per temes i, a sota, el compte (`children`). Al mòbil es plega perquè la feina no quedi a sota d'una dotzena d'enllaços. */
export function PanelNav({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="panel-nav"
        className="mt-3 w-full rounded-2xl border border-line px-4 py-3 text-left text-base font-bold text-ink lg:hidden"
      >
        {open ? "Tanca el menú" : "Menú"}
      </button>
      <div id="panel-nav" className={`mt-5 ${open ? "block" : "hidden"} lg:block`}>
        <nav aria-label="Continguts">
          <Item href="/admin" current={pathname === "/admin"} onClick={close}>
            Inici
          </Item>
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mt-4">
              <p className="px-3 text-sm font-bold uppercase tracking-[0.16em] text-muted">{group.title}</p>
              <ul className="mt-1 grid gap-0.5">
                {group.pages?.map((page) => (
                  <li key={page.href}>
                    <Item href={page.href} current={isCurrent(pathname, page.href)} onClick={close}>
                      {page.title}
                    </Item>
                  </li>
                ))}
                {group.entities.map((name) => (
                  <li key={name}>
                    <Item href={entityHref(name)} current={isCurrent(pathname, entityHref(name))} onClick={close}>
                      {ENTITIES[name].title}
                    </Item>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-4 border-t border-line pt-3">
            <Item href="/admin/changes" current={isCurrent(pathname, "/admin/changes")} onClick={close}>
              Registre de canvis
            </Item>
          </div>
        </nav>
        {children}
      </div>
    </>
  );
}
