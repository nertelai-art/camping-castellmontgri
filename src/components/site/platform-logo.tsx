import { platformInitial, reviewBrand, type ReviewBrand } from "@/lib/content/review-platforms";

// El logo de cada plataforma de ressenyes, a la seva targeta. Google i Tripadvisor són els dibuixos de Simple Icons
// (CC0, simpleicons.org) en el color de la marca; Booking.com i Campings.com, una insígnia amb la inicial en el seu color
// (Booking va demanar que el seu logo sortís de Simple Icons). La resta, la inicial sobre gris.

const PATHS: Partial<Record<ReviewBrand, string>> = {
  google: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
  tripadvisor: "M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.972 5.972 0 0 0 4.072 1.598 6 6 0 0 0 6-5.998 5.982 5.982 0 0 0-1.957-4.432L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.903C13.943 8.138 12 10.43 12 13.1c0-2.671-1.942-4.962-4.504-5.942A11.72 11.72 0 0 1 12 6.256zM6.002 9.157a4.059 4.059 0 1 1 0 8.118 4.059 4.059 0 0 1 0-8.118zm11.992.002a4.057 4.057 0 1 1 .003 8.115 4.057 4.057 0 0 1-.003-8.115zm-11.992 1.93a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256zm11.992 0a2.128 2.128 0 0 0 0 4.256 2.128 2.128 0 0 0 0-4.256z",
};

const COLORS: Record<ReviewBrand, string> = {
  google: "#4285F4",
  tripadvisor: "#00AF87",
  booking: "#003B95",
  campings: "#E2001A",
};

export function PlatformLogo({ platform, className = "size-9" }: { platform: string; className?: string }) {
  const brand = reviewBrand(platform);
  const path = brand && PATHS[brand];
  if (path) {
    return (
      <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-xl bg-white ring-1 ring-line ${className}`}>
        <svg viewBox="0 0 24 24" className="size-[62%]" style={{ color: COLORS[brand] }}>
          <path d={path} fill="currentColor" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-xl font-display text-lg font-bold text-white ${brand ? "" : "bg-muted"} ${className}`}
      style={brand ? { backgroundColor: COLORS[brand] } : undefined}
    >
      <span>
        {platformInitial(platform)}
        {brand === "booking" && <span className="text-[#5BBAFF]">.</span>}
      </span>
    </span>
  );
}
