"use client";

// Fletxes per pujar o baixar un contingut dins la seva llista. Es desa a l'instant.

import { useState, useTransition } from "react";
import type { FormState } from "@/app/admin/actions";

type Props = { name: string; first: boolean; last: boolean; move: (delta: 1 | -1) => Promise<FormState> };

const BUTTON = "grid size-9 place-items-center rounded-full border border-line bg-card text-base font-bold transition hover:border-olive disabled:opacity-30";

export function ReorderButtons({ name, first, last, move }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (delta: 1 | -1) =>
    startTransition(async () => {
      const state = await move(delta);
      setError(state.errors?.join(" ") ?? null);
    });

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button type="button" disabled={pending || first} onClick={() => run(-1)} aria-label={`Puja «${name}»`} className={BUTTON}>
        ↑
      </button>
      <button type="button" disabled={pending || last} onClick={() => run(1)} aria-label={`Baixa «${name}»`} className={BUTTON}>
        ↓
      </button>
      {error && (
        <p role="alert" className="text-sm font-bold text-terra">
          {error}
        </p>
      )}
    </div>
  );
}
