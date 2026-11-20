"use client";

// La carcassa del panell: la barra lateral amb el menú (amb icones, es pot plegar a l'escriptori i al mòbil és un calaix)
// i la barra de dalt amb el que es fa més sovint: editar sobre la web, veure-la i el compte.

import { ChevronsLeft, ChevronsRight, ExternalLink, LogOut, Menu, MousePointerClick, Tent, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CHANGES_HREF, currentHref, NAV_GROUPS, NAV_HREFS, navItems, SIDEBAR_COOKIE, type NavIcon } from "@/lib/admin/nav";
import { AdminIcon } from "./admin-icons";

type Editor = { name: string | null; email: string; role: string };

const initials = (editor: Editor) =>
  (editor.name ?? editor.email)
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

function NavLink({ href, title, icon, current, collapsed, onClick }: { href: string; title: string; icon: NavIcon; current: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={current ? "page" : undefined}
      title={collapsed ? title : undefined}
      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[0.95rem] font-bold transition ${collapsed ? "lg:justify-center lg:px-0" : ""} ${
        current ? "bg-on-dark text-band-olive shadow-sm" : "text-on-dark/80 hover:bg-white/10 hover:text-on-dark"
      }`}
    >
      <AdminIcon name={icon} className="size-5 shrink-0" />
      <span className={collapsed ? "lg:sr-only" : "truncate"}>{title}</span>
    </Link>
  );
}

export function AdminShell({ editor, signOut, initialCollapsed, children }: { editor: Editor; signOut: () => Promise<void>; initialCollapsed: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const close = () => setOpen(false);
  const current = pathname === "/admin" ? "/admin" : currentHref(pathname, NAV_HREFS);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    // Una galeta del panell (no de la web): així la barra surt ja plegada en carregar, sense saltar.
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/admin; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="min-h-svh bg-paper-2/60 lg:flex">
      {open && <button type="button" aria-label="Tanca el menú" onClick={close} className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] lg:hidden" />}

      <aside
        id="admin-sidebar"
        aria-label="Menú del panell"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-band-olive text-on-dark transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-svh lg:translate-x-0 lg:transition-[width] ${
          // Tancat al mòbil, fora de la pantalla i també fora del teclat i del lector de pantalla.
          open ? "translate-x-0" : "invisible -translate-x-full lg:visible"
        } ${collapsed ? "lg:w-[4.75rem]" : "lg:w-64"}`}
      >
        <div className={`flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4 ${collapsed ? "lg:justify-center lg:px-0" : ""}`}>
          <Link href="/admin" onClick={close} className="flex min-w-0 items-center gap-3" title="Inici del panell">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-on-dark text-band-olive">
              <Tent aria-hidden="true" className="size-5" strokeWidth={2} />
            </span>
            <span className={`min-w-0 leading-tight ${collapsed ? "lg:sr-only" : ""}`}>
              <span className="font-display block truncate text-lg">Castell Montgrí</span>
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-on-dark/60">Panell de la web</span>
            </span>
          </Link>
          <button type="button" onClick={close} aria-label="Tanca el menú" className="ml-auto rounded-lg p-1.5 text-on-dark/80 hover:bg-white/10 lg:hidden">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <nav aria-label="Continguts" className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
          <NavLink href="/admin" title="Tauler" icon="home" current={current === "/admin"} collapsed={collapsed} onClick={close} />
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="mt-5">
              <p className={`px-3 pb-1.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-on-dark/50 ${collapsed ? "lg:sr-only" : ""}`}>{group.title}</p>
              {collapsed && <span aria-hidden="true" className="mx-auto mb-2 hidden h-px w-8 bg-white/15 lg:block" />}
              <ul className="grid gap-0.5">
                {navItems(group).map((item) => (
                  <li key={item.href}>
                    <NavLink {...item} current={current === item.href} collapsed={collapsed} onClick={close} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-3 py-3">
          <NavLink href={CHANGES_HREF} title="Registre de canvis" icon="history" current={current === CHANGES_HREF} collapsed={collapsed} onClick={close} />
          <button
            type="button"
            onClick={toggle}
            aria-pressed={collapsed}
            className={`mt-1 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-on-dark/60 transition hover:bg-white/10 hover:text-on-dark lg:flex ${collapsed ? "justify-center px-0" : ""}`}
            title={collapsed ? "Desplega el menú" : undefined}
          >
            {collapsed ? <ChevronsRight aria-hidden="true" className="size-5" /> : <ChevronsLeft aria-hidden="true" className="size-5" />}
            <span className={collapsed ? "sr-only" : ""}>{collapsed ? "Desplega el menú" : "Plega el menú"}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-card/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="admin-sidebar"
            className="-ml-1 flex items-center gap-2 rounded-lg p-2 font-bold text-ink hover:bg-paper-2 lg:hidden"
          >
            <Menu aria-hidden="true" className="size-5" />
            <span className="sr-only sm:not-sr-only">Menú</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/admin/visual"
              className="flex items-center gap-2 rounded-full bg-band-terra px-4 py-2 text-sm font-bold text-on-dark shadow-sm transition hover:brightness-110"
            >
              <MousePointerClick aria-hidden="true" className="size-4" />
              <span>
                Edita <span className="hidden sm:inline">sobre la web</span>
              </span>
            </Link>
            <a href="/" target="_blank" rel="noopener" className="hidden items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-bold text-ink transition hover:border-olive sm:flex">
              <ExternalLink aria-hidden="true" className="size-4" />
              Veure la web
            </a>
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-0.5 pr-2 transition hover:bg-paper-2 [&::-webkit-details-marker]:hidden" aria-label="El teu compte">
                <span className="grid size-9 place-items-center rounded-full bg-olive text-sm font-bold text-paper">{initials(editor)}</span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block max-w-40 truncate text-sm font-bold">{editor.name ?? editor.email}</span>
                  <span className="block text-xs text-muted">{editor.role === "admin" ? "Administració" : "Edició"}</span>
                </span>
              </summary>
              <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-2xl border border-line bg-card p-2 shadow-[0_24px_48px_-24px_rgb(35_42_20/.45)]">
                <p className="truncate px-3 pt-2 text-sm font-bold">{editor.name ?? editor.email}</p>
                <p className="truncate px-3 pb-2 text-xs text-muted">{editor.email}</p>
                <a href="/" target="_blank" rel="noopener" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold hover:bg-paper-2 sm:hidden">
                  <ExternalLink aria-hidden="true" className="size-4" />
                  Veure la web
                </a>
                <form action={signOut}>
                  <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-terra hover:bg-paper-2">
                    <LogOut aria-hidden="true" className="size-4" />
                    Tanca la sessió
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[88rem] flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
