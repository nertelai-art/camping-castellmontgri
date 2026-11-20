import { RichText } from "@/components/rich-text";

type Props = {
  id: string;
  eyebrow: string | null;
  title: string;
  body?: string | null;
  highlight?: string | null;
  tone?: "light" | "dark";
  align?: "left" | "center";
  /** Nivell del titular: 1 quan la secció és tota la pàgina. */
  level?: 1 | 2;
};

/** Capçalera de secció: el text petit de sobre el títol (si n'hi ha) i el titular gran. */
export function SectionHeading({ id, eyebrow, title, body, highlight, tone = "light", align = "left", level = 2 }: Props) {
  const dark = tone === "dark";
  const Title = level === 1 ? "h1" : "h2";
  return (
    <header className={`reveal max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}>
      {eyebrow && (
        <p data-edit-field="eyebrow" className={`mb-4 text-xs font-bold uppercase tracking-[0.22em] ${dark ? "text-on-dark" : "text-terra"}`}>
          {eyebrow}
        </p>
      )}
      <Title id={id} data-edit-field="title" className={`font-display text-4xl leading-[1.02] sm:text-5xl lg:text-6xl ${dark ? "text-on-dark" : "text-olive"}`}>
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
