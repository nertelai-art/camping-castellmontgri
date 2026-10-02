import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}`]));
  const home = routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
  const accommodationLanguages = Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}/accommodations`]));
  const accommodations = routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}/accommodations`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: { languages: accommodationLanguages },
  }));
  return [...home, ...accommodations];
}
