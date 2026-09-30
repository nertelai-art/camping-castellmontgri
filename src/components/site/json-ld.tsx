import type { SiteSettings } from "@/lib/supabase/content";

/** Dades estructurades schema.org/Campground per als cercadors. Tot surt de la configuració. */
export function CampgroundJsonLd({ settings, url, image }: { settings: SiteSettings; url: string; image?: string }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Campground",
    name: settings.brandName,
    legalName: settings.legalName,
    url,
    image,
    telephone: settings.phone?.e164 ?? undefined,
    email: settings.emails.info ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address.street ?? undefined,
      postalCode: settings.address.postalCode ?? undefined,
      addressLocality: settings.address.locality ?? undefined,
      addressRegion: settings.address.region ?? undefined,
      addressCountry: settings.address.country ?? undefined,
    },
    geo: settings.geo ? { "@type": "GeoCoordinates", latitude: settings.geo.lat, longitude: settings.geo.lng } : undefined,
  };
  // JSON.stringify no escapa «<»: el substituïm perquè un text de l'admin no pugui tancar l'script.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
