import { paragraphs, parseInline } from "@/lib/content/rich-text";

/** `field`: quin camp del contingut és, perquè l'editor visual el pugui anar actualitzant mentre s'escriu. */
export function RichText({ text, className, field }: { text: string | null | undefined; className?: string; field?: string }) {
  return (
    <div className={className} data-edit-field={field} data-edit-rich={field ? "" : undefined}>
      {paragraphs(text).map((p, i) => (
        <p key={i}>{parseInline(p).map((part, j) => (part.bold ? <strong key={j}>{part.text}</strong> : part.text))}</p>
      ))}
    </div>
  );
}
