import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Section } from "@/lib/supabase/content";
import { MontgriLine } from "./montgri-line";

/**
 * Benvinguda: el text entre fotos, amb la carena del Montgrí de paisatge.
 * La primera foto de la galeria de la secció és la del mig; la resta, les del voltant. Es canvien des del panell. La composició és a `.welcome` (globals.css).
 */
export function Welcome({ section }: { section: Section }) {
  const [main = section.media, ...around] = section.gallery;

  return (
    <section data-edit="sections:welcome" id="welcome" aria-labelledby="welcome-title" className="welcome">
      <div className="welcome-stage">
        <div className="welcome-intro">
          <h2 id="welcome-title" data-edit-field="title" className="font-display text-4xl leading-[1.04] text-olive sm:text-5xl xl:text-6xl">
            {section.title}
          </h2>
          <RichText field="body" text={section.body} className="mt-5 grid gap-4 text-base leading-relaxed text-muted sm:text-lg [&_strong]:font-bold [&_strong]:text-ink" />
        </div>

        <div className="welcome-ridge">
          <MontgriLine className="block h-full w-full text-olive/70" fillClassName="fill-paper-2" />
        </div>

        <div className="welcome-photos">
          {main && (
            <div className="welcome-main">
              <MediaImage media={main} fill sizes="(min-width: 1024px) 30vw, 100vw" className="object-cover" />
            </div>
          )}
          {around.slice(0, 6).map((photo, i) => (
            <div key={photo.path} aria-hidden="true" className="welcome-tile" data-slot={i + 1}>
              <MediaImage media={photo} alt="" fill sizes="(min-width: 1024px) 22vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
