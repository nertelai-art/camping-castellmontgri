import { paragraphs, parseInline } from "@/lib/content/rich-text";

export function RichText({ text, className }: { text: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      {paragraphs(text).map((p, i) => (
        <p key={i}>{parseInline(p).map((part, j) => (part.bold ? <strong key={j}>{part.text}</strong> : part.text))}</p>
      ))}
    </div>
  );
}
