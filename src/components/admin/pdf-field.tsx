"use client";

// Un camp amb l'adreça d'un PDF, que es pot pujar des d'aquí mateix. Com la resta de textos, es desa amb «Desa els canvis».

import { useId, useRef, useState } from "react";
import { pdfProblem } from "@/lib/admin/pdf";
import { uploadPdf } from "@/lib/supabase/browser";

type Props = {
  name: string;
  label: string;
  help?: string;
  lang: string;
  folder: string;
  value: string;
  onChange: (value: string) => void;
  /** Posa el mateix PDF als altres idiomes. */
  onApplyToAll: () => void;
};

export function PdfField({ name, label, help, lang, folder, value, onChange, onApplyToAll }: Props) {
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const id = useId();

  const upload = async (picked: File) => {
    setProblem(null);
    setUploaded(false);
    const invalid = pdfProblem(picked, new Uint8Array(await picked.slice(0, 5).arrayBuffer()));
    if (invalid) return setProblem(invalid);
    setUploading(true);
    const result = await uploadPdf(picked, folder);
    setUploading(false);
    if ("error" in result) return setProblem(`No s'ha pogut pujar: ${result.error}`);
    onChange(result.url);
    setUploaded(true);
  };

  return (
    <div className="text-base">
      <p className="font-bold">{label}</p>
      <input
        ref={file}
        type="file"
        accept="application/pdf"
        className="sr-only"
        aria-label={`Puja un PDF: ${label}`}
        onChange={(event) => {
          const picked = event.target.files?.[0];
          event.target.value = "";
          if (picked) void upload(picked);
        }}
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" disabled={uploading} onClick={() => file.current?.click()} className="rounded-full border border-line px-5 py-2.5 font-bold transition hover:border-olive disabled:opacity-60">
          {uploading ? "Pujant…" : value ? "Puja un altre PDF" : "Puja un PDF"}
        </button>
        {value && !uploading && (
          <>
            <a href={value} target="_blank" rel="noopener" className="font-bold text-terra hover:underline">
              Veure la carta ↗
            </a>
            <button type="button" onClick={onApplyToAll} className="font-bold text-terra hover:underline">
              Posa-la a tots els idiomes
            </button>
            <button type="button" onClick={() => onChange("")} className="font-bold text-terra hover:underline">
              Treu-la
            </button>
          </>
        )}
      </div>
      <div aria-live="polite" className="font-bold">
        {uploaded && <p className="mt-2 text-olive">PDF pujat. Per publicar-lo, prem «Desa els canvis».</p>}
        {problem && <p className="mt-2 text-terra">{problem}</p>}
      </div>
      <label htmlFor={id} className="mt-3 block text-muted">
        O enganxa&apos;n l&apos;adreça
      </label>
      <input
        id={id}
        type="text"
        name={name}
        lang={lang}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-line bg-card px-4 py-3 text-lg text-ink focus:border-olive focus:outline-none focus:ring-2 focus:ring-olive/30"
      />
      {help && <span className="mt-1 block text-muted">{help}</span>}
    </div>
  );
}
