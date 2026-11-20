// D'on ve la visita, per a l'analítica de nertel.ai. El mateix format a totes les webs de clients:
// el host sense protocol ni «www.». Encara no hi ha domini del client: quan la web passi al seu domini,
// s'ha de canviar per aquell domini.
const SOURCE = "camping-castellmontgri.vercel.app";

// Els idiomes que té nertel.ai. Si la pàgina és en un altre (aquí, el neerlandès), es porta a l'anglès.
const NERTEL_LOCALES = ["ca", "es", "en", "fr", "it", "de"];

export function nertelCreditUrl(locale: string) {
  const path = NERTEL_LOCALES.includes(locale) ? locale : "en";
  return `https://nertel.ai/${path}?utm_source=${SOURCE}&utm_medium=credit`;
}
