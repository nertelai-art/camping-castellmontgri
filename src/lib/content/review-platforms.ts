// Quina plataforma de ressenyes és cada fila de `review_platforms`, pel nom que hi escriu el client («Booking.com», «Google»,
// «TripAdvisor»…): així la targeta pot portar el seu logo. Un nom que no es reconeix porta una insígnia amb la inicial.

export const REVIEW_BRANDS = ["google", "tripadvisor", "booking", "campings"] as const;
export type ReviewBrand = (typeof REVIEW_BRANDS)[number];

const RULES: [ReviewBrand, RegExp][] = [
  ["google", /\bgoogle\b/],
  ["tripadvisor", /trip\s*advisor/],
  ["booking", /\bbooking\b/],
  ["campings", /\bcampings\b/],
];

export function reviewBrand(platform: string): ReviewBrand | null {
  const name = platform.toLowerCase();
  return RULES.find(([, rule]) => rule.test(name))?.[0] ?? null;
}

/** La inicial per a la insígnia d'una plataforma sense logo: la primera lletra o xifra del nom. */
export const platformInitial = (platform: string) => platform.trim().match(/[\p{L}\p{N}]/u)?.[0]?.toUpperCase() ?? "?";
