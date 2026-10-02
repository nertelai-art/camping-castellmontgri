import { RichText } from "@/components/rich-text";

type Props = {
  id: string;
  index: number;
  eyebrow: string;
  title: string;
  body?: string | null;
  highlight?: string | null;
  tone?: "light" | "dark";
  align?: "left" | "center";
  /** Nivell del titular: 1 quan la secció és tota la pàgina. */
  level?: 1 | 2;
};

/** Capçalera de secció a l'estil de guia de camp: número, subtítol petit i titular gran. */
export function SectionHeading({ id, index, eyebrow, title, body, highlight, tone = "light", align = "left", level = 2 }: Props) {
  const dark = tone === "dark";
  const Title = level === 1 ? "h1" : "h2";
  return (
    <header className={`reveal max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      <p
        className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] ${
          dark ? "text-on-dark" : "text-terra"
        } ${align === "center" ? "justify-center" : ""}`}
      >
        <span className="font-display text-sm normal-case tracking-normal">{String(index).padStart(2, "0")}</span>
        <span aria-hidden="true" className={`h-px w-8 ${dark ? "bg-on-dark/50" : "bg-terra/60"}`} />
        {eyebrow}
      </p>
      <Title id={id} data-edit-field="title" className={`font-display mt-4 text-4xl leading-[1.02] sm:text-5xl lg:text-6xl ${dark ? "text-on-dark" : "text-olive"}`}>
        {title}
      </Title>
      {body && (
        <RichText
          field="body"
          text={body}
          className={`mt-6 grid gap-4 text-lg leading-relaxed ${dark ? "text-on-dark" : "text-muted"} ${align === "center" ? "mx-auto max-w-2xl" : ""}`}
        />
      )}
      {highlight && (
        <p data-edit-field="highlight" className={`font-display mt-5 text-xl ${dark ? "text-on-dark" : "text-terra"}`}>{highlight}</p>
      )}
    </header>
  );
}
