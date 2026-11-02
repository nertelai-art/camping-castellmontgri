"use client";

// Els blocs de la portada: amunt i avall, i si surten o no. Cada canvi es desa a l'instant i la web el fa servir de seguida.

import Link from "next/link";
import { useState, useTransition } from "react";
import { moveHomeBlockAction, updateFieldAction } from "@/app/admin/actions";
import { entityHref } from "@/lib/admin/nav";
import type { HomeBlock } from "@/lib/content/home";
import { ReorderButtons } from "./reorder-buttons";

export type HomeBlockItem = { key: HomeBlock; title: string; visible: boolean; hint: string };

export function HomeBlocks({ blocks }: { blocks: HomeBlockItem[] }) {
  return (
    <ol className="mt-6 grid max-w-3xl gap-2">
      {blocks.map((block, i) => (
        <HomeBlockRow key={block.key} block={block} first={i === 0} last={i === blocks.length - 1} />
      ))}
    </ol>
  );
}

function HomeBlockRow({ block, first, last }: { block: HomeBlockItem; first: boolean; last: boolean }) {
  const [pending, startTransition] = useTransition();
  const [visible, setVisible] = useState(block.visible);
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    const next = !visible;
    setVisible(next);
    startTransition(async () => {
      const state = await updateFieldAction("sections", block.key, "is_visible", next);
      if (state.errors) {
        setVisible(!next);
        setError(state.errors.join(" "));
      } else setError(null);
    });
  };

  return (
    <li className={`flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-4 ${visible ? "" : "opacity-60"}`}>
      <ReorderButtons name={block.title} first={first} last={last} move={(delta) => moveHomeBlockAction(block.key, delta)} />
      <div className="min-w-48 flex-1">
        <p className="font-bold text-ink">{block.title}</p>
        <p className="text-sm text-muted">{block.hint}</p>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink">
        <input type="checkbox" checked={visible} onChange={toggle} disabled={pending} className="size-5 accent-[var(--olive)]" />
        Es veu a la web
      </label>
      <Link href={`${entityHref("sections")}/${block.key}`} className="rounded-full border border-line px-4 py-2 text-sm font-bold text-olive transition hover:border-olive">
        Edita el text
      </Link>
      {error && (
        <p role="alert" className="w-full text-sm font-bold text-terra">
          {error}
        </p>
      )}
    </li>
  );
}
