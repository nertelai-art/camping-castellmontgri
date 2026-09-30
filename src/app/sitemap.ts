import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}`]));
  return routing.locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
}
