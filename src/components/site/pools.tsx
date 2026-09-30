import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Service } from "@/lib/supabase/content";

/** Piscines i tobogans: el servei estrella del càmping, amb foto a sang. Surt dels serveis de l'admin. */
export async function Pools({ pools, slides, index }: { pools: Service; slides?: Service; index: number }) {
  const t = await getTranslations("pools");
  return (
    <section aria-labelledby="pools-title" className="cv relative isolate overflow-hidden bg-band-sea py-24 text-on-dark lg:py-36">
      {pools.media && <MediaImage media={pools.media} fill sizes="100vw" className="-z-10 object-cover" />}
      <div aria-hidden="true" className="caustics absolute inset-0 -z-10 overflow-hidden" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(8_45_56/.85)_0%,rgb(8_45_56/.55)_50%,rgb(8_45_56/.1)_100%)]" />
      <div id="pools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal max-w-xl">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-on-dark/80">
            <span className="font-display text-sm normal-case tracking-normal">{String(index).padStart(2, "0")}</span>
            <span aria-hidden="true" className="h-px w-8 bg-on-dark/50" />
            {t("eyebrow")}
          </p>
          <h2 id="pools-title" className="font-display mt-4 text-5xl leading-none sm:text-6xl lg:text-7xl">
            {pools.name}{" "}
            {slides && (
              <>
                <br />
                <span className="text-foam">&amp; {slides.name.toLocaleLowerCase()}</span>
              </>
            )}
          </h2>
          <RichText text={pools.description} className="mt-6 grid gap-4 text-lg leading-relaxed text-on-dark/90 [&_strong]:text-on-dark" />
          {slides?.description && <RichText text={slides.description} className="mt-4 grid gap-4 text-lg leading-relaxed text-on-dark/90 [&_strong]:text-on-dark" />}
        </div>
      </div>
    </section>
  );
}
