import { siteUrl } from "@/lib/site-url";
import type { Accommodation, SiteSettings } from "@/lib/supabase/content";

// Dades estructurades schema.org per als cercadors i els assistents d'IA. Tot surt de la configuració i del contingut del panell:
// cap dada escrita aquí. Les notes de les plataformes no hi van com a `aggregateRating`: són de tercers, i Google no les accepta així.

/** Com coneixen el càmping la resta de blocs (els allotjaments en formen part): un sol identificador en tots els idiomes. */
const CAMPGROUND_ID = `${siteUrl}/#campground`;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function JsonLd({ data }: { data: object }) {
  // JSON.stringify no escapa «<»: el substituïm perquè un text de l'admin no pugui tancar l'script.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

type CampgroundProps = {
  settings: SiteSettings;
  url: string;
  image?: string;
  description?: string | null;
  /** On més es parla del càmping (Booking, Google, Tripadvisor…): ajuda a saber que és el mateix lloc. */
  sameAs?: readonly string[];
  /** Els serveis del càmping, pel nom. */
  amenities?: readonly string[];
};

/** El càmping: qui és, on és, quan obre, què té i on es reserva. */
export function CampgroundJsonLd({ settings, url, image, description, sameAs = [], amenities = [] }: CampgroundProps) {
  const { season, geo } = settings;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Campground",
        "@id": CAMPGROUND_ID,
        name: settings.brandName,
        legalName: settings.legalName,
        description: description ?? undefined,
        url,
        image,
        logo: `${siteUrl}/icon.png`,
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
        geo: geo ? { "@type": "GeoCoordinates", latitude: geo.lat, longitude: geo.lng } : undefined,
        hasMap: geo ? `https://www.google.com/maps/search/?api=1&query=${geo.lat},${geo.lng}` : undefined,
        // Obert tot el dia durant la temporada.
        openingHoursSpecification:
          season.open && season.close ? { "@type": "OpeningHoursSpecification", dayOfWeek: DAYS, opens: "00:00", closes: "23:59", validFrom: season.open, validThrough: season.close } : undefined,
        amenityFeature: amenities.length ? amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })) : undefined,
        identifier: settings.licenseCode ? { "@type": "PropertyValue", name: "Registre de Turisme de Catalunya", value: settings.licenseCode } : undefined,
        sameAs: sameAs.length ? sameAs : undefined,
        potentialAction: settings.bookingUrl ? { "@type": "ReserveAction", target: settings.bookingUrl } : undefined,
      }}
    />
  );
}

/** La ruta d'una pàgina (Inici › Allotjaments › …). L'última no porta adreça: és la pàgina mateixa. */
export function BreadcrumbJsonLd({ items }: { items: readonly { name: string; url?: string }[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
      }}
    />
  );
}

/** Un allotjament: per a quantes persones, quina mida, quantes habitacions i què té. Forma part del càmping. */
export function AccommodationJsonLd({ accommodation: a, url, description, amenities }: { accommodation: Accommodation; url: string; description?: string; amenities: readonly string[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Accommodation",
        name: a.name,
        description,
        url,
        image: [a.cover, ...a.gallery].filter((m) => m !== null).map((m) => m.src).filter((src, i, all) => all.indexOf(src) === i).slice(0, 6),
        occupancy: a.capacityMax ? { "@type": "QuantitativeValue", maxValue: a.capacityMax } : undefined,
        floorSize: a.sizeM2 ? { "@type": "QuantitativeValue", value: Number(a.sizeM2), unitCode: "MTK" } : undefined,
        numberOfBedrooms: a.bedrooms ?? undefined,
        numberOfBathroomsTotal: a.bathrooms ?? undefined,
        amenityFeature: amenities.length ? amenities.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })) : undefined,
        containedInPlace: { "@id": CAMPGROUND_ID },
      }}
    />
  );
}
