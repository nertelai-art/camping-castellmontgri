import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  // Les previsualitzacions (Vercel) no s'han d'indexar: només el domini definitiu.
  const isProduction = process.env.VERCEL_ENV === "production";
  return {
    rules: isProduction ? { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] } : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
