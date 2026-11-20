/**
 * URL pública de la web, per a canòniques, hreflang i sitemap.
 * NEXT_PUBLIC_SITE_URL quan hi hagi domini; a les previsualitzacions de Vercel, la URL del desplegament.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * La web del càmping per a qui la visita o per a un assistent d'IA («El teu viatge»): el domini propi. `siteUrl` no serveix per a
 * això: a Vercel, sense domini, és l'adreça interna de cada desplegament, que canvia i no es pot llegir de fora. Mentre el domini
 * tingui la web antiga, s'hi llegeix el mateix contingut; quan la nova s'hi publiqui, NEXT_PUBLIC_SITE_URL hi apuntarà.
 */
export const brandSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.camping-castellmontgri.com").replace(/\/$/, "");
