/**
 * URL pública de la web, per a canòniques, hreflang i sitemap.
 * NEXT_PUBLIC_SITE_URL quan hi hagi domini; a les previsualitzacions de Vercel, la URL del desplegament.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
