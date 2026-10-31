import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";

const PAGES = ["accommodations", "gastronomy", "surroundings", "gallery"];

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}`]));
  const home = routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    changeFrequency: "weekly" as const,
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
  const pages = PAGES.flatMap((page) => {
    const pageLanguages = Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}/${page}`]));
    return routing.locales.map((locale) => ({
      url: `${siteUrl}/${locale}/${page}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages: pageLanguages },
    }));
  });
  return [...home, ...pages];
}
