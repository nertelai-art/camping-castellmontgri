"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Les opinions en carrusel: tres a la vista a l'escriptori (dues a la tauleta, una i mig al mòbil) i una fletxa a cada costat que
 * avança o recula una targeta. Per sota és un scroll horitzontal amb imant (`scroll-snap`): al mòbil es passa amb el dit, i sense
 * JS es veuen igual. Les fletxes s'apaguen a cada extrem i no surten si totes les targetes ja hi caben.
 */
export function ReviewCarousel({ children, previous, next }: { children: ReactNode; previous: string; next: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  const move = (direction: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector("li");
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const scrollable = !(edges.start && edges.end);
  const arrow = (direction: 1 | -1) => (
    <button
      type="button"
      onClick={() => move(direction)}
      disabled={direction === -1 ? edges.start : edges.end}
      aria-label={direction === -1 ? previous : next}
      className={`grid size-12 shrink-0 place-items-center rounded-full border border-line bg-card text-olive shadow-md transition hover:border-olive hover:bg-olive hover:text-paper disabled:pointer-events-none disabled:opacity-35 lg:absolute lg:top-1/2 lg:-translate-y-1/2 ${
        direction === -1 ? "lg:-left-6" : "lg:-right-6"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path d={direction === -1 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  return (
    <div className="relative mt-12">
      <ul
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden [&>li]:w-[85%] [&>li]:shrink-0 [&>li]:snap-start md:[&>li]:w-[calc((100%-1.25rem)/2)] lg:[&>li]:w-[calc((100%-2.5rem)/3)]"
      >
        {children}
      </ul>
      {scrollable && (
        <div className="mt-6 flex justify-center gap-3 lg:mt-0">
          {arrow(-1)}
          {arrow(1)}
        </div>
      )}
    </div>
  );
}
