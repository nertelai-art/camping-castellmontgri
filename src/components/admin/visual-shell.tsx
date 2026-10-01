"use client";

// L'editor visual: la web de debò a l'esquerra (dins d'un iframe del mateix origen) i, a la dreta, l'editor del bloc
// que s'hi clica. La web no carrega cap codi d'edició: només porta marques `data-edit`, i és aquesta pàgina qui hi
// posa els ressaltats i escolta els clics des de fora. Mentre s'escriu, el text es pinta a la web directament (és un
// esborrany: encara no s'ha desat); en desar, la web es recarrega al mateix punt amb el contingut de debò.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/admin/entities";
import {
  DRAFT_EVENT,
  editMark,
  LOCALE_EVENT,
  parseEditMark,
  parseFieldName,
  SAVED_EVENT,
  targetFromPath,
  targetKind,
  visualHref,
  type DraftDetail,
  type EditTarget,
} from "@/lib/admin/visual";
import { paragraphs, parseInline } from "@/lib/content/rich-text";

const STYLE = `
  [data-edit] { cursor: pointer !important; }
  .admin-edit-hover { outline: 3px dashed #e2572c !important; outline-offset: -3px !important; }
  .admin-edit-selected { outline: 4px solid #e2572c !important; outline-offset: -4px !important; }
`;

const TOGGLE = "rounded-full border border-line px-3.5 py-1.5 text-sm font-bold transition hover:border-olive aria-pressed:border-olive aria-pressed:bg-olive aria-pressed:text-paper";

export function VisualShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const frame = useRef<HTMLIFrameElement>(null);
  const editor = useRef<HTMLElement>(null);
  const [locale, setLocale] = useState<Locale>("ca");
  const [phone, setPhone] = useState(false);
  const [editing, setEditing] = useState(true);
  // Els blocs que contenen el que s'ha clicat, de fora cap a dins: per poder pujar a la secció des d'una fitxa.
  const [chain, setChain] = useState<EditTarget[]>([]);
  const selected = targetFromPath(pathname);
  const selectedMark = selected ? editMark(selected) : null;

  // Els escoltadors de l'iframe viuen més que un render: llegeixen l'estat actual per referència.
  const live = useRef({ editing, selectedMark, locale });
  useEffect(() => {
    live.current = { editing, selectedMark, locale };
  }, [editing, selectedMark, locale]);
  // Hi ha text pintat a la web que no s'ha desat: si es canvia de bloc sense desar, la web es recarrega per treure'l.
  const dirty = useRef(false);

  const reload = useCallback(() => {
    const view = frame.current?.contentWindow;
    if (!view) return;
    dirty.current = false;
    const top = view.scrollY;
    frame.current?.addEventListener("load", () => frame.current?.contentWindow?.scrollTo({ top, behavior: "instant" }), { once: true });
    view.location.reload();
  }, []);

  const markSelected = useCallback((scroll: boolean) => {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    doc.querySelectorAll(".admin-edit-selected").forEach((el) => el.classList.remove("admin-edit-selected"));
    const mark = live.current.selectedMark;
    const el = mark && live.current.editing ? doc.querySelector(`[data-edit="${CSS.escape(mark)}"]`) : null;
    if (!el) return;
    el.classList.add("admin-edit-selected");
    if (scroll) el.scrollIntoView({ block: "nearest" });
  }, []);

  /** Cada cop que l'iframe carrega una pàgina: estils de ressaltat i escoltadors. */
  const attach = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.body) return;
    const style = doc.createElement("style");
    style.textContent = STYLE;
    style.dataset.adminEdit = "";
    doc.head.append(style);
    style.disabled = !live.current.editing;

    const closest = (target: EventTarget | null) => (target instanceof doc.defaultView!.Element ? target.closest("[data-edit]") : null);
    doc.addEventListener("mouseover", (event) => {
      if (!live.current.editing) return;
      doc.querySelectorAll(".admin-edit-hover").forEach((el) => el.classList.remove("admin-edit-hover"));
      closest(event.target)?.classList.add("admin-edit-hover");
    });
    doc.addEventListener("mouseleave", () => doc.querySelectorAll(".admin-edit-hover").forEach((el) => el.classList.remove("admin-edit-hover")));
    // En captura i aturant-lo: en mode d'edició un clic tria el bloc, no obre enllaços ni diàlegs de la web.
    doc.addEventListener(
      "click",
      (event) => {
        if (!live.current.editing) return;
        event.preventDefault();
        event.stopPropagation();
        const targets: EditTarget[] = [];
        for (let el = closest(event.target); el; el = el.parentElement?.closest("[data-edit]") ?? null) {
          const target = parseEditMark(el.getAttribute("data-edit"));
          if (target) targets.unshift(target);
        }
        const target = targets.at(-1);
        if (!target) return;
        setChain(targets);
        router.push(visualHref(target), { scroll: false });
      },
      true,
    );
    markSelected(false);
  }, [markSelected, router]);

  // Mode d'edició o de navegació: els ressaltats s'encenen i s'apaguen sense recarregar.
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    const style = doc?.querySelector<HTMLStyleElement>("style[data-admin-edit]");
    if (style) style.disabled = !editing;
    markSelected(false);
  }, [editing, markSelected]);

  useEffect(() => {
    if (dirty.current) reload();
    markSelected(true);
    // Un bloc nou comença a dalt de tot de l'editor.
    editor.current?.scrollTo({ top: 0 });
  }, [selectedMark, markSelected, reload]);

  // Quan un formulari desa, la web es torna a carregar al mateix punt de scroll.
  useEffect(() => {
    window.addEventListener(SAVED_EVENT, reload);
    return () => window.removeEventListener(SAVED_EVENT, reload);
  }, [reload]);

  // Mentre s'escriu: el text del camp es pinta al bloc seleccionat, si la web ensenya aquell idioma.
  useEffect(() => {
    const paint = (event: Event) => {
      const { name, value } = (event as CustomEvent<DraftDetail>).detail;
      const { locale: fieldLocale, field } = parseFieldName(name);
      const doc = frame.current?.contentDocument;
      const mark = live.current.selectedMark;
      if (!doc || !mark || (fieldLocale && fieldLocale !== live.current.locale)) return;
      const root = doc.querySelector(`[data-edit="${CSS.escape(mark)}"]`);
      if (!root) return;
      for (const el of root.querySelectorAll(`[data-edit-field="${CSS.escape(field)}"]`)) {
        // Només els camps d'aquest bloc, no els d'un bloc que hi viu a dins (la fitxa d'una secció).
        if (el.closest("[data-edit]") !== root) continue;
        dirty.current = true;
        if (!el.hasAttribute("data-edit-rich")) {
          el.textContent = value;
          continue;
        }
        // El mateix marcat lleuger que la web: paràgrafs i **negreta**. Sense HTML: tot entra com a text.
        el.replaceChildren(
          ...paragraphs(value).map((paragraph) => {
            const p = doc.createElement("p");
            p.append(...parseInline(paragraph).map((part) => (part.bold ? Object.assign(doc.createElement("strong"), { textContent: part.text }) : part.text)));
            return p;
          }),
        );
      }
    };
    // Canviar de pestanya d'idioma al formulari canvia l'idioma de la web: es veu el que s'edita.
    const follow = (event: Event) => setLocale((event as CustomEvent<Locale>).detail);
    window.addEventListener(DRAFT_EVENT, paint);
    window.addEventListener(LOCALE_EVENT, follow);
    return () => {
      window.removeEventListener(DRAFT_EVENT, paint);
      window.removeEventListener(LOCALE_EVENT, follow);
    };
  }, []);

  return (
    <div className="grid h-svh grid-rows-[auto_minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_30rem] lg:grid-rows-[auto_minmax(0,1fr)]">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-card px-4 py-2.5 lg:col-span-2">
        <Link href="/admin" className="text-base font-bold text-terra hover:underline">
          ← Panell
        </Link>
        <p className="font-display text-xl text-olive">Edita sobre la web</p>
        <div className="flex flex-wrap items-center gap-1.5 lg:ml-auto">
          <button type="button" aria-pressed={editing} onClick={() => setEditing(true)} className={TOGGLE}>
            Edita
          </button>
          <button type="button" aria-pressed={!editing} onClick={() => setEditing(false)} className={TOGGLE} title="Per obrir diàlegs i menús de la web com un visitant">
            Navega
          </button>
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-line" />
          <button type="button" aria-pressed={!phone} onClick={() => setPhone(false)} className={TOGGLE}>
            Ordinador
          </button>
          <button type="button" aria-pressed={phone} onClick={() => setPhone(true)} className={TOGGLE}>
            Mòbil
          </button>
          <label className="ml-1 flex items-center gap-2 text-sm font-bold">
            <span className="sr-only">Idioma de la web</span>
            <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)} className="rounded-full border border-line bg-card px-3 py-1.5">
              {LOCALES.map((l) => (
                <option key={l} value={l}>
                  {LOCALE_NAMES[l]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="min-h-0 overflow-hidden bg-paper-2">
        <iframe
          ref={frame}
          key={locale}
          src={`/${locale}`}
          title="La web, tal com la veuen els visitants"
          onLoad={attach}
          className="mx-auto block h-full border-0 bg-paper shadow-[0_0_0_1px_var(--color-line)] transition-[width] duration-300"
          style={{ width: phone ? "390px" : "100%" }}
        />
      </div>

      <aside ref={editor} aria-label="Editor" className="min-h-0 overflow-y-auto border-t border-line bg-paper px-5 pb-0 pt-5 lg:border-l lg:border-t-0">
        {chain.length > 1 && selected && chain.some((t) => editMark(t) === selectedMark) && (
          <nav aria-label="Dins de" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
            {chain.map((target, i) => (
              <span key={editMark(target)} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">›</span>}
                <Link href={visualHref(target)} aria-current={editMark(target) === selectedMark ? "true" : undefined} className="rounded-full border border-line px-3 py-1 font-bold transition hover:border-olive aria-[current]:border-olive aria-[current]:bg-olive aria-[current]:text-paper">
                  {targetKind(target)}
                </Link>
              </span>
            ))}
          </nav>
        )}
        {children}
      </aside>
    </div>
  );
}
