import { getTranslations } from "next-intl/server";
import { MediaImage } from "@/components/media-image";
import { RichText } from "@/components/rich-text";
import type { Service } from "@/lib/supabase/content";
import { ShowOnMapButton } from "./show-on-map-button";

/** Piscines i tobogans: la foto gran de la piscina de fons (la del servei, 2400 px), sota un vel blau. Els textos surten dels serveis de l'admin. */
export async function Pools({ pools, slides, onMap, index }: { pools: Service; slides?: Service; onMap: Set<string>; index: number }) {
  const t = await getTranslations("pools");
  const blocks = [pools, slides].filter((s): s is Service => Boolean(s));
  return (
    <section aria-labelledby="pools-title" className="cv relative isolate overflow-hidden bg-band-sea py-24 text-on-dark lg:py-32">
      {pools.media && <MediaImage media={pools.media} alt="" fill sizes="100vw" className="-z-20 object-cover" />}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgb(10_52_64/.78)_0%,rgb(15_76_92/.5)_45%,rgb(10_52_64/.85)_100%)]" />
      <div id="pools" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal max-w-3xl">
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-on-dark">
            <span className="font-display text-sm normal-case tracking-normal">{String(index).padStart(2, "0")}</span>
            <span aria-hidden="true" className="h-px w-8 bg-on-dark/50" />
            {t("eyebrow")}
          </p>
          <h2 id="pools-title" className="font-display mt-4 text-5xl leading-none sm:text-6xl lg:text-7xl">
            {pools.name}{" "}
            {slides && <span className="text-foam">&amp; {slides.name.toLocaleLowerCase()}</span>}
          </h2>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {blocks.map((s) => (
            <article key={s.slug} className="reveal rounded-[2rem] bg-[#0a3440]/70 p-7 ring-1 ring-on-dark/25 backdrop-blur-md lg:p-9">
              <h3 className="font-display text-3xl text-foam">{s.name}</h3>
              <RichText text={s.description} className="mt-4 grid gap-4 text-lg leading-relaxed text-on-dark [&_strong]:font-bold" />
              {onMap.has(`service:${s.slug}`) && <ShowOnMapButton target={{ type: "service", slug: s.slug }} className="mt-6 text-base text-foam" />}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
