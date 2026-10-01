"use client";

// La llista d'una entitat com una taula: una fila per contingut, amb la foto, el nom i les dades que no depenen de
// l'idioma editables allà mateix (com un full de càlcul). Cada cel·la es desa sola en sortir-ne. Els textos i les fotos
// s'editen a la fitxa, que s'obre clicant el nom.

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormState } from "@/app/admin/actions";
import { LOCALE_NAMES, type BaseField, type Locale } from "@/lib/admin/entities";
import { ReorderButtons } from "./reorder-buttons";

export type TableRow = { id: string; name: string; image: string | null; base: Record<string, string | boolean>; missing: Locale[] };
export type TableGroup = { name: string | null; rows: TableRow[] };

type Props = {
  entity: string;
  groups: TableGroup[];
  columns: BaseField[];
  hasImage: boolean;
  hasTranslations: boolean;
  sortable: boolean;
  update: (id: string, name: string, value: string | boolean) => Promise<FormState>;
  move: (id: string, delta: 1 | -1) => Promise<FormState>;
};

const TH = "px-3 py-2.5 text-left text-xs font-bold uppercase tracking-[0.14em] text-muted";
const TD = "px-3 py-2.5 align-middle";
const INPUT = "rounded-lg border border-line bg-paper px-2.5 py-1.5 text-base text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30";

function Cell({ field, value, rowName, save }: { field: BaseField; value: string | boolean; rowName: string; save: (value: string | boolean) => void }) {
  const label = `${field.label}: ${rowName}`;
  if (field.kind === "boolean") {
    return <input type="checkbox" aria-label={label} defaultChecked={value === true} onChange={(event) => save(event.target.checked)} className="size-5 accent-olive" />;
  }
  if (field.kind === "status") {
    const published = value === "published";
    return (
      <button
        type="button"
        role="switch"
        aria-checked={published}
        aria-label={label}
        onClick={() => save(published ? "draft" : "published")}
        className="whitespace-nowrap rounded-full border border-line px-3 py-1 text-sm font-bold text-muted transition hover:border-olive aria-checked:border-olive aria-checked:bg-olive aria-checked:text-paper"
      >
        {published ? "Publicat" : "Amagat"}
      </button>
    );
  }
  if (field.kind === "select") {
    return (
      <select aria-label={label} defaultValue={String(value)} onChange={(event) => save(event.target.value)} className={`${INPUT} max-w-44`}>
        {field.optional && <option value="">Cap</option>}
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <input
      type={field.kind === "date" ? "date" : "text"}
      inputMode={field.kind === "number" ? (field.decimal ? "decimal" : "numeric") : undefined}
      aria-label={label}
      defaultValue={String(value)}
      // Es desa en sortir de la cel·la, i només si ha canviat. Retorn = sortir.
      onBlur={(event) => event.target.value.trim() !== String(value) && save(event.target.value)}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      className={`${INPUT} ${field.kind === "number" ? "w-20" : field.kind === "date" ? "w-40" : "w-44"}`}
    />
  );
}

function Row({ row, index, count, ...props }: Omit<Props, "groups"> & { row: TableRow; index: number; count: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const save = (name: string) => (value: string | boolean) =>
    startTransition(async () => {
      const state = await props.update(row.id, name, value);
      setMessage(state.errors ? { ok: false, text: state.errors.join(" ") } : { ok: true, text: "Desat" });
    });
  const href = `/admin/${props.entity}/${encodeURIComponent(row.id)}`;

  return (
    <tr className="border-t border-line">
      {props.sortable && (
        <td className={TD}>
          <ReorderButtons name={row.name} first={index === 0} last={index === count - 1} move={(delta) => props.move(row.id, delta)} />
        </td>
      )}
      {props.hasImage && (
        <td className={TD}>
          <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
            {row.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura del panell
              <img src={row.image} alt="" loading="lazy" className="h-12 w-16 min-w-16 rounded-lg bg-paper-2 object-cover" />
            ) : (
              <span className="grid h-12 w-16 min-w-16 place-items-center rounded-lg border border-dashed border-line text-xs text-muted">Sense foto</span>
            )}
          </Link>
        </td>
      )}
      <th scope="row" className={`${TD} min-w-48 text-left`}>
        <Link href={href} className="text-lg font-bold text-ink underline-offset-4 hover:text-terra hover:underline">
          {row.name}
        </Link>
        <span aria-live="polite" className={`block text-sm font-bold ${message?.ok ? "text-olive" : "text-terra"}`}>
          {pending ? <span className="font-normal text-muted">Desant…</span> : message?.text}
        </span>
      </th>
      {props.columns.map((field) => (
        <td key={field.name} className={TD}>
          {/* key amb el valor: si el servidor torna un valor diferent (un altre editor, un error), la cel·la el mostra */}
          <Cell key={String(row.base[field.name])} field={field} value={row.base[field.name] ?? ""} rowName={row.name} save={save(field.name)} />
        </td>
      ))}
      {props.hasTranslations && (
        <td className={`${TD} text-sm`}>
          {row.missing.length === 0 ? (
            <span className="text-muted">Tots</span>
          ) : (
            <span className="rounded-full bg-band-terra px-2.5 py-0.5 font-bold text-on-dark">Falta: {row.missing.map((l) => LOCALE_NAMES[l].toLowerCase()).join(", ")}</span>
          )}
        </td>
      )}
      <td className={`${TD} text-right`}>
        <Link href={href} className="whitespace-nowrap rounded-full border border-line px-4 py-1.5 text-sm font-bold text-terra transition hover:border-terra">
          Textos i fotos →
        </Link>
      </td>
    </tr>
  );
}

export function ContentTable({ groups, ...props }: Props) {
  const span = props.columns.length + 2 + Number(props.sortable) + Number(props.hasImage) + Number(props.hasTranslations);
  return (
    // `relative`: els textos només per a lectors de pantalla són absoluts i, sense això, eixamplen la pàgina sencera.
    <div className="relative mt-6 overflow-x-auto rounded-2xl border border-line bg-card">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr>
            {props.sortable && <th className={TH}>Ordre</th>}
            {props.hasImage && <th className={TH}>Foto</th>}
            <th className={TH}>Nom</th>
            {props.columns.map((field) => (
              <th key={field.name} className={TH}>
                {field.label}
              </th>
            ))}
            {props.hasTranslations && <th className={TH}>Idiomes</th>}
            <th className={TH}>
              <span className="sr-only">Edita</span>
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.name ?? "tot"}>
            {group.name && (
              <tr className="border-t border-line bg-paper-2">
                <th colSpan={span} scope="colgroup" className="px-3 py-2 text-left font-display text-xl text-olive">
                  {group.name} <span className="font-body text-sm font-normal text-muted">· {group.rows.length}</span>
                </th>
              </tr>
            )}
            {group.rows.map((row, index) => (
              <Row key={row.id} row={row} index={index} count={group.rows.length} {...props} />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}
